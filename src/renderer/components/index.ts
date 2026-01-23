/**
 * Components Index
 *
 * Barrel export for all React components.
 * Import from this file for cleaner imports.
 *
 * @example
 * import { Toast, Skeleton, ErrorBoundary } from '../components'
 */

// UI Components
export { ActionButton } from './ActionButton'
export { AnimatedButton } from './AnimatedButton'
export { AnimatedInput } from './AnimatedInput'
export { GlassPanel, CircleGlassPanel, PhotoCluster } from './GlassPanel'
export { Logo } from './Logo'
export { Tooltip } from './Tooltip'

// Layout Components
export { OverlayContainer } from './OverlayContainer'
export { DropZone } from './DropZone'

// Chat Components
export { MessageList } from './MessageList'
export { MessageActions } from './MessageActions'
export { TypingIndicator } from './TypingIndicator'
export { MarkdownRenderer } from './MarkdownRenderer'

// Suggestion & Task Components
export { SuggestionCard } from './SuggestionCard'
export { QuickTaskCapture } from './QuickTaskCapture'

// Settings Components
export { ModelSelector } from './ModelSelector'
export { PersonaSelector } from './PersonaSelector'
export { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel'

// Status Components
export { ContextUsageBar } from './ContextUsageBar'
export {
  NetworkStatusIndicator,
  NetworkStatusBadge,
  OfflineOverlay,
  ErrorToast,
  LegacyNetworkStatusIndicator
} from './NetworkStatusIndicator'
export { UpdateNotification } from './UpdateNotification'
export { TrialBanner } from './TrialBanner'

// Utility Components
export { ErrorBoundary } from './ErrorBoundary'
export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  MessageSkeleton,
  CardSkeleton,
  ProgressBar
} from './Skeleton'
export {
  ToastProvider,
  useToast,
  toast,
  setGlobalToastHandler,
  setGlobalRemoveHandler
} from './Toast'
export { CommandPalette, CommandHint } from './CommandPalette'
export { ConversationSidebar } from './ConversationSidebar'
export { LazyComponents } from './LazyComponents'
