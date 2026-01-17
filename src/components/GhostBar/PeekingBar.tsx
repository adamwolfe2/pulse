import { useEffect } from "react"
import { motion } from "framer-motion"
import { useGhostStore } from "~/stores/ghostStore"
import { useDarkMode } from "~/hooks/useDarkMode"
import { AnimatedIcon } from "~/components/shared/AnimatedIcon"
import { TIMING } from "~/lib/constants"

export function PeekingBar() {
  const { currentSuggestion, setBarState, dismiss, isLoading } = useGhostStore()
  const isDark = useDarkMode()

  // Auto-expand after delay or on hover
  useEffect(() => {
    if (!currentSuggestion && !isLoading) return

    const timer = setTimeout(() => {
      if (currentSuggestion) {
        setBarState("visible")
      }
    }, TIMING.peekDelay)

    return () => clearTimeout(timer)
  }, [currentSuggestion, setBarState, isLoading])

  const icon = currentSuggestion?.actions[0]?.icon || "💡"
  const hint = isLoading
    ? "Thinking..."
    : currentSuggestion?.title?.slice(0, 25) || "Something interesting..."

  return (
    <motion.div
      className="w-full h-full flex items-center px-3 gap-2 cursor-pointer"
      onClick={() => setBarState("visible")}
      onMouseEnter={() => currentSuggestion && setBarState("visible")}
    >
      {isLoading ? (
        <motion.div
          className={`w-4 h-4 rounded-full ${isDark ? "bg-white/60" : "bg-ghost-600"}`}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      ) : (
        <AnimatedIcon icon={icon} size="sm" />
      )}
      <span
        className={`
          text-xs font-medium truncate
          ${isDark ? "text-white/80" : "text-ghost-700"}
        `}
      >
        {hint}
      </span>
      <motion.button
        className={`
          ml-auto text-xs
          ${isDark ? "text-white/50 hover:text-white/80" : "text-ghost-400 hover:text-ghost-600"}
        `}
        onClick={(e) => {
          e.stopPropagation()
          dismiss()
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        ✕
      </motion.button>
    </motion.div>
  )
}
