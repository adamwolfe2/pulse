// Bar States
export type BarState =
  | "dormant"     // Minimal pill, just the icon
  | "peeking"     // Slightly expanded, showing hint of suggestion
  | "visible"     // Full suggestion visible
  | "expanded"    // Detailed view with actions
  | "confirming"  // Action confirmation state

// Trigger Types
export type TriggerType =
  | "github_repo"
  | "long_article"
  | "shopping"
  | "clipboard_code"
  | "clipboard_text"
  | "documentation"
  | "social_media"
  | "video"
  | "news"
  | "recipe"
  | "idle"

// Suggestion Interface
export interface Suggestion {
  id: string
  type: TriggerType
  title: string
  description: string
  actions: SuggestionAction[]
  confidence: number // 0-1
  context?: PageContext
  timestamp: number
}

// Action Button Interface
export interface SuggestionAction {
  id: string
  label: string
  icon: string
  primary?: boolean
  handler: string // Action handler identifier
  payload?: Record<string, unknown>
}

// Page Context
export interface PageContext {
  url: string
  domain: string
  title: string
  description?: string
  contentType: TriggerType
  extractedContent: {
    headings: string[]
    mainText: string
    codeBlocks: string[]
    links: string[]
    metadata: Record<string, string>
  }
  readingTime?: number
  language?: string
}

// User Settings
export interface UserSettings {
  apiKey: string
  enabled: boolean
  darkMode: "auto" | "light" | "dark"
  position: "top" | "bottom"
  triggers: Record<TriggerType, boolean>
  shortcuts: {
    toggle: string
    dismiss: string
    expand: string
  }
  personalization: {
    name?: string
    interests: string[]
    occupation?: string
  }
  onboardingComplete: boolean
}

// Onboarding State
export interface OnboardingState {
  currentStep: 0 | 1 | 2 | 3
  completed: boolean
  permissions: {
    clipboard: boolean
    storage: boolean
    activeTab: boolean
  }
}

// Store State
export interface GhostState {
  // Bar State
  barState: BarState
  isVisible: boolean

  // Current Suggestion
  currentSuggestion: Suggestion | null
  suggestionHistory: Suggestion[]

  // Page Context
  pageContext: PageContext | null

  // Settings
  settings: UserSettings

  // Onboarding
  onboarding: OnboardingState

  // UI State
  isLoading: boolean
  error: string | null
}

// Message Types for Background Communication
export type MessageType =
  | "GET_PAGE_CONTEXT"
  | "GENERATE_SUGGESTION"
  | "EXECUTE_ACTION"
  | "UPDATE_SETTINGS"
  | "GET_CLIPBOARD"
  | "TOGGLE_VISIBILITY"
  | "ANALYZE_SELECTION"
  | "SUMMARIZE_PAGE"
  | "ANALYTICS_EVENT"

export interface Message<T = unknown> {
  type: MessageType
  payload?: T
}

export interface MessageResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
