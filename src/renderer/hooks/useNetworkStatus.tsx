/**
 * Network Status Hook
 *
 * Monitors network connectivity and provides status information.
 * Includes automatic reconnection detection and event handling.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { isOnline } from '../lib/apiUtils'

export type NetworkStatus = 'online' | 'offline' | 'reconnecting'

export interface NetworkState {
  status: NetworkStatus
  isOnline: boolean
  isOffline: boolean
  isReconnecting: boolean
  lastOnline: number | null
  offlineDuration: number | null
}

interface UseNetworkStatusOptions {
  /** Callback when going offline */
  onOffline?: () => void
  /** Callback when coming back online */
  onOnline?: () => void
  /** Callback when reconnecting (transition from offline to online) */
  onReconnect?: () => void
  /** Interval to check connection (for additional verification) */
  pingInterval?: number
  /** URL to ping for connection verification */
  pingUrl?: string
}

/**
 * Hook to monitor network connectivity status
 */
export function useNetworkStatus(options: UseNetworkStatusOptions = {}): NetworkState {
  const {
    onOffline,
    onOnline,
    onReconnect,
    pingInterval = 0, // Disabled by default
    pingUrl = 'https://api.anthropic.com'
  } = options

  const [status, setStatus] = useState<NetworkStatus>(isOnline() ? 'online' : 'offline')
  const [lastOnline, setLastOnline] = useState<number | null>(isOnline() ? Date.now() : null)
  const wasOfflineRef = useRef(false)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate offline duration
  const offlineDuration = status === 'offline' && lastOnline
    ? Date.now() - lastOnline
    : null

  // Handle online event
  const handleOnline = useCallback(() => {
    const wasOffline = wasOfflineRef.current

    // Set to reconnecting briefly to show transition
    if (wasOffline) {
      setStatus('reconnecting')
      onReconnect?.()

      // Transition to online after brief delay
      setTimeout(() => {
        setStatus('online')
        setLastOnline(Date.now())
        wasOfflineRef.current = false
        onOnline?.()
      }, 1000)
    } else {
      setStatus('online')
      setLastOnline(Date.now())
      onOnline?.()
    }
  }, [onOnline, onReconnect])

  // Handle offline event
  const handleOffline = useCallback(() => {
    wasOfflineRef.current = true
    setStatus('offline')
    onOffline?.()
  }, [onOffline])

  // Optional ping check for more reliable detection
  const checkConnection = useCallback(async () => {
    if (!pingInterval || pingInterval <= 0) return

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      await fetch(pingUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (status === 'offline') {
        handleOnline()
      }
    } catch {
      if (status === 'online') {
        handleOffline()
      }
    }
  }, [pingInterval, pingUrl, status, handleOnline, handleOffline])

  useEffect(() => {
    // Listen for browser online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    if (!isOnline()) {
      handleOffline()
    }

    // Optional ping interval
    if (pingInterval && pingInterval > 0) {
      pingIntervalRef.current = setInterval(checkConnection, pingInterval)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
      }
    }
  }, [handleOnline, handleOffline, pingInterval, checkConnection])

  return {
    status,
    isOnline: status === 'online' || status === 'reconnecting',
    isOffline: status === 'offline',
    isReconnecting: status === 'reconnecting',
    lastOnline,
    offlineDuration
  }
}

/**
 * Format offline duration for display
 */
export function formatOfflineDuration(ms: number | null): string {
  if (ms === null) return ''

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

/**
 * Hook to detect slow network conditions
 */
export function useNetworkSpeed(): 'fast' | 'slow' | 'unknown' {
  const [speed, setSpeed] = useState<'fast' | 'slow' | 'unknown'>('unknown')

  useEffect(() => {
    // Use Network Information API if available
    const connection = (navigator as Navigator & {
      connection?: {
        effectiveType?: string
        addEventListener?: (event: string, handler: () => void) => void
        removeEventListener?: (event: string, handler: () => void) => void
      }
    }).connection

    const updateSpeed = () => {
      if (connection?.effectiveType) {
        const effectiveType = connection.effectiveType
        if (effectiveType === '4g') {
          setSpeed('fast')
        } else if (effectiveType === '3g' || effectiveType === '2g' || effectiveType === 'slow-2g') {
          setSpeed('slow')
        } else {
          setSpeed('unknown')
        }
      }
    }

    updateSpeed()
    connection?.addEventListener?.('change', updateSpeed)

    return () => {
      connection?.removeEventListener?.('change', updateSpeed)
    }
  }, [])

  return speed
}
