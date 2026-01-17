import { useEffect } from "react"
import { motion } from "framer-motion"
import { useGhostStore } from "~/stores/ghostStore"
import { useDarkMode } from "~/hooks/useDarkMode"
import { AnimatedIcon } from "~/components/shared/AnimatedIcon"
import { ActionButton } from "./ActionButton"
import { TIMING } from "~/lib/constants"

export function VisibleBar() {
  const { currentSuggestion, expand, dismiss, addToHistory } = useGhostStore()
  const isDark = useDarkMode()

  // Auto-dismiss after timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      dismiss()
    }, TIMING.autoDismiss)

    return () => clearTimeout(timer)
  }, [dismiss])

  // Add to history when shown
  useEffect(() => {
    if (currentSuggestion) {
      addToHistory(currentSuggestion)
    }
  }, [currentSuggestion, addToHistory])

  if (!currentSuggestion) return null

  const primaryAction = currentSuggestion.actions.find((a) => a.primary)
  const icon = currentSuggestion.actions[0]?.icon || "💡"

  return (
    <motion.div
      className="w-full h-full flex items-center px-4 gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Icon */}
      <AnimatedIcon icon={icon} size="md" />

      {/* Content */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={expand}>
        <p
          className={`
            text-sm font-medium truncate
            ${isDark ? "text-white" : "text-ghost-900"}
          `}
        >
          {currentSuggestion.title}
        </p>
        <p
          className={`
            text-xs truncate
            ${isDark ? "text-white/60" : "text-ghost-500"}
          `}
        >
          {currentSuggestion.description}
        </p>
      </div>

      {/* Primary Action */}
      {primaryAction && <ActionButton action={primaryAction} size="sm" />}

      {/* Expand Button */}
      <motion.button
        className={`
          text-xs px-2 py-1 rounded
          ${isDark ? "text-white/60 hover:bg-white/10" : "text-ghost-500 hover:bg-ghost-100"}
        `}
        onClick={expand}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        More
      </motion.button>

      {/* Dismiss */}
      <motion.button
        className={`
          text-xs
          ${isDark ? "text-white/40 hover:text-white/70" : "text-ghost-400 hover:text-ghost-600"}
        `}
        onClick={dismiss}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        ✕
      </motion.button>
    </motion.div>
  )
}
