import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Sparkles, X, ExternalLink } from "lucide-react"
import { getTrialDaysRemaining, getLicenseStatus, getPurchaseUrl } from "../lib/licensing"

interface TrialBannerProps {
  onDismiss?: () => void
  compact?: boolean
}

export function TrialBanner({ onDismiss, compact = false }: TrialBannerProps) {
  const { status, type } = getLicenseStatus()
  const daysRemaining = getTrialDaysRemaining()

  // Don't show if user has a license or if trial hasn't started
  if (type !== "trial" || status !== "active") {
    return null
  }

  // Determine urgency level
  const isUrgent = daysRemaining <= 2
  const isWarning = daysRemaining <= 4

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
          ${isUrgent
            ? "bg-red-500/20 text-red-400 border border-red-500/30"
            : isWarning
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
          }`}
      >
        <Clock size={12} />
        <span>{daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left</span>
        <a
          href={getPurchaseUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 underline hover:no-underline"
        >
          Upgrade
        </a>
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className={`relative overflow-hidden ${
          isUrgent
            ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30"
            : isWarning
              ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30"
              : "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/30"
        } border-b`}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${
              isUrgent
                ? "bg-red-500/20"
                : isWarning
                  ? "bg-amber-500/20"
                  : "bg-indigo-500/20"
            }`}>
              {isUrgent ? (
                <Clock size={16} className="text-red-400" />
              ) : (
                <Sparkles size={16} className={isWarning ? "text-amber-400" : "text-indigo-400"} />
              )}
            </div>
            <div>
              <p className={`text-sm font-medium ${
                isUrgent ? "text-red-400" : isWarning ? "text-amber-400" : "text-white"
              }`}>
                {isUrgent
                  ? `Only ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left in your trial!`
                  : `${daysRemaining} days remaining in your free trial`
                }
              </p>
              <p className="text-xs text-white/50 mt-0.5">
                {isUrgent
                  ? "Upgrade now to keep using Pulse without interruption"
                  : "Unlock unlimited conversations and premium features"
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={getPurchaseUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${isUrgent
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : isWarning
                    ? "bg-amber-500 hover:bg-amber-600 text-black"
                    : "bg-indigo-500 hover:bg-indigo-600 text-white"
                }`}
            >
              Upgrade
              <ExternalLink size={14} />
            </a>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar showing trial progress */}
        <div className="h-1 bg-black/20">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((7 - daysRemaining) / 7) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full ${
              isUrgent
                ? "bg-red-500"
                : isWarning
                  ? "bg-amber-500"
                  : "bg-indigo-500"
            }`}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Trial expired overlay
export function TrialExpiredOverlay({ onUpgrade }: { onUpgrade: () => void }) {
  const { status, type } = getLicenseStatus()

  if (status !== "none" || type !== "trial") {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-[400px] p-6 rounded-2xl text-center"
        style={{
          background: "rgba(20, 20, 25, 0.98)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)"
        }}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Sparkles size={32} className="text-white" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          Your Trial Has Ended
        </h2>

        <p className="text-white/60 text-sm mb-6">
          Thanks for trying Pulse! Upgrade to continue using all features including unlimited conversations,
          conversation history, and priority support.
        </p>

        <div className="space-y-3">
          <button
            onClick={onUpgrade}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600
                     text-white font-medium hover:opacity-90 transition-opacity"
          >
            Upgrade to Pro - $9.99/month
          </button>

          <a
            href={getPurchaseUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 rounded-xl bg-white/5 border border-white/10
                     text-white/70 font-medium hover:bg-white/10 transition-colors"
          >
            View All Plans
          </a>
        </div>

        <p className="text-white/30 text-xs mt-4">
          Have a license key? Enter it in Settings → License
        </p>
      </motion.div>
    </motion.div>
  )
}
