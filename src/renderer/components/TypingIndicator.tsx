import React from "react"
import { motion } from "framer-motion"

interface TypingIndicatorProps {
  className?: string
}

export function TypingIndicator({ className = "" }: TypingIndicatorProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-white/50"
          animate={{
            y: [0, -6, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// Alternative pulse style
export function PulseIndicator({ className = "" }: TypingIndicatorProps) {
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
