/**
 * Pulse Shared Types
 *
 * Centralized type definitions used across the application.
 * These types ensure consistency between main process and renderer.
 */

// ============================================================================
// MESSAGE & CONVERSATION TYPES
// ============================================================================

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  /** Optional screenshot attached to the message */
  screenshot?: string
  /** Token count for this message (estimated) */
  tokenCount?: number
  /** Whether this message is still being streamed */
  isStreaming?: boolean
  /** Error associated with this message */
  error?: MessageError
}

export interface MessageError {
  code: string
  message: string
  retryable: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  /** Whether conversation is pinned */
  isPinned?: boolean
  /** Whether conversation is archived */
  isArchived?: boolean
  /** Custom color/label for organization */
  label?: string
  /** Total token count */
  totalTokens?: number
}

// ============================================================================
// TASK TYPES
// ============================================================================

export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskSource = 'keyboard' | 'voice' | 'ai-suggested' | 'quick-capture' | 'import'

export interface Task {
  id: string
  content: string
  completed: boolean
  priority: TaskPriority
  createdAt: number
  completedAt?: number
  source: TaskSource
  /** Associated tags (extracted from #hashtags) */
  tags?: string[]
  /** Optional due date */
  dueDate?: number
  /** Sprint this task belongs to */
  sprintId?: string
  /** Additional context from AI */
  context?: TaskContext
}

export interface TaskContext {
  suggestedPriority?: TaskPriority
  relatedTopics?: string[]
  estimatedDuration?: number
}

export interface Sprint {
  id: string
  name: string
  taskIds: string[]
  startedAt: number
  endedAt?: number
  targetDuration: number
  isActive: boolean
}

export interface TaskStats {
  totalTasks: number
  completedTasks: number
  completedToday: number
  completionRate: number
  averageCompletionTime?: number
}

// ============================================================================
// SETTINGS TYPES
// ============================================================================

export interface PulseSettings {
  /** Claude API key */
  apiKey: string
  /** Selected AI model */
  model: string
  /** System prompt for AI */
  systemPrompt: string
  /** Response temperature (0-1) */
  temperature: number
  /** UI accent color */
  accentColor: string
  /** Whether proactive suggestions are enabled */
  proactiveEnabled: boolean
  /** Whether edge activation is enabled */
  edgeActivationEnabled: boolean
  /** Whether to launch at login */
  launchAtLogin: boolean
  /** Whether to show in dock (macOS) */
  showInDock: boolean
  /** Custom keyboard shortcuts */
  keybinds: KeybindSettings
  /** Appearance settings */
  appearance: AppearanceSettings
  /** Behavior settings */
  behavior: BehaviorSettings
}

export interface KeybindSettings {
  toggleWidget: string
  voiceMode: string
  screenshot: string
  quickTask: string
  toggleTaskList: string
  settings: string
  newConversation: string
  commandPalette: string
}

export interface AppearanceSettings {
  /** Theme mode */
  theme: 'dark' | 'light' | 'system'
  /** Accent color */
  accentColor: string
  /** Whether to use reduced motion */
  reducedMotion: boolean
  /** Font size scale */
  fontScale: number
  /** Whether to show keyboard hints */
  showKeyboardHints: boolean
}

export interface BehaviorSettings {
  /** Auto-save conversations */
  autoSave: boolean
  /** Send analytics (if enabled) */
  sendAnalytics: boolean
  /** Check for updates automatically */
  autoCheckUpdates: boolean
  /** Notification preferences */
  notifications: NotificationSettings
}

export interface NotificationSettings {
  enabled: boolean
  sound: boolean
  showPreviews: boolean
}

// ============================================================================
// WINDOW TYPES
// ============================================================================

export interface WindowPosition {
  x: number
  y: number
}

export interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export type WidgetMode = 'expanded' | 'compact'

export type DynamicIslandState = 'hidden' | 'pill' | 'expanded'

export interface DynamicIslandContext {
  screenshot?: string
  mode?: 'suggestion' | 'task-capture' | 'streaming'
  content?: string
}

// ============================================================================
// API TYPES
// ============================================================================

export interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  model?: string
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
  screenshot?: string
}

export interface ChatResponse {
  id: string
  content: string
  model: string
  usage: TokenUsage
  stopReason: 'end_turn' | 'max_tokens' | 'stop_sequence'
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface StreamChunk {
  type: 'text' | 'error' | 'done'
  content?: string
  error?: string
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface AppError {
  code: string
  message: string
  severity: ErrorSeverity
  retryable: boolean
  details?: Record<string, unknown>
  timestamp: number
}

export interface APIError extends AppError {
  statusCode?: number
  rateLimitReset?: number
}

// ============================================================================
// UPDATE TYPES
// ============================================================================

export type UpdateStatus =
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'ready'
  | 'error'

export interface UpdateInfo {
  status: UpdateStatus
  version?: string
  releaseNotes?: string
  percent?: number
  bytesPerSecond?: number
  transferred?: number
  total?: number
  error?: string
}

// ============================================================================
// IPC TYPES
// ============================================================================

export interface IPCResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface ScreenCaptureResult {
  screenshot: string
  width: number
  height: number
  timestamp: number
}

export interface PermissionStatus {
  screen: 'granted' | 'denied' | 'not-determined'
  microphone: 'granted' | 'denied' | 'not-determined'
}

// ============================================================================
// COMMAND PALETTE TYPES
// ============================================================================

export interface Command {
  id: string
  title: string
  description?: string
  icon?: string
  shortcut?: string
  category?: CommandCategory
  action: () => void | Promise<void>
  keywords?: string[]
  disabled?: boolean
}

export type CommandCategory =
  | 'navigation'
  | 'conversation'
  | 'task'
  | 'settings'
  | 'help'
  | 'debug'

// ============================================================================
// TOAST/NOTIFICATION TYPES
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: ToastAction
}

export interface ToastAction {
  label: string
  onClick: () => void
}

// ============================================================================
// PERSONA TYPES
// ============================================================================

export interface Persona {
  id: string
  name: string
  description: string
  systemPrompt: string
  icon: string
  color: string
  isDefault?: boolean
  isCustom?: boolean
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/** Make all properties optional recursively */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/** Extract the resolved type from a Promise */
export type Awaited<T> = T extends Promise<infer U> ? U : T

/** Make specific keys required */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

/** Ensure at least one property is present */
export type AtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]
