/**
 * Pulse Constants & Configuration
 *
 * Centralized configuration for all magic numbers, dimensions,
 * timeouts, and feature flags used throughout the application.
 */

// ============================================================================
// WINDOW DIMENSIONS
// ============================================================================

export const WINDOW = {
  /** Main widget window dimensions */
  WIDGET: {
    WIDTH: 420,
    HEIGHT: 380,
    HEIGHT_COMPACT: 72,
    MARGIN: 8,
    MIN_HEIGHT: 200,
    MAX_HEIGHT: 600,
  },

  /** Floating task list window dimensions */
  TASK_LIST: {
    WIDTH: 320,
    HEIGHT: 400,
    MIN_HEIGHT: 150,
    MAX_HEIGHT: 600,
    MIN_WIDTH: 280,
  },

  /** Dynamic Island dimensions */
  DYNAMIC_ISLAND: {
    WIDTH_PILL: 160,
    HEIGHT_PILL: 36,
    WIDTH_EXPANDED: 380,
    HEIGHT_EXPANDED: 280,
  },

  /** Settings window dimensions */
  SETTINGS: {
    WIDTH: 480,
    HEIGHT: 560,
  },
} as const

// ============================================================================
// TIMING & INTERVALS
// ============================================================================

export const TIMING = {
  /** Debounce delays in milliseconds */
  DEBOUNCE: {
    SEARCH: 300,
    RESIZE: 100,
    INPUT: 150,
    SCROLL: 50,
  },

  /** Animation durations in milliseconds */
  ANIMATION: {
    INSTANT: 0,
    FAST: 150,
    NORMAL: 250,
    SLOW: 400,
    VERY_SLOW: 600,
  },

  /** Polling intervals in milliseconds */
  POLLING: {
    HOVER_DETECTION: 50,      // Dynamic Island hover check
    EDGE_ACTIVATION: 100,     // Screen edge detection
    NETWORK_CHECK: 30000,     // Network status check
    AUTO_UPDATE: 14400000,    // 4 hours in ms
  },

  /** Timeouts in milliseconds */
  TIMEOUT: {
    API_REQUEST: 60000,       // 60 seconds for API calls
    SCREENSHOT: 5000,         // 5 seconds for screenshot capture
    TOAST_AUTO_DISMISS: 5000, // Toast notification duration
    SHORTCUT_DEBOUNCE: 300,   // Prevent rapid shortcut triggers
    DISMISS_DELAY: 100,       // Quick dismiss for hover elements
    HOVER_EXPAND: 400,        // Delay before expanding hover elements
    HOVER_SHOW: 150,          // Delay before showing hover elements
  },

  /** Intervals for features */
  INTERVALS: {
    PROACTIVE_SUGGESTION: 30000,  // 30 seconds
    PROACTIVE_INITIAL: 5000,      // 5 seconds initial delay
  },
} as const

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API = {
  /** Claude API settings */
  CLAUDE: {
    DEFAULT_MODEL: 'claude-sonnet-4-20250514',
    MODELS: {
      SONNET: 'claude-sonnet-4-20250514',
      HAIKU: 'claude-3-5-haiku-20241022',
      OPUS: 'claude-3-opus-20240229',
    },
    MAX_TOKENS: 8192,
    DEFAULT_TEMPERATURE: 0.7,
  },

  /** Context window management */
  CONTEXT: {
    MAX_CONTEXT_TOKENS: 200000,
    RESPONSE_TOKEN_RESERVE: 4096,
    WARNING_THRESHOLD: 0.8,     // Warn at 80% usage
    TRUNCATION_THRESHOLD: 0.95, // Truncate at 95% usage
  },

  /** Retry configuration */
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000,
    MAX_DELAY: 10000,
    BACKOFF_MULTIPLIER: 2,
  },
} as const

// ============================================================================
// STORAGE LIMITS
// ============================================================================

export const STORAGE = {
  /** Maximum items to store */
  MAX_CONVERSATIONS: 100,
  MAX_MESSAGES_PER_CONVERSATION: 500,
  MAX_CLIPBOARD_HISTORY: 10,
  MAX_SUGGESTIONS_HISTORY: 50,
  MAX_TASKS: 500,

  /** Storage keys */
  KEYS: {
    SETTINGS: 'pulse_settings',
    ONBOARDING: 'pulse_onboarding_complete',
    CONVERSATIONS: 'pulse_conversations',
    TASKS: 'pulse_tasks',
    WINDOW_POSITION: 'pulse_window_position',
    THEME: 'pulse_theme',
  },
} as const

// ============================================================================
// UI CONFIGURATION
// ============================================================================

export const UI = {
  /** Z-index layers */
  Z_INDEX: {
    DROPDOWN: 100,
    MODAL: 200,
    TOAST: 300,
    TOOLTIP: 400,
    OVERLAY: 500,
  },

  /** Border radius values */
  RADIUS: {
    SMALL: 6,
    MEDIUM: 12,
    LARGE: 16,
    PILL: 9999,
  },

  /** Spacing scale (in pixels) */
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 12,
    LG: 16,
    XL: 24,
    XXL: 32,
  },

  /** Typography */
  TYPOGRAPHY: {
    FONT_FAMILY: "'SF Pro Display', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif",
    FONT_MONO: "'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace",
    SIZES: {
      XS: 10,
      SM: 12,
      MD: 14,
      LG: 16,
      XL: 20,
      XXL: 24,
    },
  },

  /** Accent colors */
  ACCENT_COLORS: [
    { name: 'Indigo', value: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
    { name: 'Blue', value: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
    { name: 'Green', value: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #10b981)' },
    { name: 'Orange', value: '#f97316', gradient: 'linear-gradient(135deg, #f97316, #eab308)' },
    { name: 'Pink', value: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
    { name: 'Purple', value: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #6366f1)' },
  ],
} as const

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

export const SHORTCUTS = {
  /** Default keyboard shortcuts */
  DEFAULTS: {
    TOGGLE_WIDGET: 'CommandOrControl+Shift+G',
    VOICE_MODE: 'CommandOrControl+Shift+V',
    SCREENSHOT: 'CommandOrControl+Shift+S',
    QUICK_TASK: 'CommandOrControl+Shift+T',
    TOGGLE_TASK_LIST: 'CommandOrControl+Shift+L',
    SETTINGS: 'CommandOrControl+,',
    NEW_CONVERSATION: 'CommandOrControl+N',
    COMMAND_PALETTE: 'CommandOrControl+K',
    CLOSE: 'Escape',
  },

  /** Display-friendly shortcut labels */
  LABELS: {
    TOGGLE_WIDGET: '⌘⇧G',
    VOICE_MODE: '⌘⇧V',
    SCREENSHOT: '⌘⇧S',
    QUICK_TASK: '⌘⇧T',
    TOGGLE_TASK_LIST: '⌘⇧L',
    SETTINGS: '⌘,',
    NEW_CONVERSATION: '⌘N',
    COMMAND_PALETTE: '⌘K',
    CLOSE: 'ESC',
  },
} as const

// ============================================================================
// TASK CONFIGURATION
// ============================================================================

export const TASKS = {
  /** Priority markers in task content */
  PRIORITY_MARKERS: {
    HIGH: ['!!!', '!!', 'urgent', 'asap', 'critical'],
    LOW: ['!low', 'someday', 'maybe', 'later'],
  },

  /** Sprint defaults */
  SPRINT: {
    DEFAULT_DURATION: 25 * 60 * 1000, // 25 minutes (Pomodoro)
    SHORT_BREAK: 5 * 60 * 1000,       // 5 minutes
    LONG_BREAK: 15 * 60 * 1000,       // 15 minutes
    SESSIONS_BEFORE_LONG_BREAK: 4,
  },

  /** Task sources */
  SOURCES: ['keyboard', 'voice', 'ai-suggested', 'quick-capture', 'import'] as const,
} as const

// ============================================================================
// ANIMATION PRESETS
// ============================================================================

export const ANIMATIONS = {
  /** Spring animation presets for Framer Motion */
  SPRING: {
    SMOOTH: { type: 'spring', stiffness: 300, damping: 30, mass: 1 },
    SNAPPY: { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 },
    BOUNCY: { type: 'spring', stiffness: 400, damping: 17, mass: 1 },
    GENTLE: { type: 'spring', stiffness: 200, damping: 25, mass: 1 },
    STIFF: { type: 'spring', stiffness: 500, damping: 35, mass: 0.8 },
  },

  /** Easing functions */
  EASING: {
    EASE_OUT_EXPO: [0.16, 1, 0.3, 1],
    EASE_OUT_BACK: [0.34, 1.56, 0.64, 1],
    EASE_SNAPPY: [0.23, 1, 0.32, 1],
    EASE_IN_OUT: [0.4, 0, 0.2, 1],
  },

  /** Stagger delays for list animations */
  STAGGER: {
    FAST: 0.02,
    NORMAL: 0.05,
    SLOW: 0.1,
  },
} as const

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURES = {
  /** Toggle features on/off */
  ENABLE_DYNAMIC_ISLAND: true,
  ENABLE_PROACTIVE_SUGGESTIONS: true,
  ENABLE_EDGE_ACTIVATION: true,
  ENABLE_VOICE_INPUT: true,
  ENABLE_SCREENSHOT_ANALYSIS: true,
  ENABLE_TASK_SPRINTS: true,
  ENABLE_COMMAND_PALETTE: true,
  ENABLE_AUTO_UPDATE: true,
  ENABLE_ANALYTICS: false,  // Disabled by default for privacy
  ENABLE_CRASH_REPORTING: false,

  /** Beta features */
  BETA: {
    ENABLE_LOCAL_MODELS: false,
    ENABLE_PLUGINS: false,
    ENABLE_COLLABORATION: false,
  },
} as const

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERRORS = {
  /** User-friendly error messages */
  MESSAGES: {
    NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
    API_KEY_INVALID: 'Invalid API key. Please check your settings.',
    API_KEY_MISSING: 'API key required. Add your Claude API key in settings.',
    RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
    CONTEXT_EXCEEDED: 'Conversation too long. Starting a new conversation.',
    SCREENSHOT_FAILED: 'Could not capture screenshot. Check permissions.',
    VOICE_UNAVAILABLE: 'Voice input is not available in this browser.',
    STORAGE_FULL: 'Storage is full. Please clear some conversations.',
    PERMISSION_DENIED: 'Permission denied. Please enable in System Preferences.',
    UNKNOWN_ERROR: 'Something went wrong. Please try again.',
  },

  /** Error codes for programmatic handling */
  CODES: {
    NETWORK: 'ERR_NETWORK',
    AUTH: 'ERR_AUTH',
    RATE_LIMIT: 'ERR_RATE_LIMIT',
    CONTEXT: 'ERR_CONTEXT',
    PERMISSION: 'ERR_PERMISSION',
    STORAGE: 'ERR_STORAGE',
    TIMEOUT: 'ERR_TIMEOUT',
    UNKNOWN: 'ERR_UNKNOWN',
  },
} as const

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AccentColor = typeof UI.ACCENT_COLORS[number]
export type TaskSource = typeof TASKS.SOURCES[number]
export type ErrorCode = typeof ERRORS.CODES[keyof typeof ERRORS.CODES]
export type SpringPreset = keyof typeof ANIMATIONS.SPRING
