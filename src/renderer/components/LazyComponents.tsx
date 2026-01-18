import React, { lazy, Suspense, ComponentType, ReactNode } from "react"
import { motion } from "framer-motion"

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full"
      />
    </div>
  )
}

// Generic lazy loader wrapper
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback: ReactNode = <LoadingFallback />
): ComponentType<P> {
  const LazyComponent = lazy(importFn)

  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// Lazy-loaded heavy components
export const LazySettingsWindow = withLazyLoading(
  () => import("./Settings/SettingsWindow").then(m => ({ default: m.SettingsWindow }))
)

export const LazyOnboardingFlow = withLazyLoading(
  () => import("./Onboarding/OnboardingFlow").then(m => ({ default: m.OnboardingFlow }))
)

export const LazyConversationSidebar = withLazyLoading(
  () => import("./ConversationSidebar").then(m => ({ default: m.ConversationSidebar }))
)

// Skeleton loaders for specific components
export function MessageSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex justify-end">
        <div className="w-2/3 h-12 bg-white/10 rounded-2xl" />
      </div>
      <div className="flex justify-start">
        <div className="w-3/4 h-20 bg-white/10 rounded-2xl" />
      </div>
    </div>
  )
}

export function SidebarSkeleton() {
  return (
    <div className="animate-pulse p-4 space-y-3">
      <div className="h-8 bg-white/10 rounded-lg w-3/4" />
      <div className="h-10 bg-white/10 rounded-lg" />
      <div className="space-y-2 pt-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-14 bg-white/5 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
