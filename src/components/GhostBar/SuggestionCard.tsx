import { motion } from "framer-motion"
import { useDarkMode } from "~/hooks/useDarkMode"
import { AnimatedIcon } from "~/components/shared/AnimatedIcon"
import type { Suggestion } from "~/types"

interface SuggestionCardProps {
  suggestion: Suggestion
  onClick?: () => void
}

export function SuggestionCard({ suggestion, onClick }: SuggestionCardProps) {
  const isDark = useDarkMode()

  const timeAgo = getTimeAgo(suggestion.timestamp)

  return (
    <motion.div
      className={`
        p-3 rounded-xl cursor-pointer
        ${
          isDark
            ? "bg-white/5 hover:bg-white/10"
            : "bg-ghost-50 hover:bg-ghost-100"
        }
        transition-colors duration-200
      `}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start gap-2">
        <AnimatedIcon
          icon={suggestion.actions[0]?.icon || "💡"}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p
            className={`
              text-sm font-medium truncate
              ${isDark ? "text-white" : "text-ghost-900"}
            `}
          >
            {suggestion.title}
          </p>
          <p
            className={`
              text-xs truncate mt-0.5
              ${isDark ? "text-white/60" : "text-ghost-500"}
            `}
          >
            {suggestion.description}
          </p>
        </div>
        <span
          className={`
            text-xs
            ${isDark ? "text-white/40" : "text-ghost-400"}
          `}
        >
          {timeAgo}
        </span>
      </div>
    </motion.div>
  )
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  if (seconds < 60) return "now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}
