import { motion } from "framer-motion"
import { useDarkMode } from "~/hooks/useDarkMode"
import { AnimatedIcon } from "~/components/shared/AnimatedIcon"
import type { SuggestionAction } from "~/types"

interface ActionButtonProps {
  action: SuggestionAction
  size?: "sm" | "md"
  showLabel?: boolean
  onClick?: () => void
}

export function ActionButton({
  action,
  size = "md",
  showLabel = false,
  onClick
}: ActionButtonProps) {
  const isDark = useDarkMode()

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }

    // Dispatch action to background script
    try {
      chrome.runtime.sendMessage({
        type: "EXECUTE_ACTION",
        payload: {
          handler: action.handler,
          payload: action.payload
        }
      })
    } catch (error) {
      console.error("Failed to send action:", error)
    }
  }

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm"
  }

  return (
    <motion.button
      className={`
        ${sizes[size]}
        rounded-lg font-medium
        flex items-center gap-1.5
        transition-colors duration-200
        ${
          action.primary
            ? isDark
              ? "bg-white text-ghost-900 hover:bg-white/90"
              : "bg-ghost-900 text-white hover:bg-ghost-800"
            : isDark
              ? "bg-white/10 text-white hover:bg-white/20"
              : "bg-ghost-100 text-ghost-800 hover:bg-ghost-200"
        }
      `}
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <AnimatedIcon icon={action.icon} size="sm" animate={false} />
      {showLabel && <span>{action.label}</span>}
    </motion.button>
  )
}
