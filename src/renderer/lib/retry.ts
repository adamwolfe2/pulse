// Retry Logic for API Calls
// Implements exponential backoff with jitter

export interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryableErrors?: string[]
  onRetry?: (attempt: number, error: Error, delay: number) => void
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "onRetry">> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    "ECONNRESET",
    "ETIMEDOUT",
    "ECONNREFUSED",
    "EPIPE",
    "ENOTFOUND",
    "ENETUNREACH",
    "EAI_AGAIN",
    "overloaded",
    "rate_limit",
    "timeout",
    "503",
    "529"
  ]
}

// Check if error is retryable
function isRetryableError(error: Error, retryableErrors: string[]): boolean {
  const errorString = `${error.name} ${error.message}`.toLowerCase()

  return retryableErrors.some(retryable =>
    errorString.includes(retryable.toLowerCase())
  )
}

// Calculate delay with exponential backoff and jitter
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attempt - 1)
  const cappedDelay = Math.min(exponentialDelay, maxDelay)
  // Add jitter (±25%)
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1)
  return Math.floor(cappedDelay + jitter)
}

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Main retry wrapper
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if we should retry
      const shouldRetry = attempt < opts.maxAttempts && isRetryableError(lastError, opts.retryableErrors)

      if (!shouldRetry) {
        throw lastError
      }

      // Calculate delay
      const delay = calculateDelay(attempt, opts.initialDelay, opts.maxDelay, opts.backoffMultiplier)

      // Call retry callback if provided
      opts.onRetry?.(attempt, lastError, delay)

      // Wait before retrying
      await sleep(delay)
    }
  }

  throw lastError!
}

// Retry wrapper with abort support
export async function withRetryAbortable<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  abortController: AbortController,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    // Check if aborted
    if (abortController.signal.aborted) {
      throw new Error("Request aborted")
    }

    try {
      return await fn(abortController.signal)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry if aborted
      if (abortController.signal.aborted) {
        throw new Error("Request aborted")
      }

      // Check if we should retry
      const shouldRetry = attempt < opts.maxAttempts && isRetryableError(lastError, opts.retryableErrors)

      if (!shouldRetry) {
        throw lastError
      }

      // Calculate delay
      const delay = calculateDelay(attempt, opts.initialDelay, opts.maxDelay, opts.backoffMultiplier)

      // Call retry callback if provided
      opts.onRetry?.(attempt, lastError, delay)

      // Wait before retrying (but respect abort)
      await Promise.race([
        sleep(delay),
        new Promise((_, reject) => {
          abortController.signal.addEventListener("abort", () => {
            reject(new Error("Request aborted"))
          })
        })
      ])
    }
  }

  throw lastError!
}

// Specific retry config for Anthropic API
export const ANTHROPIC_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    "overloaded",
    "rate_limit",
    "529",
    "503",
    "timeout",
    "ECONNRESET",
    "ETIMEDOUT"
  ]
}

// Circuit breaker state
interface CircuitBreakerState {
  failures: number
  lastFailure: number
  isOpen: boolean
}

const circuitBreakers = new Map<string, CircuitBreakerState>()

export function withCircuitBreaker<T>(
  key: string,
  fn: () => Promise<T>,
  options: {
    failureThreshold?: number
    resetTimeout?: number
  } = {}
): Promise<T> {
  const { failureThreshold = 5, resetTimeout = 60000 } = options

  let state = circuitBreakers.get(key)
  if (!state) {
    state = { failures: 0, lastFailure: 0, isOpen: false }
    circuitBreakers.set(key, state)
  }

  // Check if circuit is open
  if (state.isOpen) {
    const timeSinceLastFailure = Date.now() - state.lastFailure
    if (timeSinceLastFailure > resetTimeout) {
      // Reset circuit
      state.failures = 0
      state.isOpen = false
    } else {
      throw new Error(`Circuit breaker open for ${key}. Try again in ${Math.ceil((resetTimeout - timeSinceLastFailure) / 1000)}s`)
    }
  }

  return fn()
    .then(result => {
      // Reset on success
      state!.failures = 0
      return result
    })
    .catch(error => {
      // Record failure
      state!.failures++
      state!.lastFailure = Date.now()

      if (state!.failures >= failureThreshold) {
        state!.isOpen = true
      }

      throw error
    })
}
