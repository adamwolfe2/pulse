import { motion, AnimatePresence } from "framer-motion"
import { useGhostStore } from "~/stores/ghostStore"
import { useDarkMode } from "~/hooks/useDarkMode"
import { useKeyboardShortcuts } from "~/hooks/useKeyboardShortcuts"
import { GlassContainer } from "~/components/shared/GlassContainer"
import { DormantBar } from "./DormantBar"
import { PeekingBar } from "./PeekingBar"
import { VisibleBar } from "./VisibleBar"
import { ExpandedPanel } from "./ExpandedPanel"
import { ConfirmingBar } from "./ConfirmingBar"
import { BAR_DIMENSIONS, ANIMATIONS } from "~/lib/constants"

export function GhostBar() {
  const { barState, isVisible, settings, isLoading } = useGhostStore()
  const isDark = useDarkMode()

  // Initialize keyboard shortcuts
  useKeyboardShortcuts()

  // Position based on settings
  const position = settings.position === "top" ? "top-4" : "bottom-4"

  if (!isVisible || !settings.enabled) {
    return null
  }

  const dimensions = BAR_DIMENSIONS[barState]

  const renderBarContent = () => {
    switch (barState) {
      case "dormant":
        return <DormantBar />
      case "peeking":
        return <PeekingBar />
      case "visible":
        return <VisibleBar />
      case "expanded":
        return <ExpandedPanel />
      case "confirming":
        return <ConfirmingBar />
      default:
        return <DormantBar />
    }
  }

  return (
    <div
      className={`
        fixed ${position} left-1/2 -translate-x-1/2 z-[2147483647]
        ${isDark ? "dark" : ""}
      `}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={barState}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            width: dimensions.width,
            height: dimensions.height
          }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{
            duration: ANIMATIONS.stateTransition,
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
        >
          <GlassContainer
            intensity="heavy"
            className={`w-full h-full overflow-hidden ${isLoading ? "animate-pulse" : ""}`}
          >
            {renderBarContent()}
          </GlassContainer>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
