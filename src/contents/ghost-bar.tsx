import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useEffect, useState } from "react"
import { useGhostStore } from "~/stores/ghostStore"
import { initializeClient } from "~/lib/claude"
import { initializeTriggerEngine } from "~/lib/triggerEngine"
import { usePageContext } from "~/hooks/usePageContext"
import { GhostBar } from "~/components/GhostBar/GhostBar"
import { OnboardingFlow } from "~/components/onboarding/OnboardingFlow"
import cssText from "data-text:~/styles/global.css"

// Plasmo configuration
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  exclude_matches: [
    "https://chrome.google.com/*",
    "chrome://*",
    "chrome-extension://*"
  ],
  all_frames: false,
  run_at: "document_idle"
}

// Inject Tailwind styles into shadow DOM
export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

// Main content component
function GhostBarContent() {
  const {
    settings,
    onboarding,
    setSuggestion,
    setError,
    setLoading,
    setBarState
  } = useGhostStore()

  const [initialized, setInitialized] = useState(false)

  // Initialize page context tracking
  usePageContext()

  // Initialize Claude client and trigger engine
  useEffect(() => {
    if (!settings.apiKey || initialized) return

    try {
      // Initialize Claude client
      initializeClient(settings.apiKey)

      // Initialize trigger engine
      initializeTriggerEngine({
        settings,
        onSuggestion: (suggestion) => {
          setBarState("peeking")
          // Small delay before showing full suggestion
          setTimeout(() => {
            setSuggestion(suggestion)
          }, 500)
          setLoading(false)
        },
        onError: (error) => {
          console.error("GhostBar error:", error)
          setError(error)
          setLoading(false)
        },
        onLoading: (loading) => {
          setLoading(loading)
          if (loading) {
            setBarState("peeking")
          }
        }
      })

      setInitialized(true)
    } catch (error) {
      console.error("GhostBar initialization failed:", error)
      setError("Failed to initialize GhostBar")
    }
  }, [settings.apiKey, settings, initialized, setSuggestion, setError, setLoading, setBarState])

  // Listen for messages from background script
  useEffect(() => {
    const handleMessage = (message: { type: string; payload?: unknown }) => {
      if (message.type === "TOGGLE_VISIBILITY") {
        const store = useGhostStore.getState()
        store.setVisible(!store.isVisible)
      }
      if (message.type === "ANALYZE_SELECTION" && message.payload) {
        // Handle selected text analysis
        console.log("Analyze selection:", message.payload)
      }
    }

    try {
      chrome.runtime.onMessage.addListener(handleMessage)
      return () => {
        chrome.runtime.onMessage.removeListener(handleMessage)
      }
    } catch {
      // Not in extension context
      return
    }
  }, [])

  // Show onboarding if not complete
  if (!onboarding.completed) {
    return <OnboardingFlow />
  }

  // Show GhostBar if enabled
  if (!settings.enabled) {
    return null
  }

  return <GhostBar />
}

export default GhostBarContent
