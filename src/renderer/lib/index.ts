/**
 * Library Index
 *
 * Barrel export for all utility functions and modules.
 * Import from this file for cleaner imports.
 *
 * @example
 * import { analyzeScreenWithVision, validateMessage, withRetry } from '../lib'
 */

// Accessibility Utilities
export {
  ARIA_LABELS,
  prefersReducedMotion,
  onReducedMotionChange,
  trapFocus,
  announce,
  announceError,
  announceSuccess,
  generateId
} from './accessibility'

// API Utilities
export {
  withTimeout,
  withRetry,
  createAPIError,
  createAppError,
  getUserFriendlyError,
  createTimeoutAbortController,
  isOnline,
  parseClaudeError
} from './apiUtils'

// Claude API
export {
  analyzeScreenWithVision,
  streamChat,
  generateContextualSuggestion
} from './claude'

// Validation
export {
  validateApiKey,
  validateMessage,
  validateTaskContent,
  validateUrl,
  sanitizeHtml,
  escapeHtml,
  VALIDATION
} from './validation'

// Commands
export {
  getCommandSuggestions,
  executeCommand,
  COMMANDS,
  type Command
} from './commands'

// Models
export {
  MODELS,
  getModelById,
  getDefaultModel
} from './models'

// Personas
export {
  PERSONAS,
  getPersonaById,
  getDefaultPersona
} from './personas'

// Tasks
export {
  type Task,
  type TaskPriority,
  type TaskSource
} from './tasks'

// Context
export {
  getContextInfo
} from './context'

// Context Window
export {
  estimateTokens,
  trimMessagesToFit
} from './contextWindow'

// Animations
export {
  SPRING_CONFIGS,
  TRANSITION_CONFIGS
} from './animations'

// Persistence
export {
  saveToStorage,
  loadFromStorage,
  clearStorage
} from './persistence'

// Clipboard
export {
  copyToClipboard,
  readFromClipboard
} from './clipboard'

// Export
export {
  exportConversation,
  exportToMarkdown,
  exportToJSON
} from './export'

// Retry
export {
  retryWithBackoff
} from './retry'

// Licensing
export {
  checkLicense,
  validateLicenseKey
} from './licensing'
