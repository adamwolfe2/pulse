import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { WifiOff, CloudOff, RefreshCw } from "lucide-react"

interface NetworkStatusIndicatorProps {
  isOnline: boolean
  isApiReachable: boolean
  onRetry?: () => void
}

export function NetworkStatusIndicator({
  isOnline,
  isApiReachable,
  onRetry
}: NetworkStatusIndicatorProps) {
  const showIndicator = !isOnline || !isApiReachable

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-full shadow-lg"
            style={{
              background: !isOnline
                ? "rgba(239, 68, 68, 0.9)"
                : "rgba(245, 158, 11, 0.9)",
              backdropFilter: "blur(12px)"
            }}
          >
            {!isOnline ? (
              <>
                <WifiOff size={16} className="text-white" />
                <span className="text-white text-sm font-medium">
                  You're offline
                </span>
              </>
            ) : !isApiReachable ? (
              <>
                <CloudOff size={16} className="text-white" />
                <span className="text-white text-sm font-medium">
                  Claude API unavailable
                </span>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="ml-1 p-1 rounded-full hover:bg-white/20 transition-colors"
                    title="Retry connection"
                  >
                    <RefreshCw size={14} className="text-white" />
                  </button>
                )}
              </>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Toast notification for errors
interface ErrorToastProps {
  message: string
  type?: "error" | "warning" | "info"
  onDismiss?: () => void
  action?: {
    label: string
    onClick: () => void
  }
}

export function ErrorToast({ message, type = "error", onDismiss, action }: ErrorToastProps) {
  const bgColor = {
    error: "rgba(239, 68, 68, 0.95)",
    warning: "rgba(245, 158, 11, 0.95)",
    info: "rgba(99, 102, 241, 0.95)"
  }[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 max-w-sm"
    >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg"
        style={{
          background: bgColor,
          backdropFilter: "blur(12px)"
        }}
      >
        <span className="text-white text-sm flex-1">{message}</span>
        {action && (
          <button
            onClick={action.onClick}
            className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30
                     text-white text-sm font-medium transition-colors"
          >
            {action.label}
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white/80"
          >
            ✕
          </button>
        )}
      </div>
    </motion.div>
  )
}
