import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, RefreshCw, X, Check, AlertCircle, Sparkles } from "lucide-react"

interface UpdateStatus {
  status: "checking" | "available" | "up-to-date" | "downloading" | "ready" | "error"
  version?: string
  releaseNotes?: string
  percent?: number
  bytesPerSecond?: number
  transferred?: number
  total?: number
  error?: string
}

interface UpdateNotificationProps {
  onDismiss?: () => void
}

export function UpdateNotification({ onDismiss }: UpdateNotificationProps) {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Listen for update events from main process
    window.pulse?.onUpdateStatus?.((data) => {
      setUpdateStatus(data)
      // Auto-dismiss certain statuses
      if (data.status === "up-to-date") {
        setTimeout(() => setUpdateStatus(null), 3000)
      }
    })

    return () => {
      // Cleanup handled by removeAllListeners
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    setUpdateStatus(null)
    onDismiss?.()
  }

  const handleInstall = async () => {
    try {
      await window.pulse?.updates?.install()
    } catch (error) {
      console.error("Failed to install update:", error)
    }
  }

  const handleCheckUpdate = async () => {
    try {
      await window.pulse?.updates?.check()
    } catch (error) {
      console.error("Failed to check for updates:", error)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Don't show if dismissed or no update status
  if (dismissed || !updateStatus) return null

  // Only show notification for certain statuses
  const showableStatuses = ["available", "downloading", "ready", "error"]
  if (!showableStatuses.includes(updateStatus.status)) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-4 right-4 z-50 max-w-sm"
      >
        <div
          className="rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: "rgba(30, 30, 35, 0.98)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              {updateStatus.status === "error" ? (
                <AlertCircle size={16} className="text-red-400" />
              ) : updateStatus.status === "ready" ? (
                <Check size={16} className="text-green-400" />
              ) : (
                <Sparkles size={16} className="text-indigo-400" />
              )}
              <span className="text-white font-medium text-sm">
                {updateStatus.status === "available" && "Update Available"}
                {updateStatus.status === "downloading" && "Downloading Update"}
                {updateStatus.status === "ready" && "Update Ready"}
                {updateStatus.status === "error" && "Update Error"}
              </span>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 rounded text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {updateStatus.status === "available" && (
              <>
                <p className="text-white/70 text-sm mb-3">
                  Pulse <span className="text-white font-medium">{updateStatus.version}</span> is available.
                  {updateStatus.releaseNotes && (
                    <span className="block mt-1 text-white/50 text-xs">
                      {typeof updateStatus.releaseNotes === "string"
                        ? updateStatus.releaseNotes.slice(0, 100)
                        : "New features and improvements"}
                      ...
                    </span>
                  )}
                </p>
                <p className="text-white/40 text-xs">
                  Downloading in the background...
                </p>
              </>
            )}

            {updateStatus.status === "downloading" && (
              <>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-white/50 mb-1">
                    <span>Downloading...</span>
                    <span>{updateStatus.percent}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${updateStatus.percent || 0}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
                {updateStatus.bytesPerSecond && updateStatus.transferred && updateStatus.total && (
                  <p className="text-white/40 text-xs">
                    {formatBytes(updateStatus.transferred)} / {formatBytes(updateStatus.total)} • {formatBytes(updateStatus.bytesPerSecond)}/s
                  </p>
                )}
              </>
            )}

            {updateStatus.status === "ready" && (
              <>
                <p className="text-white/70 text-sm mb-4">
                  Pulse <span className="text-white font-medium">{updateStatus.version}</span> is ready to install.
                  Restart now to get the latest features.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-3 py-2 rounded-lg text-white/60 hover:text-white
                             bg-white/5 hover:bg-white/10 transition-colors text-sm"
                  >
                    Later
                  </button>
                  <button
                    onClick={handleInstall}
                    className="flex-1 px-3 py-2 rounded-lg text-white font-medium
                             flex items-center justify-center gap-2 text-sm"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    }}
                  >
                    <RefreshCw size={14} />
                    Restart Now
                  </button>
                </div>
              </>
            )}

            {updateStatus.status === "error" && (
              <>
                <p className="text-white/70 text-sm mb-3">
                  Failed to download update: {updateStatus.error || "Unknown error"}
                </p>
                <button
                  onClick={handleCheckUpdate}
                  className="w-full px-3 py-2 rounded-lg text-white/70 hover:text-white
                           bg-white/10 hover:bg-white/15 transition-colors text-sm
                           flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} />
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook for manual update checking (e.g., from settings)
export function useUpdateChecker() {
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkForUpdates = async () => {
    setIsChecking(true)
    try {
      const result = await window.pulse?.updates?.check()
      setLastCheck(new Date())
      return result
    } finally {
      setIsChecking(false)
    }
  }

  return { checkForUpdates, isChecking, lastCheck }
}
