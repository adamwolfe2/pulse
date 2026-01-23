/**
 * Network Status Indicator Component
 *
 * Displays network connectivity status with animations and accessibility support.
 * Shows offline warnings and reconnection indicators.
 *
 * Accessibility: Implements WCAG 2.1 AA compliance with ARIA live regions,
 * proper roles, and reduced motion support.
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, CloudOff, RefreshCw, AlertCircle, X } from 'lucide-react'
import { useNetworkStatus, formatOfflineDuration } from '../hooks/useNetworkStatus'
import { useReducedMotion } from '../hooks/useAccessibility'
import { ANIMATIONS } from '../../shared/constants'

interface NetworkStatusIndicatorProps {
  /** Position of the indicator */
  position?: 'top' | 'bottom'
  /** Whether to show the indicator inline or as a banner */
  variant?: 'banner' | 'badge' | 'minimal' | 'pill'
  /** Callback when going offline */
  onOffline?: () => void
  /** Callback when coming back online */
  onOnline?: () => void
  /** Show reconnection tips */
  showTips?: boolean
  /** Allow dismissing the indicator */
  dismissable?: boolean
}

export function NetworkStatusIndicator({
  position = 'top',
  variant = 'pill',
  onOffline,
  onOnline,
  showTips = false,
  dismissable = false
}: NetworkStatusIndicatorProps) {
  const { status, isOffline, isReconnecting, offlineDuration } = useNetworkStatus({
    onOffline,
    onOnline
  })
  const prefersReducedMotion = useReducedMotion()
  const [isDismissed, setIsDismissed] = React.useState(false)

  // Reset dismissed state when coming back online
  React.useEffect(() => {
    if (status === 'online') {
      setIsDismissed(false)
    }
  }, [status])

  // Don't show anything when online or dismissed
  if (status === 'online' || isDismissed) {
    return null
  }

  const positionClasses = position === 'top' ? 'top-4' : 'bottom-4'

  // Minimal variant (small inline indicator)
  if (variant === 'minimal') {
    return (
      <AnimatePresence>
        {(isOffline || isReconnecting) && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
            style={{
              background: isReconnecting ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: isReconnecting ? '#fbbf24' : '#f87171'
            }}
            role="status"
            aria-live="polite"
            aria-label={isReconnecting ? 'Reconnecting to network' : 'Network offline'}
          >
            {isReconnecting ? (
              <RefreshCw size={12} className="animate-spin" aria-hidden="true" />
            ) : (
              <WifiOff size={12} aria-hidden="true" />
            )}
            <span>{isReconnecting ? 'Reconnecting...' : 'Offline'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // Badge variant (inline with background)
  if (variant === 'badge') {
    return (
      <AnimatePresence>
        {(isOffline || isReconnecting) && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: prefersReducedMotion ? 0 : ANIMATIONS.DURATION.NORMAL }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
              background: isReconnecting ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${isReconnecting ? 'rgba(234, 179, 8, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}
            role="alert"
            aria-live="assertive"
          >
            {isReconnecting ? (
              <>
                <RefreshCw size={14} className="animate-spin text-yellow-400" aria-hidden="true" />
                <span className="text-sm text-yellow-400">Reconnecting...</span>
              </>
            ) : (
              <>
                <WifiOff size={14} className="text-red-400" aria-hidden="true" />
                <span className="text-sm text-red-400">No connection</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // Pill variant (floating centered pill)
  if (variant === 'pill') {
    return (
      <AnimatePresence>
        {(isOffline || isReconnecting) && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
            transition={{ duration: prefersReducedMotion ? 0 : ANIMATIONS.DURATION.NORMAL }}
            className={`fixed ${positionClasses} left-1/2 -translate-x-1/2 z-50`}
            role="alert"
            aria-live="assertive"
          >
            <div
              className="flex items-center gap-3 px-4 py-2.5 rounded-full shadow-lg"
              style={{
                background: isReconnecting
                  ? 'rgba(245, 158, 11, 0.95)'
                  : 'rgba(239, 68, 68, 0.95)',
                backdropFilter: 'blur(12px)'
              }}
            >
              {isReconnecting ? (
                <RefreshCw size={16} className="text-white animate-spin" aria-hidden="true" />
              ) : (
                <WifiOff size={16} className="text-white" aria-hidden="true" />
              )}
              <span className="text-white text-sm font-medium">
                {isReconnecting ? 'Reconnecting...' : "You're offline"}
              </span>
              {offlineDuration && !isReconnecting && (
                <span className="text-white/70 text-xs">
                  {formatOfflineDuration(offlineDuration)}
                </span>
              )}
              {dismissable && (
                <button
                  onClick={() => setIsDismissed(true)}
                  className="ml-1 p-1 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X size={14} className="text-white" aria-hidden="true" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // Banner variant (full width)
  return (
    <AnimatePresence>
      {(isOffline || isReconnecting) && (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: position === 'top' ? -50 : 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: position === 'top' ? -50 : 50 }}
          transition={{ duration: prefersReducedMotion ? 0 : ANIMATIONS.DURATION.NORMAL }}
          className={`fixed left-0 right-0 z-50 ${position === 'top' ? 'top-0' : 'bottom-0'}`}
          role="alert"
          aria-live="assertive"
        >
          <div
            className="mx-4 my-3 p-4 rounded-xl"
            style={{
              background: isReconnecting
                ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(251, 191, 36, 0.1))'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(248, 113, 113, 0.1))',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${isReconnecting ? 'rgba(234, 179, 8, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className={`p-2 rounded-lg ${isReconnecting ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}
              >
                {isReconnecting ? (
                  <RefreshCw
                    size={20}
                    className="text-yellow-400 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <WifiOff size={20} className="text-red-400" aria-hidden="true" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h4 className={`font-medium ${isReconnecting ? 'text-yellow-400' : 'text-red-400'}`}>
                  {isReconnecting ? 'Reconnecting...' : "You're offline"}
                </h4>
                <p className="text-white/60 text-sm mt-0.5">
                  {isReconnecting
                    ? 'Attempting to restore connection'
                    : `Check your internet connection${offlineDuration ? ` (offline for ${formatOfflineDuration(offlineDuration)})` : ''}`}
                </p>

                {/* Tips */}
                {showTips && isOffline && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-start gap-2 text-white/50 text-xs">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <ul className="space-y-1">
                        <li>Check if Wi-Fi is enabled</li>
                        <li>Try moving closer to your router</li>
                        <li>Verify your network settings</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Dismiss button */}
              {dismissable && (
                <button
                  onClick={() => setIsDismissed(true)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60"
                  aria-label="Dismiss notification"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Compact inline network status for use in headers/footers
 */
export function NetworkStatusBadge() {
  const { isOffline, isReconnecting } = useNetworkStatus()

  if (!isOffline && !isReconnecting) {
    return null
  }

  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px]"
      style={{
        background: isReconnecting ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)',
        color: isReconnecting ? '#fbbf24' : '#f87171'
      }}
      role="status"
      aria-label={isReconnecting ? 'Reconnecting' : 'Offline'}
    >
      {isReconnecting ? (
        <RefreshCw size={10} className="animate-spin" aria-hidden="true" />
      ) : (
        <WifiOff size={10} aria-hidden="true" />
      )}
      <span>{isReconnecting ? 'Reconnecting' : 'Offline'}</span>
    </div>
  )
}

/**
 * Legacy props interface (for backwards compatibility)
 */
interface LegacyNetworkStatusIndicatorProps {
  isOnline: boolean
  isApiReachable: boolean
  onRetry?: () => void
}

/**
 * Legacy NetworkStatusIndicator for backwards compatibility
 * @deprecated Use NetworkStatusIndicator with hooks instead
 */
export function LegacyNetworkStatusIndicator({
  isOnline,
  isApiReachable,
  onRetry
}: LegacyNetworkStatusIndicatorProps) {
  const showIndicator = !isOnline || !isApiReachable

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          role="alert"
          aria-live="assertive"
        >
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-full shadow-lg"
            style={{
              background: !isOnline
                ? 'rgba(239, 68, 68, 0.9)'
                : 'rgba(245, 158, 11, 0.9)',
              backdropFilter: 'blur(12px)'
            }}
          >
            {!isOnline ? (
              <>
                <WifiOff size={16} className="text-white" aria-hidden="true" />
                <span className="text-white text-sm font-medium">
                  You're offline
                </span>
              </>
            ) : !isApiReachable ? (
              <>
                <CloudOff size={16} className="text-white" aria-hidden="true" />
                <span className="text-white text-sm font-medium">
                  Claude API unavailable
                </span>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="ml-1 p-1 rounded-full hover:bg-white/20 transition-colors"
                    aria-label="Retry connection"
                  >
                    <RefreshCw size={14} className="text-white" aria-hidden="true" />
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

/**
 * Network status context for wrapping content that requires network
 */
interface OfflineOverlayProps {
  children: React.ReactNode
  message?: string
  showRetry?: boolean
  onRetry?: () => void
}

export function OfflineOverlay({
  children,
  message = 'This feature requires an internet connection',
  showRetry = true,
  onRetry
}: OfflineOverlayProps) {
  const { isOffline } = useNetworkStatus()
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="relative">
      {children}

      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)'
            }}
            role="alert"
            aria-live="assertive"
          >
            <div className="text-center p-6">
              <WifiOff size={40} className="mx-auto text-white/40 mb-4" aria-hidden="true" />
              <p className="text-white/60 text-sm mb-4">{message}</p>
              {showRetry && onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white/80 text-sm
                           hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  Retry
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Toast notification for errors
interface ErrorToastProps {
  message: string
  type?: 'error' | 'warning' | 'info'
  onDismiss?: () => void
  action?: {
    label: string
    onClick: () => void
  }
}

export function ErrorToast({ message, type = 'error', onDismiss, action }: ErrorToastProps) {
  const bgColor = {
    error: 'rgba(239, 68, 68, 0.95)',
    warning: 'rgba(245, 158, 11, 0.95)',
    info: 'rgba(99, 102, 241, 0.95)'
  }[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 max-w-sm"
      role="alert"
      aria-live="polite"
    >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg"
        style={{
          background: bgColor,
          backdropFilter: 'blur(12px)'
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
            aria-label="Dismiss"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>
    </motion.div>
  )
}
