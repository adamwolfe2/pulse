import React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { buttonVariants, springTransition } from "../lib/animations"

interface AnimatedButtonProps extends Omit<HTMLMotionProps<"button">, "variants"> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function AnimatedButton({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}: AnimatedButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"

  const variantStyles = {
    primary: "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 focus-visible:ring-indigo-500",
    secondary: "bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/50",
    ghost: "text-white/70 hover:text-white hover:bg-white/10 focus-visible:ring-white/30",
    danger: "bg-red-500/20 text-red-400 hover:bg-red-500/30 focus-visible:ring-red-500"
  }

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5"
  }

  const isDisabled = disabled || isLoading

  return (
    <motion.button
      variants={buttonVariants}
      initial="idle"
      whileHover={isDisabled ? undefined : "hover"}
      whileTap={isDisabled ? undefined : "tap"}
      transition={springTransition}
      disabled={isDisabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${
        isDisabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      {...props}
    >
      {isLoading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full"
        />
      )}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
    </motion.button>
  )
}

// Icon button variant
interface AnimatedIconButtonProps extends Omit<HTMLMotionProps<"button">, "variants"> {
  icon: React.ReactNode
  size?: "sm" | "md" | "lg"
  tooltip?: string
}

export function AnimatedIconButton({
  icon,
  size = "md",
  tooltip,
  className = "",
  ...props
}: AnimatedIconButtonProps) {
  const sizeStyles = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3"
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
      whileTap={{ scale: 0.9 }}
      transition={springTransition}
      title={tooltip}
      className={`rounded-lg bg-white/10 text-white/70 hover:text-white transition-colors ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon}
    </motion.button>
  )
}
