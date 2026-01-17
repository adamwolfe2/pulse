import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type {
  GhostState,
  BarState,
  Suggestion,
  PageContext,
  UserSettings,
  OnboardingState,
  TriggerType
} from "~/types"
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "~/lib/constants"

// Chrome storage adapter for Zustand
const chromeStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const result = await chrome.storage.local.get(name)
      return result[name] ?? null
    } catch {
      // Fallback for non-extension context
      return localStorage.getItem(name)
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await chrome.storage.local.set({ [name]: value })
    } catch {
      // Fallback for non-extension context
      localStorage.setItem(name, value)
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await chrome.storage.local.remove(name)
    } catch {
      // Fallback for non-extension context
      localStorage.removeItem(name)
    }
  }
}

interface GhostActions {
  // Bar State Actions
  setBarState: (state: BarState) => void
  setVisible: (visible: boolean) => void
  peek: () => void
  expand: () => void
  collapse: () => void
  dismiss: () => void

  // Suggestion Actions
  setSuggestion: (suggestion: Suggestion | null) => void
  addToHistory: (suggestion: Suggestion) => void
  clearHistory: () => void

  // Page Context Actions
  setPageContext: (context: PageContext | null) => void

  // Settings Actions
  updateSettings: (settings: Partial<UserSettings>) => void
  setApiKey: (key: string) => void
  toggleDarkMode: () => void
  toggleTrigger: (trigger: TriggerType) => void

  // Onboarding Actions
  setOnboardingStep: (step: 0 | 1 | 2 | 3) => void
  completeOnboarding: () => void
  setPermission: (permission: keyof OnboardingState["permissions"], granted: boolean) => void

  // UI Actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState: GhostState = {
  barState: "dormant",
  isVisible: true,
  currentSuggestion: null,
  suggestionHistory: [],
  pageContext: null,
  settings: DEFAULT_SETTINGS,
  onboarding: {
    currentStep: 0,
    completed: false,
    permissions: {
      clipboard: false,
      storage: false,
      activeTab: false
    }
  },
  isLoading: false,
  error: null
}

export const useGhostStore = create<GhostState & GhostActions>()(
  persist(
    (set) => ({
      ...initialState,

      // Bar State Actions
      setBarState: (barState) => set({ barState }),

      setVisible: (isVisible) => set({ isVisible }),

      peek: () => set({ barState: "peeking" }),

      expand: () => set({ barState: "expanded" }),

      collapse: () => set({ barState: "visible" }),

      dismiss: () =>
        set({
          barState: "dormant",
          currentSuggestion: null
        }),

      // Suggestion Actions
      setSuggestion: (suggestion) =>
        set({
          currentSuggestion: suggestion,
          barState: suggestion ? "visible" : "dormant"
        }),

      addToHistory: (suggestion) =>
        set((state) => ({
          suggestionHistory: [suggestion, ...state.suggestionHistory].slice(0, 50)
        })),

      clearHistory: () => set({ suggestionHistory: [] }),

      // Page Context Actions
      setPageContext: (pageContext) => set({ pageContext }),

      // Settings Actions
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        })),

      setApiKey: (apiKey) =>
        set((state) => ({
          settings: { ...state.settings, apiKey }
        })),

      toggleDarkMode: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            darkMode: state.settings.darkMode === "dark" ? "light" : "dark"
          }
        })),

      toggleTrigger: (trigger) =>
        set((state) => ({
          settings: {
            ...state.settings,
            triggers: {
              ...state.settings.triggers,
              [trigger]: !state.settings.triggers[trigger]
            }
          }
        })),

      // Onboarding Actions
      setOnboardingStep: (step) =>
        set((state) => ({
          onboarding: { ...state.onboarding, currentStep: step }
        })),

      completeOnboarding: () =>
        set((state) => ({
          onboarding: { ...state.onboarding, completed: true },
          settings: { ...state.settings, onboardingComplete: true }
        })),

      setPermission: (permission, granted) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            permissions: {
              ...state.onboarding.permissions,
              [permission]: granted
            }
          }
        })),

      // UI Actions
      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      reset: () => set(initialState)
    }),
    {
      name: STORAGE_KEYS.settings,
      storage: createJSONStorage(() => chromeStorage),
      partialize: (state) => ({
        settings: state.settings,
        onboarding: state.onboarding,
        suggestionHistory: state.suggestionHistory
      })
    }
  )
)

// Selectors for performance optimization
export const selectBarState = (state: GhostState) => state.barState
export const selectSuggestion = (state: GhostState) => state.currentSuggestion
export const selectSettings = (state: GhostState) => state.settings
export const selectOnboarding = (state: GhostState) => state.onboarding
export const selectIsLoading = (state: GhostState) => state.isLoading
