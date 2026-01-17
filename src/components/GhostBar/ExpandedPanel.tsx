import { motion } from "framer-motion"
import { useGhostStore } from "~/stores/ghostStore"
import { useDarkMode } from "~/hooks/useDarkMode"
import { AnimatedIcon } from "~/components/shared/AnimatedIcon"
import { ActionButton } from "./ActionButton"

export function ExpandedPanel() {
  const { currentSuggestion, collapse, dismiss } = useGhostStore()
  const isDark = useDarkMode()

  if (!currentSuggestion) return null

  return (
    <motion.div
      className="w-full p-4"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <AnimatedIcon
          icon={currentSuggestion.actions[0]?.icon || "💡"}
          size="lg"
        />
        <div className="flex-1">
          <h3
            className={`
              text-base font-semibold
              ${isDark ? "text-white" : "text-ghost-900"}
            `}
          >
            {currentSuggestion.title}
          </h3>
          <p
            className={`
              text-sm mt-1
              ${isDark ? "text-white/70" : "text-ghost-600"}
            `}
          >
            {currentSuggestion.description}
          </p>
        </div>
        <motion.button
          className={`
            text-sm
            ${isDark ? "text-white/50 hover:text-white/80" : "text-ghost-400 hover:text-ghost-600"}
          `}
          onClick={collapse}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ✕
        </motion.button>
      </div>

      {/* Context Info */}
      {currentSuggestion.context && (
        <div
          className={`
            text-xs mb-4 p-2 rounded-lg
            ${isDark ? "bg-white/5 text-white/60" : "bg-ghost-50 text-ghost-500"}
          `}
        >
          <span className="font-medium">Page:</span>{" "}
          {currentSuggestion.context.title}
          {currentSuggestion.context.readingTime && (
            <span className="ml-2">
              · {currentSuggestion.context.readingTime} min read
            </span>
          )}
        </div>
      )}

      {/* Actions Grid */}
      <div className="flex flex-wrap gap-2">
        {currentSuggestion.actions.map((action) => (
          <ActionButton key={action.id} action={action} size="md" showLabel />
        ))}
      </div>

      {/* Footer */}
      <div
        className={`
          flex justify-between items-center mt-4 pt-3
          border-t ${isDark ? "border-white/10" : "border-ghost-200"}
        `}
      >
        <span
          className={`
            text-xs
            ${isDark ? "text-white/40" : "text-ghost-400"}
          `}
        >
          Confidence: {Math.round(currentSuggestion.confidence * 100)}%
        </span>
        <motion.button
          className={`
            text-xs
            ${isDark ? "text-white/50 hover:text-white/80" : "text-ghost-500 hover:text-ghost-700"}
          `}
          onClick={dismiss}
          whileHover={{ scale: 1.05 }}
        >
          Dismiss
        </motion.button>
      </div>
    </motion.div>
  )
}
