import { useState, useEffect, useCallback } from "react"

interface NetworkStatus {
  isOnline: boolean
  isApiReachable: boolean
  lastChecked: number
}

const API_CHECK_URL = "https://api.anthropic.com"
const CHECK_INTERVAL = 30000 // Check every 30 seconds when online

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isApiReachable: true,
    lastChecked: Date.now()
  })

  const checkApiReachability = useCallback(async () => {
    try {
      // HEAD request to check if API is reachable
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(API_CHECK_URL, {
        method: "HEAD",
        signal: controller.signal
      })

      clearTimeout(timeout)

      // Any response means the API is reachable
      setStatus(prev => ({
        ...prev,
        isApiReachable: true,
        lastChecked: Date.now()
      }))
      return true
    } catch {
      setStatus(prev => ({
        ...prev,
        isApiReachable: false,
        lastChecked: Date.now()
      }))
      return false
    }
  }, [])

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }))
      // Check API when coming back online
      checkApiReachability()
    }

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isApiReachable: false
      }))
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Initial check
    checkApiReachability()

    // Periodic check when online
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkApiReachability()
      }
    }, CHECK_INTERVAL)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(interval)
    }
  }, [checkApiReachability])

  return {
    ...status,
    checkApiReachability
  }
}

// Error types for better handling
export enum ErrorType {
  NETWORK = "network",
  API_KEY = "api_key",
  RATE_LIMIT = "rate_limit",
  SERVER = "server",
  TIMEOUT = "timeout",
  UNKNOWN = "unknown"
}

export interface ApiError {
  type: ErrorType
  message: string
  retryable: boolean
  retryAfter?: number
}

export function parseApiError(error: unknown): ApiError {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      type: ErrorType.NETWORK,
      message: "Unable to connect. Please check your internet connection.",
      retryable: true
    }
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return {
      type: ErrorType.TIMEOUT,
      message: "Request timed out. Please try again.",
      retryable: true
    }
  }

  if (error instanceof Response || (error as { status?: number }).status) {
    const status = error instanceof Response ? error.status : (error as { status: number }).status

    switch (status) {
      case 401:
        return {
          type: ErrorType.API_KEY,
          message: "Invalid API key. Please check your settings.",
          retryable: false
        }
      case 429:
        return {
          type: ErrorType.RATE_LIMIT,
          message: "Rate limit exceeded. Please wait a moment before trying again.",
          retryable: true,
          retryAfter: 60000
        }
      case 500:
      case 502:
      case 503:
        return {
          type: ErrorType.SERVER,
          message: "Claude API is temporarily unavailable. Please try again later.",
          retryable: true,
          retryAfter: 5000
        }
    }
  }

  return {
    type: ErrorType.UNKNOWN,
    message: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
    retryable: true
  }
}

// Retry helper with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: unknown

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const parsedError = parseApiError(error)

      if (!parsedError.retryable) {
        throw error
      }

      if (i < maxRetries - 1) {
        const delay = parsedError.retryAfter || initialDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}
