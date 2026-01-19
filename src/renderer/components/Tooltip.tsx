import React, { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { tooltipVariants } from "../lib/animations"

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  position?: "top" | "bottom" | "left" | "right"
  delay?: number
}

export function Tooltip({
  children,
  content,
  position = "top",
  delay = 200
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const positionStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2"
  }

  const arrowStyles = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-[rgba(30,30,35,0.98)] border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-[rgba(30,30,35,0.98)] border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-[rgba(30,30,35,0.98)] border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-[rgba(30,30,35,0.98)] border-y-transparent border-l-transparent"
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`absolute z-50 ${positionStyles[position]} pointer-events-none`}
          >
            <div
              className="px-2.5 py-1.5 rounded-lg text-sm text-white/90 whitespace-nowrap"
              style={{
                background: "rgba(30, 30, 35, 0.98)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
              }}
            >
              {content}
            </div>
            <div
              className={`absolute w-0 h-0 border-4 ${arrowStyles[position]}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Keyboard shortcut badge
interface ShortcutBadgeProps {
  keys: string[]
  className?: string
}

export function ShortcutBadge({ keys, className = "" }: ShortcutBadgeProps) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {keys.map((key, i) => (
        <React.Fragment key={i}>
          <kbd
            className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5
                     rounded bg-white/10 text-white/60 text-xs font-mono
                     border border-white/5"
          >
            {key}
          </kbd>
          {i < keys.length - 1 && <span className="text-white/30 text-xs">+</span>}
        </React.Fragment>
      ))}
    </div>
  )
}

// Animated badge/chip
interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "success" | "warning" | "error" | "info"
  size?: "sm" | "md"
  animated?: boolean
}

export function Badge({
  children,
  variant = "default",
  size = "sm",
  animated = false
}: BadgeProps) {
  const variantStyles = {
    default: "bg-white/10 text-white/70",
    success: "bg-green-500/20 text-green-400",
    warning: "bg-amber-500/20 text-amber-400",
    error: "bg-red-500/20 text-red-400",
    info: "bg-indigo-500/20 text-indigo-400"
  }

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm"
  }

  const Component = animated ? motion.span : "span"
  const animationProps = animated
    ? {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.9, opacity: 0 }
      }
    : {}

  return (
    <Component
      className={`inline-flex items-center rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]}`}
      {...animationProps}
    >
      {children}
    </Component>
  )
}
