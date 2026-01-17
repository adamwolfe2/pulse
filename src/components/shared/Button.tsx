import { motion } from "framer-motion"
import { useDarkMode } from "~/hooks/useDarkMode"

interface ButtonProps {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md" | "lg"
  onClick?: () => void
  disabled?: boolean
  className?: string
  type?: "button" | "submit" | "reset"
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  className = "",
  type = "button"
}: ButtonProps) {
  const isDark = useDarkMode()

  const variants = {
    primary: isDark
      ? "bg-white text-ghost-900 hover:bg-white/90"
      : "bg-ghost-900 text-white hover:bg-ghost-800",
    secondary: isDark
      ? "bg-white/10 text-white hover:bg-white/20"
      : "bg-ghost-100 text-ghost-900 hover:bg-ghost-200",
    ghost: isDark
      ? "text-white/80 hover:bg-white/10"
      : "text-ghost-700 hover:bg-ghost-100"
  }

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base"
  }

  return (
    <motion.button
      type={type}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-lg font-medium
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
    >
      {children}
    </motion.button>
  )
}
