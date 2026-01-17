import { create } from "zustand"
import type { Suggestion } from "../types"
import { generateContextualSuggestion } from "../lib/claude"

interface GhostState {
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
  }

  // Actions
  setSuggestion: (suggestion: Suggestion | null) => void
  addToHistory: (suggestion: Suggestion) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateSettings: (settings: Partial<GhostState["settings"]>) => void
  triggerNewSuggestion: () => Promise<void>
}

// Load API key from environment or localStorage
const getStoredApiKey = (): string => {
  try {
    return localStorage.getItem("ghostbar_api_key") || ""
  } catch {
    return ""
  }
}

export const useGhostStore = create<GhostState>((set, get) => ({
  currentSuggestion: null,
  history: [],
  isLoading: false,
  error: null,
  settings: {
    apiKey: getStoredApiKey(),
    enabled: true
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
    set((state) => ({
      settings: { ...state.settings, ...newSettings }
    }))
    // Persist API key
    if (newSettings.apiKey) {
      try {
        localStorage.setItem("ghostbar_api_key", newSettings.apiKey)
      } catch {
        // Ignore storage errors
      }
    }
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
}))

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
