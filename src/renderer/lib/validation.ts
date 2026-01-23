/**
 * Input Validation and Sanitization Utilities
 *
 * Provides validation functions and sanitization for user inputs.
 */

// ============================================================================
// API KEY VALIDATION
// ============================================================================

/**
 * Validate Anthropic API key format
 * API keys start with 'sk-ant-' and are 108 characters long
 */
export function validateApiKey(apiKey: string): {
  valid: boolean
  error?: string
} {
  if (!apiKey || typeof apiKey !== 'string') {
    return { valid: false, error: 'API key is required' }
  }

  const trimmed = apiKey.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: 'API key is required' }
  }

  // Anthropic API keys typically start with 'sk-ant-'
  if (!trimmed.startsWith('sk-ant-')) {
    return { valid: false, error: 'Invalid API key format. Keys should start with sk-ant-' }
  }

  // API keys are typically 108 characters
  if (trimmed.length < 40) {
    return { valid: false, error: 'API key appears to be too short' }
  }

  return { valid: true }
}

// ============================================================================
// TEXT INPUT VALIDATION
// ============================================================================

/**
 * Validate and sanitize chat message input
 */
export function validateMessage(message: string): {
  valid: boolean
  sanitized: string
  error?: string
} {
  if (!message || typeof message !== 'string') {
    return { valid: false, sanitized: '', error: 'Message is required' }
  }

  // Trim whitespace
  let sanitized = message.trim()

  if (sanitized.length === 0) {
    return { valid: false, sanitized: '', error: 'Message cannot be empty' }
  }

  // Max message length (adjust as needed)
  const MAX_MESSAGE_LENGTH = 32000
  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    sanitized = sanitized.substring(0, MAX_MESSAGE_LENGTH)
    return {
      valid: true,
      sanitized,
      error: `Message truncated to ${MAX_MESSAGE_LENGTH} characters`
    }
  }

  return { valid: true, sanitized }
}

/**
 * Validate task content
 */
export function validateTaskContent(content: string): {
  valid: boolean
  sanitized: string
  error?: string
} {
  if (!content || typeof content !== 'string') {
    return { valid: false, sanitized: '', error: 'Task content is required' }
  }

  let sanitized = content.trim()

  if (sanitized.length === 0) {
    return { valid: false, sanitized: '', error: 'Task cannot be empty' }
  }

  const MAX_TASK_LENGTH = 500
  if (sanitized.length > MAX_TASK_LENGTH) {
    sanitized = sanitized.substring(0, MAX_TASK_LENGTH)
  }

  return { valid: true, sanitized }
}

// ============================================================================
// URL VALIDATION
// ============================================================================

/**
 * Validate URL format
 */
export function validateUrl(url: string): {
  valid: boolean
  error?: string
} {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' }
  }

  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' }
    }
    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
}

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitize HTML to prevent XSS attacks
 * Strips all HTML tags
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''

  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Sanitize filename (remove path traversal, special chars)
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return ''

  return filename
    .replace(/\.\./g, '') // Prevent path traversal
    .replace(/[/\\:*?"<>|]/g, '') // Remove special chars
    .trim()
}

// ============================================================================
// NUMBER VALIDATION
// ============================================================================

/**
 * Validate number within range
 */
export function validateNumber(
  value: unknown,
  options: {
    min?: number
    max?: number
    allowFloat?: boolean
  } = {}
): {
  valid: boolean
  value?: number
  error?: string
} {
  const { min = -Infinity, max = Infinity, allowFloat = true } = options

  if (value === null || value === undefined) {
    return { valid: false, error: 'Value is required' }
  }

  const num = typeof value === 'string' ? parseFloat(value) : Number(value)

  if (isNaN(num)) {
    return { valid: false, error: 'Invalid number' }
  }

  if (!allowFloat && !Number.isInteger(num)) {
    return { valid: false, error: 'Must be a whole number' }
  }

  if (num < min) {
    return { valid: false, error: `Value must be at least ${min}` }
  }

  if (num > max) {
    return { valid: false, error: `Value must be at most ${max}` }
  }

  return { valid: true, value: num }
}

/**
 * Validate temperature value for AI (0-1)
 */
export function validateTemperature(value: unknown): {
  valid: boolean
  value?: number
  error?: string
} {
  return validateNumber(value, { min: 0, max: 1, allowFloat: true })
}

// ============================================================================
// JSON VALIDATION
// ============================================================================

/**
 * Safely parse JSON with error handling
 */
export function safeParseJson<T = unknown>(input: string): {
  success: boolean
  data?: T
  error?: string
} {
  if (!input || typeof input !== 'string') {
    return { success: false, error: 'Invalid input' }
  }

  try {
    const data = JSON.parse(input) as T
    return { success: true, data }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to parse JSON'
    }
  }
}

// ============================================================================
// FORM VALIDATION HELPERS
// ============================================================================

export interface ValidationRule {
  validate: (value: unknown) => boolean
  message: string
}

/**
 * Create a validation rule for required fields
 */
export function required(message = 'This field is required'): ValidationRule {
  return {
    validate: (value) => {
      if (value === null || value === undefined) return false
      if (typeof value === 'string') return value.trim().length > 0
      if (Array.isArray(value)) return value.length > 0
      return true
    },
    message
  }
}

/**
 * Create a validation rule for minimum length
 */
export function minLength(min: number, message?: string): ValidationRule {
  return {
    validate: (value) => {
      if (typeof value !== 'string') return false
      return value.length >= min
    },
    message: message || `Must be at least ${min} characters`
  }
}

/**
 * Create a validation rule for maximum length
 */
export function maxLength(max: number, message?: string): ValidationRule {
  return {
    validate: (value) => {
      if (typeof value !== 'string') return false
      return value.length <= max
    },
    message: message || `Must be at most ${max} characters`
  }
}

/**
 * Create a validation rule for pattern matching
 */
export function pattern(regex: RegExp, message: string): ValidationRule {
  return {
    validate: (value) => {
      if (typeof value !== 'string') return false
      return regex.test(value)
    },
    message
  }
}

/**
 * Run multiple validation rules against a value
 */
export function runValidation(
  value: unknown,
  rules: ValidationRule[]
): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push(rule.message)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
