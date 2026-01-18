import React, { forwardRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface AnimatedInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const AnimatedInput = forwardRef<HTMLTextAreaElement, AnimatedInputProps>(
  function AnimatedInput(
    { label, error, hint, className = "", onFocus, onBlur, ...props },
    ref
  ) {
    const [isFocused, setIsFocused] = useState(false)

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    return (
      <div className="relative">
        {label && (
          <motion.label
            className="block text-sm font-medium text-white/70 mb-2"
            animate={{
              color: isFocused ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.7)"
            }}
          >
            {label}
          </motion.label>
        )}

        <div className="relative">
          <motion.textarea
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`
              w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3
              resize-none focus:outline-none transition-colors
              min-h-[48px] max-h-32 border
              ${error ? "border-red-500/50" : isFocused ? "border-indigo-500/50" : "border-transparent"}
              ${className}
            `}
            animate={{
              boxShadow: isFocused
                ? "0 0 0 3px rgba(99, 102, 241, 0.15)"
                : "0 0 0 0px rgba(99, 102, 241, 0)"
            }}
            transition={{ duration: 0.15 }}
            {...props}
          />

          {/* Focus ring glow effect */}
          <AnimatePresence>
            {isFocused && (
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))",
                  zIndex: -1
                }}
              />
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-1.5 text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}
          {!error && hint && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-1.5 text-xs text-white/40"
            >
              {hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

// Animated send button
interface SendButtonProps {
  onClick: () => void
  disabled?: boolean
  isLoading?: boolean
}

export function SendButton({ onClick, disabled, isLoading }: SendButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`p-3 rounded-xl transition-colors ${
        !disabled
          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
          : "bg-white/5 text-white/30"
      }`}
      whileHover={!disabled ? { scale: 1.05 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
      transition={isLoading ? { duration: 1, repeat: Infinity, ease: "linear" } : { type: "spring", damping: 20 }}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
        </svg>
      )}
    </motion.button>
  )
}
