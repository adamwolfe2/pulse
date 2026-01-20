import React from "react"
import { motion } from "framer-motion"

// Base skeleton shimmer animation
const shimmer = {
  hidden: { x: "-100%" },
  visible: {
    x: "100%",
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "linear"
    }
  }
}

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: "sm" | "md" | "lg" | "xl" | "full"
}

// Base skeleton element
export function Skeleton({ className = "", width, height, rounded = "md" }: SkeletonProps) {
  const roundedClass = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full"
  }[rounded]

  return (
    <div
      className={`relative overflow-hidden bg-white/[0.06] ${roundedClass} ${className}`}
      style={{ width, height }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        variants={shimmer}
        initial="hidden"
        animate="visible"
      />
    </div>
  )
}

// Skeleton for text lines
export function SkeletonText({
  lines = 1,
  className = ""
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          width={i === lines - 1 && lines > 1 ? "70%" : "100%"}
        />
      ))}
    </div>
  )
}

// Skeleton for avatar/profile images
export function SkeletonAvatar({
  size = 40,
  className = ""
}: {
  size?: number
  className?: string
}) {
  return (
    <Skeleton
      className={className}
      width={size}
      height={size}
      rounded="full"
    />
  )
}

// Skeleton for message bubbles
export function SkeletonMessage({
  isUser = false,
  className = ""
}: {
  isUser?: boolean
  className?: string
}) {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} ${className}`}>
      <div
        className={`max-w-[85%] rounded-2xl p-3 space-y-2 ${
          isUser
            ? "bg-indigo-500/10 border border-indigo-500/20"
            : "bg-white/[0.04] border border-white/[0.06]"
        }`}
      >
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-36" />
        {!isUser && <Skeleton className="h-3 w-24" />}
      </div>
    </div>
  )
}

// Skeleton for conversation list items
export function SkeletonConversationItem({ className = "" }: { className?: string }) {
  return (
    <div className={`p-3 rounded-xl bg-white/[0.02] border border-white/5 ${className}`}>
      <div className="flex items-start gap-3">
        <Skeleton className="w-8 h-8 flex-shrink-0" rounded="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}

// Skeleton for the chat loading state
export function SkeletonChatLoading({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMessage key={i} isUser={i % 2 === 0} />
      ))}
    </div>
  )
}

// Skeleton for conversation list loading
export function SkeletonConversationList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonConversationItem key={i} />
      ))}
    </div>
  )
}

// Skeleton for settings panel
export function SkeletonSettings() {
  return (
    <div className="space-y-6 p-4">
      {/* Section header */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-12" rounded="full" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-6 w-12" rounded="full" />
          </div>
        </div>
      </div>

      {/* Another section */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" rounded="lg" />
        <Skeleton className="h-10 w-full" rounded="lg" />
      </div>
    </div>
  )
}

// Skeleton for quick actions grid
export function SkeletonQuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2.5 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl
                   bg-white/[0.03] border border-white/[0.06]"
        >
          <Skeleton className="w-8 h-8" rounded="lg" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

// Full page loading skeleton
export function SkeletonFullPage() {
  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6" rounded="lg" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6" rounded="full" />
          <Skeleton className="w-6 h-6" rounded="full" />
          <Skeleton className="w-6 h-6" rounded="full" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <div className="text-center mb-4">
          <Skeleton className="h-6 w-40 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <SkeletonQuickActions />
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          <Skeleton className="w-10 h-10" rounded="xl" />
          <Skeleton className="w-10 h-10" rounded="xl" />
          <Skeleton className="flex-1 h-10" rounded="xl" />
          <Skeleton className="w-10 h-10" rounded="xl" />
        </div>
      </div>
    </div>
  )
}

// Loading spinner with pulse animation
export function LoadingSpinner({
  size = 24,
  className = ""
}: {
  size?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="text-indigo-400"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeOpacity="0.2"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  )
}

// Dots loading animation (like typing indicator)
export function LoadingDots({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-indigo-400"
          animate={{
            y: [0, -6, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// Content loading overlay
export function LoadingOverlay({
  message = "Loading...",
  className = ""
}: {
  message?: string
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-50 ${className}`}
    >
      <LoadingSpinner size={32} className="mb-3" />
      <p className="text-white/70 text-sm">{message}</p>
    </motion.div>
  )
}
