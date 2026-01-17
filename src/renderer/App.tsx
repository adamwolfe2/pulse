import { useEffect, useState } from "react"
import { AnimatePresence } from "framer-motion"
import { OverlayContainer } from "./components/OverlayContainer"
import { SuggestionCard } from "./components/SuggestionCard"
import { useGhostStore } from "./stores/ghostStore"

export function App() {
  const [isVisible, setIsVisible] = useState(false)
  const { currentSuggestion, setSuggestion, triggerNewSuggestion } = useGhostStore()

  useEffect(() => {
    // Listen for overlay visibility changes from main process
    window.ghostbar?.onOverlayVisibility((visible) => {
      setIsVisible(visible)
      if (visible && !currentSuggestion) {
        // Trigger a new suggestion when overlay becomes visible
        triggerNewSuggestion()
      }
    })

    return () => {
      window.ghostbar?.removeAllListeners()
    }
  }, [currentSuggestion, triggerNewSuggestion])

  const handleDismiss = () => {
    setSuggestion(null)
    window.ghostbar?.hideOverlay()
  }

  const handleAction = (actionId: string) => {
    console.log("Action triggered:", actionId)
    // Handle the action based on its type
    // For now, just dismiss
    handleDismiss()
  }

  return (
    <OverlayContainer isVisible={isVisible}>
      <AnimatePresence mode="wait">
        {currentSuggestion && (
          <SuggestionCard
            key={currentSuggestion.id}
            suggestion={currentSuggestion}
            onDismiss={handleDismiss}
            onAction={handleAction}
          />
        )}
      </AnimatePresence>
    </OverlayContainer>
  )
}
