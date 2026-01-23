/**
 * API Utilities
 *
 * Timeout wrappers, error handling, and retry logic for API calls.
 */

import { API, ERRORS, TIMING } from '../../shared/constants'
import type { APIError, AppError } from '../../shared/types'

// ============================================================================
// TIMEOUT WRAPPER
// ============================================================================

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds (defaults to API_REQUEST timeout)
 * @param operation Optional operation name for error messages
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = TIMING.TIMEOUT.API_REQUEST,
  operation: string = 'Operation'
): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(createAPIError(
        ERRORS.CODES.TIMEOUT,
        `${operation} timed out after ${timeoutMs}ms`,
        true
      ))
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    return result
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryableErrors?: string[]
  onRetry?: (attempt: number, error: Error) => void
}

/**
 * Wraps a function with retry logic using exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = API.RETRY.MAX_ATTEMPTS,
    initialDelay = API.RETRY.INITIAL_DELAY,
    maxDelay = API.RETRY.MAX_DELAY,
    backoffMultiplier = API.RETRY.BACKOFF_MULTIPLIER,
    retryableErrors = [ERRORS.CODES.NETWORK, ERRORS.CODES.TIMEOUT, ERRORS.CODES.RATE_LIMIT],
    onRetry
  } = options

  let lastError: Error | undefined
  let delay = initialDelay

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Check if error is retryable
      const isRetryable = isRetryableError(error, retryableErrors)

      if (!isRetryable || attempt === maxAttempts) {
        throw error
      }

      // Notify about retry
      onRetry?.(attempt, lastError)

      // Wait before retrying with exponential backoff
      await sleep(delay)
      delay = Math.min(delay * backoffMultiplier, maxDelay)
    }
  }

  throw lastError
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown, retryableErrors: string[]): boolean {
  if (error && typeof error === 'object') {
    const apiError = error as Partial<APIError>

    // Check by error code
    if (apiError.code && retryableErrors.includes(apiError.code)) {
      return true
    }

    // Check by retryable flag
    if (apiError.retryable === true) {
      return true
    }

    // Check by HTTP status code (rate limiting)
    if (apiError.statusCode === 429) {
      return true
    }

    // Check for network errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      if (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('econnrefused') ||
        message.includes('enotfound') ||
        message.includes('socket')
      ) {
        return true
      }
    }
  }

  return false
}

// ============================================================================
// ERROR CREATION
// ============================================================================

/**
 * Create a standardized API error
 */
export function createAPIError(
  code: string,
  message: string,
  retryable: boolean = false,
  statusCode?: number
): APIError {
  return {
    code,
    message,
    severity: 'error',
    retryable,
    timestamp: Date.now(),
    statusCode
  }
}

/**
 * Create a standardized app error
 */
export function createAppError(
  code: string,
  message: string,
  severity: 'info' | 'warning' | 'error' | 'critical' = 'error',
  retryable: boolean = false
): AppError {
  return {
    code,
    message,
    severity,
    retryable,
    timestamp: Date.now()
  }
}

/**
 * Convert API errors to user-friendly messages
 */
export function getUserFriendlyError(error: unknown): string {
  if (error && typeof error === 'object') {
    const apiError = error as Partial<APIError>

    // Map known error codes to user-friendly messages
    switch (apiError.code) {
      case ERRORS.CODES.NETWORK:
        return ERRORS.MESSAGES.NETWORK_ERROR
      case ERRORS.CODES.AUTH:
        return ERRORS.MESSAGES.API_KEY_INVALID
      case ERRORS.CODES.RATE_LIMIT:
        return ERRORS.MESSAGES.RATE_LIMITED
      case ERRORS.CODES.CONTEXT:
        return ERRORS.MESSAGES.CONTEXT_EXCEEDED
      case ERRORS.CODES.PERMISSION:
        return ERRORS.MESSAGES.PERMISSION_DENIED
      case ERRORS.CODES.TIMEOUT:
        return 'Request timed out. Please try again.'
      default:
        if (apiError.message) {
          return apiError.message
        }
    }

    // Check HTTP status codes
    if (apiError.statusCode) {
      switch (apiError.statusCode) {
        case 401:
          return ERRORS.MESSAGES.API_KEY_INVALID
        case 429:
          return ERRORS.MESSAGES.RATE_LIMITED
        case 500:
        case 502:
        case 503:
          return 'The service is temporarily unavailable. Please try again.'
        default:
          break
      }
    }
  }

  if (error instanceof Error) {
    // Simplify technical error messages
    const message = error.message.toLowerCase()
    if (message.includes('network') || message.includes('fetch')) {
      return ERRORS.MESSAGES.NETWORK_ERROR
    }
    if (message.includes('timeout')) {
      return 'Request timed out. Please try again.'
    }
    if (message.includes('401') || message.includes('unauthorized')) {
      return ERRORS.MESSAGES.API_KEY_INVALID
    }
  }

  return ERRORS.MESSAGES.UNKNOWN_ERROR
}

// ============================================================================
// ABORT CONTROLLER UTILITIES
// ============================================================================

/**
 * Create an AbortController with automatic timeout
 */
export function createTimeoutAbortController(
  timeoutMs: number = TIMING.TIMEOUT.API_REQUEST
): { controller: AbortController; cleanup: () => void } {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  return {
    controller,
    cleanup: () => clearTimeout(timeoutId)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

/**
 * Parse Claude API error responses
 */
export function parseClaudeError(error: unknown): APIError {
  // Handle Anthropic SDK errors
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>

    // Check for status code in error object
    if ('status' in err && typeof err.status === 'number') {
      const status = err.status

      if (status === 401) {
        return createAPIError(ERRORS.CODES.AUTH, ERRORS.MESSAGES.API_KEY_INVALID, false, status)
      }
      if (status === 429) {
        return createAPIError(ERRORS.CODES.RATE_LIMIT, ERRORS.MESSAGES.RATE_LIMITED, true, status)
      }
      if (status >= 500) {
        return createAPIError(ERRORS.CODES.NETWORK, 'Claude API is temporarily unavailable', true, status)
      }
    }

    // Check for error message
    if ('message' in err && typeof err.message === 'string') {
      const message = err.message.toLowerCase()

      if (message.includes('invalid api key') || message.includes('invalid x-api-key')) {
        return createAPIError(ERRORS.CODES.AUTH, ERRORS.MESSAGES.API_KEY_INVALID, false)
      }
      if (message.includes('rate limit')) {
        return createAPIError(ERRORS.CODES.RATE_LIMIT, ERRORS.MESSAGES.RATE_LIMITED, true)
      }
      if (message.includes('context') || message.includes('token')) {
        return createAPIError(ERRORS.CODES.CONTEXT, ERRORS.MESSAGES.CONTEXT_EXCEEDED, false)
      }
    }

    // Check for error type in Anthropic errors
    if ('error' in err && typeof err.error === 'object' && err.error) {
      const innerError = err.error as Record<string, unknown>
      if ('type' in innerError && typeof innerError.type === 'string') {
        if (innerError.type === 'authentication_error') {
          return createAPIError(ERRORS.CODES.AUTH, ERRORS.MESSAGES.API_KEY_INVALID, false, 401)
        }
        if (innerError.type === 'rate_limit_error') {
          return createAPIError(ERRORS.CODES.RATE_LIMIT, ERRORS.MESSAGES.RATE_LIMITED, true, 429)
        }
      }
    }
  }

  // Default error
  return createAPIError(
    ERRORS.CODES.UNKNOWN,
    error instanceof Error ? error.message : ERRORS.MESSAGES.UNKNOWN_ERROR,
    false
  )
}
