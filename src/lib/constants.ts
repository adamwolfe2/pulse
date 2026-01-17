import type { TriggerType, UserSettings } from "~/types"

// Trigger Patterns
export const TRIGGER_PATTERNS: Record<TriggerType, RegExp[]> = {
  github_repo: [
    /github\.com\/[\w-]+\/[\w-]+$/,
    /github\.com\/[\w-]+\/[\w-]+\/?$/
  ],
  long_article: [
    /medium\.com/,
    /dev\.to/,
    /hashnode\.dev/,
    /substack\.com/
  ],
  shopping: [
    /amazon\./,
    /ebay\./,
    /walmart\./,
    /target\.com/,
    /bestbuy\.com/
  ],
  documentation: [
    /docs\./,
    /documentation/,
    /\/docs\//,
    /readme/i
  ],
  social_media: [
    /twitter\.com|x\.com/,
    /linkedin\.com/,
    /facebook\.com/
  ],
  video: [
    /youtube\.com/,
    /vimeo\.com/,
    /twitch\.tv/
  ],
  news: [
    /news\./,
    /\/news\//,
    /bbc\./,
    /cnn\.com/,
    /nytimes\.com/
  ],
  recipe: [
    /recipe/i,
    /allrecipes\.com/,
    /food\.com/
  ],
  clipboard_code: [],
  clipboard_text: [],
  idle: []
}

// Default Settings
export const DEFAULT_SETTINGS: UserSettings = {
  apiKey: "",
  enabled: true,
  darkMode: "auto",
  position: "top",
  triggers: {
    github_repo: true,
    long_article: true,
    shopping: true,
    clipboard_code: true,
    clipboard_text: false,
    documentation: true,
    social_media: true,
    video: true,
    news: true,
    recipe: true,
    idle: false
  },
  shortcuts: {
    toggle: "Ctrl+Shift+G",
    dismiss: "Escape",
    expand: "Enter"
  },
  personalization: {
    interests: []
  },
  onboardingComplete: false
}

// Animation Durations (in seconds)
export const ANIMATIONS = {
  stateTransition: 0.3,
  expand: 0.4,
  peek: 0.2,
  dismiss: 0.25
}

// Bar Dimensions
export const BAR_DIMENSIONS: Record<string, { width: number | string; height: number | string }> = {
  dormant: { width: 48, height: 28 },
  peeking: { width: 200, height: 36 },
  visible: { width: 400, height: 64 },
  expanded: { width: 440, height: "auto" },
  confirming: { width: 320, height: 80 }
}

// Timing (in milliseconds)
export const TIMING = {
  peekDelay: 2000,      // 2s before showing peek
  autoExpand: 500,      // 0.5s hover to expand
  autoDismiss: 15000,   // 15s auto-dismiss
  idleThreshold: 30000, // 30s idle detection
  debounceContext: 1000 // 1s debounce for context extraction
}

// Storage Keys
export const STORAGE_KEYS = {
  settings: "ghost_settings",
  history: "ghost_history",
  onboarding: "ghost_onboarding"
}
