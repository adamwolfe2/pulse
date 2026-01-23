import { create } from "zustand"
import type { Suggestion } from "../types"
import { generateContextualSuggestion } from "../lib/claude"

interface Keybind {
  id: string
  action: string
  keys: string[]
  enabled: boolean
}

interface PulseState {
  // Current suggestion being displayed
  currentSuggestion: Suggestion | null

  // Suggestion history
  history: Suggestion[]

  // Loading state
  isLoading: boolean

  // Error state
  error: string | null

  // Settings
  settings: {
    apiKey: string
    enabled: boolean
    // Appearance
    accentColor: string
    accentColor2: string
    reducedMotion: boolean
    compactMode: boolean
    // Behavior
    screenCaptureEnabled: boolean
    proactiveEnabled: boolean
    proactiveInterval: number
    voiceEnabled: boolean
    launchAtLogin: boolean
    alwaysOnTop: boolean
    // AI Settings
    aiTemperature: number
    aiModel: 'claude-sonnet-4-20250514' | 'claude-3-haiku-20240307'
    // Notifications
    notificationsEnabled: boolean
    soundEnabled: boolean
    // Privacy
    analyticsEnabled: boolean
    // Keybinds
    keybinds: Keybind[]
  }

  // Actions
  setSuggestion: (suggestion: Suggestion | null) => void
  addToHistory: (suggestion: Suggestion) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateSettings: (settings: Partial<PulseState["settings"]>) => void
  triggerNewSuggestion: () => Promise<void>
}

// Load API key from secure vault (async) - returns empty string synchronously
// The actual key is loaded asynchronously via initializeApiKey
const getStoredApiKey = (): string => {
  // Return empty initially; the key will be loaded from vault asynchronously
  return ""
}

// Initialize API key from secure vault
export async function initializeApiKey(): Promise<string> {
  try {
    // Try to get from secure vault first
    const vaultKey = await window.pulse?.vault?.get("anthropic_api_key")
    if (vaultKey) {
      return vaultKey
    }

    // Fall back to localStorage for migration
    const legacyKey = localStorage.getItem("pulse_api_key")
    if (legacyKey) {
      // Migrate to secure vault
      await window.pulse?.vault?.set("anthropic_api_key", legacyKey)
      // Clear from localStorage
      localStorage.removeItem("pulse_api_key")
      return legacyKey
    }

    return ""
  } catch {
    return ""
  }
}

// Load settings from localStorage
const getStoredSettings = () => {
  try {
    const stored = localStorage.getItem("pulse_settings")
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

const defaultKeybinds: Keybind[] = [
  { id: "toggle-chat", action: "Toggle Chat Overlay", keys: ["CommandOrControl", "Shift", "G"], enabled: true },
  { id: "voice-mode", action: "Voice Input Mode", keys: ["CommandOrControl", "Shift", "V"], enabled: true },
  { id: "screenshot", action: "Capture Screen", keys: ["CommandOrControl", "Shift", "S"], enabled: true },
  { id: "hide-overlay", action: "Hide Overlay", keys: ["Escape"], enabled: true },
]

export const usePulseStore = create<PulseState>((set, get) => {
  const storedSettings = getStoredSettings()

  return {
  currentSuggestion: null,
  history: [],
  isLoading: false,
  error: null,
  settings: {
    apiKey: getStoredApiKey(),
    enabled: true,
    // Appearance
    accentColor: storedSettings.accentColor || "#6366f1",
    accentColor2: storedSettings.accentColor2 || "#8b5cf6",
    reducedMotion: storedSettings.reducedMotion ?? false,
    compactMode: storedSettings.compactMode ?? false,
    // Behavior
    screenCaptureEnabled: storedSettings.screenCaptureEnabled ?? true,
    proactiveEnabled: storedSettings.proactiveEnabled ?? false,
    proactiveInterval: storedSettings.proactiveInterval ?? 30,
    voiceEnabled: storedSettings.voiceEnabled ?? true,
    launchAtLogin: storedSettings.launchAtLogin ?? false,
    alwaysOnTop: storedSettings.alwaysOnTop ?? true,
    // AI Settings
    aiTemperature: storedSettings.aiTemperature ?? 0.7,
    aiModel: storedSettings.aiModel ?? 'claude-sonnet-4-20250514',
    // Notifications
    notificationsEnabled: storedSettings.notificationsEnabled ?? true,
    soundEnabled: storedSettings.soundEnabled ?? true,
    // Privacy
    analyticsEnabled: storedSettings.analyticsEnabled ?? false,
    // Keybinds
    keybinds: storedSettings.keybinds || defaultKeybinds,
  },

  setSuggestion: (suggestion) => {
    set({ currentSuggestion: suggestion })
    if (suggestion) {
      get().addToHistory(suggestion)
    }
  },

  addToHistory: (suggestion) => {
    set((state) => ({
      history: [suggestion, ...state.history].slice(0, 50)
    }))
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  updateSettings: (newSettings) => {
    set((state) => {
      const updated = { ...state.settings, ...newSettings }
      // Persist settings to localStorage (except API key)
      try {
        const settingsToStore = { ...updated }
        delete (settingsToStore as { apiKey?: string }).apiKey
        localStorage.setItem("pulse_settings", JSON.stringify(settingsToStore))
        // API key is stored in secure vault, not localStorage
        if (newSettings.apiKey) {
          window.pulse?.vault?.set("anthropic_api_key", newSettings.apiKey)
        }
      } catch {
        // Ignore storage errors
      }
      return { settings: updated }
    })
  },

  triggerNewSuggestion: async () => {
    const { settings, setLoading, setError, setSuggestion } = get()

    if (!settings.apiKey || !settings.enabled) {
      // Use a demo suggestion if no API key
      setSuggestion(getDemoSuggestion())
      return
    }

    setLoading(true)
    setError(null)

    try {
      const suggestion = await generateContextualSuggestion(settings.apiKey)
      setSuggestion(suggestion)
    } catch (error) {
      console.error("Failed to generate suggestion:", error)
      setError(error instanceof Error ? error.message : "Failed to generate suggestion")
      // Fall back to demo
      setSuggestion(getDemoSuggestion())
    } finally {
      setLoading(false)
    }
  }
}})

// Demo suggestions that cycle through
let demoIndex = 0
function getDemoSuggestion(): Suggestion {
  const demos: Suggestion[] = [
    {
      id: `demo-${Date.now()}-1`,
      type: "music",
      title: "Would you mind if I play the perfect track for this moment?",
      thumbnail: {
        type: "icon",
        icon: "🎵"
      },
      detail: {
        subtitle: "Ambient",
        title: "Focus Flow",
        description: "Perfect for deep work",
        meta: [{ text: "45:00" }],
        sideAction: {
          id: "play",
          label: "Play",
          icon: "▶"
        }
      },
      hint: '"Play" to start',
      timestamp: Date.now()
    },
    {
      id: `demo-${Date.now()}-2`,
      type: "reminder",
      title: "You've been working for 2 hours straight.",
      detail: {
        title: "Time for a break?",
        description: "A 5-minute walk can boost creativity by 60%",
        inlineAction: {
          id: "snooze",
          label: "Remind me in 30 min",
          icon: "⏰"
        }
      },
      actions: [
        { id: "break", label: "Take a break", icon: "🚶", primary: true },
        { id: "dismiss", label: "Keep working" }
      ],
      timestamp: Date.now()
    },
    {
      id: `demo-${Date.now()}-3`,
      type: "general",
      title: "I noticed you're researching AI assistants.",
      detail: {
        title: "Want me to summarize the key points?",
        description: "I can create a quick comparison of the top 5 options you've looked at"
      },
      actions: [
        { id: "summarize", label: "Yes, summarize", icon: "📝", primary: true },
        { id: "later", label: "Maybe later" }
      ],
      timestamp: Date.now()
    },
    {
      id: `demo-${Date.now()}-4`,
      type: "preference",
      title: "That recipe looks delicious!",
      thumbnail: {
        type: "icon",
        icon: "🍳"
      },
      detail: {
        subtitle: "Based on your preferences",
        title: "You might also like",
        description: "3 similar recipes saved to your collection"
      },
      actions: [
        { id: "view", label: "View recipes", icon: "📖", primary: true }
      ],
      timestamp: Date.now()
    }
  ]

  const suggestion = demos[demoIndex % demos.length]
  demoIndex++
  return suggestion
}
