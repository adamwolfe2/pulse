import type { PageContext, TriggerType, UserSettings, Suggestion } from "~/types"
import { TIMING } from "./constants"
import { extractPageContext, detectTriggerType } from "./contextExtractor"
import { generateSuggestion } from "./claude"

interface TriggerEngineConfig {
  settings: UserSettings
  onSuggestion: (suggestion: Suggestion) => void
  onError: (error: string) => void
  onLoading?: (loading: boolean) => void
}

class TriggerEngine {
  private config: TriggerEngineConfig
  private lastTrigger: number = 0
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private idleTimer: ReturnType<typeof setTimeout> | null = null
  private lastActivity: number = Date.now()
  private currentContext: PageContext | null = null
  private isProcessing: boolean = false
  private observer: MutationObserver | null = null

  constructor(config: TriggerEngineConfig) {
    this.config = config
    this.setupListeners()
  }

  private setupListeners(): void {
    // Page load/navigation
    this.handlePageChange()

    // URL change detection (SPA support)
    this.observer = new MutationObserver(() => {
      if (window.location.href !== this.currentContext?.url) {
        this.handlePageChange()
      }
    })
    this.observer.observe(document, { subtree: true, childList: true })

    // Activity tracking for idle detection
    const activityEvents = ["mousemove", "keydown", "scroll", "click"]
    activityEvents.forEach((event) => {
      document.addEventListener(event, this.handleActivity.bind(this), { passive: true })
    })

    // Start idle detection
    this.startIdleDetection()
  }

  private handleActivity(): void {
    this.lastActivity = Date.now()

    // Reset idle timer
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
    }
    this.startIdleDetection()
  }

  private startIdleDetection(): void {
    if (!this.config.settings.triggers.idle) return

    this.idleTimer = setTimeout(() => {
      this.handleIdleTrigger()
    }, TIMING.idleThreshold)
  }

  private async handleIdleTrigger(): Promise<void> {
    if (!this.shouldTrigger("idle")) return

    await this.processTrigger("idle")
  }

  private async handlePageChange(): Promise<void> {
    // Debounce rapid changes
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(async () => {
      const context = extractPageContext()
      this.currentContext = context

      const triggerType = detectTriggerType(context.url)

      if (this.shouldTrigger(triggerType)) {
        await this.processTrigger(triggerType, context)
      }
    }, TIMING.debounceContext)
  }

  private shouldTrigger(type: TriggerType): boolean {
    // Check if trigger type is enabled
    if (!this.config.settings.triggers[type]) {
      return false
    }

    // Rate limiting - minimum 5 seconds between triggers
    const now = Date.now()
    if (now - this.lastTrigger < 5000) {
      return false
    }

    // Don't trigger if already processing
    if (this.isProcessing) {
      return false
    }

    // Don't trigger if no API key
    if (!this.config.settings.apiKey) {
      return false
    }

    return true
  }

  private async processTrigger(
    type: TriggerType,
    context?: PageContext
  ): Promise<void> {
    if (!this.config.settings.apiKey) {
      return
    }

    this.isProcessing = true
    this.lastTrigger = Date.now()
    this.config.onLoading?.(true)

    try {
      const pageContext = context || this.currentContext
      if (!pageContext) {
        throw new Error("No page context available")
      }

      const suggestion = await generateSuggestion({
        context: pageContext,
        triggerType: type,
        userInterests: this.config.settings.personalization.interests,
        userName: this.config.settings.personalization.name
      })

      this.config.onSuggestion(suggestion)
    } catch (error) {
      this.config.onError(
        error instanceof Error ? error.message : "Failed to generate suggestion"
      )
    } finally {
      this.isProcessing = false
      this.config.onLoading?.(false)
    }
  }

  // Public API
  public async triggerManually(): Promise<void> {
    const context = extractPageContext()
    const type = detectTriggerType(context.url)
    await this.processTrigger(type, context)
  }

  public updateConfig(newConfig: Partial<TriggerEngineConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  public getContext(): PageContext | null {
    return this.currentContext
  }

  public destroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    if (this.idleTimer) clearTimeout(this.idleTimer)
    if (this.observer) this.observer.disconnect()
  }
}

let engineInstance: TriggerEngine | null = null

export function initializeTriggerEngine(config: TriggerEngineConfig): TriggerEngine {
  if (engineInstance) {
    engineInstance.destroy()
  }
  engineInstance = new TriggerEngine(config)
  return engineInstance
}

export function getTriggerEngine(): TriggerEngine | null {
  return engineInstance
}
