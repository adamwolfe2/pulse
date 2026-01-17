import { motion } from "framer-motion"
import type { Action } from "../types"

interface ActionButtonProps {
  action: Action
  onClick: () => void
  variant?: "primary" | "secondary" | "inline" | "icon"
}

export function ActionButton({
  action,
  onClick,
  variant = "primary"
}: ActionButtonProps) {
  const variants = {
    primary: `
      bg-white/20 hover:bg-white/30
      text-white font-medium
      px-4 py-2 rounded-xl
      border border-white/20
    `,
    secondary: `
      bg-white/10 hover:bg-white/20
      text-white/80
      px-4 py-2 rounded-xl
      border border-white/10
    `,
    inline: `
      bg-white/10 hover:bg-white/20
      text-white/70 text-sm
      px-3 py-1.5 rounded-lg
    `,
    icon: `
      bg-white/10 hover:bg-white/20
      text-white
      w-10 h-10 rounded-full
      flex items-center justify-center
    `
  }

  return (
    <motion.button
      className={`
        ${variants[variant]}
        transition-colors duration-200
        backdrop-blur-sm
        flex items-center gap-2
      `}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {action.icon && <span>{action.icon}</span>}
      {variant !== "icon" && <span>{action.label}</span>}
    </motion.button>
  )
}
