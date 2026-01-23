/**
 * Accessibility Utilities
 *
 * Helper functions and constants for implementing
 * WCAG 2.1 AA compliant accessibility features.
 */

// ============================================================================
// ARIA LABELS
// ============================================================================

export const ARIA_LABELS = {
  // Navigation
  MAIN_NAVIGATION: 'Main navigation',
  CONVERSATION_LIST: 'Conversation history',
  TASK_LIST: 'Task list',
  SETTINGS_PANEL: 'Settings',

  // Buttons
  SEND_MESSAGE: 'Send message',
  CAPTURE_SCREENSHOT: 'Capture screenshot',
  TOGGLE_VOICE: 'Toggle voice input',
  CLOSE_WINDOW: 'Close window',
  MINIMIZE_WINDOW: 'Minimize window',
  SETTINGS: 'Open settings',
  NEW_CONVERSATION: 'Start new conversation',
  CLEAR_CHAT: 'Clear conversation',
  COPY_MESSAGE: 'Copy message to clipboard',
  DELETE_MESSAGE: 'Delete message',
  PIN_CONVERSATION: 'Pin conversation',
  ARCHIVE_CONVERSATION: 'Archive conversation',

  // Task actions
  ADD_TASK: 'Add new task',
  COMPLETE_TASK: 'Mark task as complete',
  DELETE_TASK: 'Delete task',
  REORDER_TASK: 'Drag to reorder task',

  // Form inputs
  MESSAGE_INPUT: 'Type your message',
  SEARCH_INPUT: 'Search conversations',
  TASK_INPUT: 'Enter task description',
  API_KEY_INPUT: 'Enter API key',

  // Status indicators
  LOADING: 'Loading',
  STREAMING_RESPONSE: 'AI is responding',
  VOICE_RECORDING: 'Recording voice input',
  NETWORK_STATUS: 'Network status',

  // Sections
  CHAT_MESSAGES: 'Chat messages',
  AI_RESPONSE: 'AI response',
  USER_MESSAGE: 'Your message',
} as const

// ============================================================================
// LIVE REGION ANNOUNCEMENTS
// ============================================================================

/**
 * Announce a message to screen readers using a live region
 */
export function announce(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  // Find or create the live region
  let liveRegion = document.getElementById('pulse-live-region')

  if (!liveRegion) {
    liveRegion = document.createElement('div')
    liveRegion.id = 'pulse-live-region'
    liveRegion.setAttribute('aria-live', priority)
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.className = 'sr-only'
    liveRegion.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `
    document.body.appendChild(liveRegion)
  }

  // Update the priority if needed
  liveRegion.setAttribute('aria-live', priority)

  // Clear and set the message (this triggers the announcement)
  liveRegion.textContent = ''
  // Small delay to ensure the clear is processed
  requestAnimationFrame(() => {
    if (liveRegion) {
      liveRegion.textContent = message
    }
  })
}

/**
 * Announce an error to screen readers
 */
export function announceError(message: string): void {
  announce(message, 'assertive')
}

/**
 * Announce a success message to screen readers
 */
export function announceSuccess(message: string): void {
  announce(message, 'polite')
}

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================

/**
 * Trap focus within a container element (for modals)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelectors)
  const firstFocusable = focusableElements[0]
  const lastFocusable = focusableElements[focusableElements.length - 1]

  // Store the previously focused element to restore later
  const previouslyFocused = document.activeElement as HTMLElement

  // Focus the first element
  firstFocusable?.focus()

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault()
        lastFocusable?.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault()
        firstFocusable?.focus()
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown)

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown)
    previouslyFocused?.focus()
  }
}

/**
 * Move focus to an element, with optional scroll into view
 */
export function focusElement(
  element: HTMLElement | null,
  options: { preventScroll?: boolean } = {}
): void {
  if (!element) return

  element.focus({ preventScroll: options.preventScroll })

  if (!options.preventScroll) {
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

// ============================================================================
// KEYBOARD NAVIGATION
// ============================================================================

export type KeyboardNavigationDirection = 'up' | 'down' | 'left' | 'right'

/**
 * Handle arrow key navigation within a list of items
 */
export function handleArrowKeyNavigation(
  e: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  options: {
    wrap?: boolean
    horizontal?: boolean
    onSelect?: (index: number) => void
  } = {}
): number {
  const { wrap = true, horizontal = false, onSelect } = options

  let newIndex = currentIndex

  const upKey = horizontal ? 'ArrowLeft' : 'ArrowUp'
  const downKey = horizontal ? 'ArrowRight' : 'ArrowDown'

  if (e.key === upKey) {
    e.preventDefault()
    if (currentIndex > 0) {
      newIndex = currentIndex - 1
    } else if (wrap) {
      newIndex = items.length - 1
    }
  } else if (e.key === downKey) {
    e.preventDefault()
    if (currentIndex < items.length - 1) {
      newIndex = currentIndex + 1
    } else if (wrap) {
      newIndex = 0
    }
  } else if (e.key === 'Home') {
    e.preventDefault()
    newIndex = 0
  } else if (e.key === 'End') {
    e.preventDefault()
    newIndex = items.length - 1
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    onSelect?.(currentIndex)
    return currentIndex
  }

  if (newIndex !== currentIndex && items[newIndex]) {
    items[newIndex].focus()
    onSelect?.(newIndex)
  }

  return newIndex
}

// ============================================================================
// REDUCED MOTION
// ============================================================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Subscribe to reduced motion preference changes
 */
export function onReducedMotionChange(callback: (prefersReduced: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches)
  }

  mediaQuery.addEventListener('change', handler)

  // Call immediately with current value
  callback(mediaQuery.matches)

  return () => {
    mediaQuery.removeEventListener('change', handler)
  }
}

// ============================================================================
// SCREEN READER UTILITIES
// ============================================================================

/**
 * Generate a unique ID for ARIA relationships
 */
let idCounter = 0
export function generateAriaId(prefix: string = 'pulse'): string {
  return `${prefix}-${++idCounter}`
}

/**
 * Create visually hidden text for screen readers
 */
export function srOnly(text: string): string {
  return text // The actual hiding is done via CSS class
}

// ============================================================================
// COLOR CONTRAST
// ============================================================================

/**
 * Check if two colors have sufficient contrast ratio (WCAG AA = 4.5:1)
 */
export function hasAdequateContrast(
  foreground: string,
  background: string,
  threshold: number = 4.5
): boolean {
  const getLuminance = (hex: string): number => {
    const rgb = hex.replace('#', '')
    const r = parseInt(rgb.substr(0, 2), 16) / 255
    const g = parseInt(rgb.substr(2, 2), 16) / 255
    const b = parseInt(rgb.substr(4, 2), 16) / 255

    const toLinear = (c: number) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  }

  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  const ratio = (lighter + 0.05) / (darker + 0.05)
  return ratio >= threshold
}
