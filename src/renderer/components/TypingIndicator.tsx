import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Brain, Zap } from "lucide-react"

interface TypingIndicatorProps {
  className?: string
  variant?: "dots" | "wave" | "pulse" | "thinking"
  isTyping?: boolean
  message?: string
}

// Classic bouncing dots
export function TypingIndicator({
  className = "",
  variant = "dots",
  isTyping = true,
  message
}: TypingIndicatorProps) {
  if (!isTyping) return null

  const renderIndicator = () => {
    switch (variant) {
      case "wave":
        return (
          <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                className="w-1 bg-indigo-400 rounded-full"
                animate={{
                  height: [8, 18, 8],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 0.7,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        )

      case "pulse":
        return (
          <div className="relative flex items-center justify-center w-6 h-6">
            <motion.div
              className="w-3 h-3 rounded-full bg-indigo-500"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.8, 0.4, 0.8]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute w-6 h-6 rounded-full border-2 border-indigo-500/30"
              animate={{
                scale: [1, 1.6],
                opacity: [0.5, 0]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          </div>
        )

      case "thinking":
        return (
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Brain size={16} className="text-indigo-400" />
            </motion.div>
            <div className="flex items-center gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.4, 1, 0.4]
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </div>
        )

      case "dots":
      default:
        return (
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-2 h-2 rounded-full bg-indigo-400"
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.12,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        )
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="rounded-2xl px-4 py-3 bg-white/[0.04] border border-white/[0.06]">
        {renderIndicator()}
      </div>
      {message && (
        <span className="text-white/40 text-xs">{message}</span>
      )}
    </div>
  )
}

// Alternative pulse style (bars)
export function PulseIndicator({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          className="w-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-full"
          animate={{
            height: ["8px", "16px", "8px"]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// Thinking text with animated ellipsis
export function ThinkingText({ text = "Thinking" }: { text?: string }) {
  return (
    <div className="flex items-center text-white/50 text-sm">
      <span>{text}</span>
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        ...
      </motion.span>
    </div>
  )
}

// Loading skeleton with shimmer
export function SkeletonShimmer({
  width = "100%",
  height = "1rem",
  className = ""
}: {
  width?: string | number
  height?: string | number
  className?: string
}) {
  return (
    <motion.div
      className={`rounded bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] ${className}`}
      style={{ width, height }}
      animate={{
        backgroundPosition: ["100% 0", "-100% 0"]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  )
}

// Inline typing indicator for use within text
export function InlineTypingIndicator({
  isTyping,
  className = ""
}: {
  isTyping: boolean
  className?: string
}) {
  return (
    <AnimatePresence>
      {isTyping && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`inline-flex items-center gap-0.5 ${className}`}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1 h-1 rounded-full bg-current"
              animate={{
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

// Status-aware typing indicator
export function SmartTypingIndicator({
  status,
  className = ""
}: {
  status: "idle" | "thinking" | "typing" | "processing" | "error"
  className?: string
}) {
  const statusConfig = {
    idle: { show: false, icon: null, message: "", variant: "dots" as const },
    thinking: {
      show: true,
      icon: <Brain size={14} className="text-indigo-400" />,
      message: "Thinking...",
      variant: "thinking" as const
    },
    typing: {
      show: true,
      icon: <Sparkles size={14} className="text-indigo-400" />,
      message: "Generating response...",
      variant: "wave" as const
    },
    processing: {
      show: true,
      icon: <Zap size={14} className="text-amber-400" />,
      message: "Processing...",
      variant: "pulse" as const
    },
    error: {
      show: false,
      icon: null,
      message: "",
      variant: "dots" as const
    }
  }

  const config = statusConfig[status]

  return (
    <AnimatePresence>
      {config.show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className={`flex items-center gap-3 ${className}`}
        >
          <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 bg-white/[0.04] border border-white/[0.06]">
            {config.icon}
            <TypingIndicator isTyping={true} variant={config.variant} className="!p-0" />
          </div>
          <span className="text-white/40 text-xs">{config.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Streaming cursor for text
export function StreamingCursor({ className = "" }: { className?: string }) {
  return (
    <motion.span
      className={`inline-block w-1.5 h-4 bg-indigo-400 rounded-sm ml-0.5 -mb-0.5 ${className}`}
      animate={{ opacity: [1, 0.2, 1] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
    />
  )
}

// Animated loading bar
export function LoadingBar({
  progress,
  className = ""
}: {
  progress?: number
  className?: string
}) {
  const isIndeterminate = progress === undefined

  return (
    <div className={`h-1 bg-white/10 rounded-full overflow-hidden ${className}`}>
      {isIndeterminate ? (
        <motion.div
          className="h-full w-1/3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
          animate={{
            x: ["-100%", "400%"]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ) : (
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      )}
    </div>
  )
}
