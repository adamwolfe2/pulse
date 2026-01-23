/**
 * Accessibility Hooks
 *
 * React hooks for implementing accessibility features.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  prefersReducedMotion,
  onReducedMotionChange,
  trapFocus,
  announce,
  announceError,
  announceSuccess,
} from '../lib/accessibility'

// ============================================================================
// useReducedMotion
// ============================================================================

/**
 * Hook to detect and respond to reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(() => prefersReducedMotion())

  useEffect(() => {
    return onReducedMotionChange(setReducedMotion)
  }, [])

  return reducedMotion
}

// ============================================================================
// useFocusTrap
// ============================================================================

/**
 * Hook to trap focus within a container (for modals/dialogs)
 */
export function useFocusTrap(isActive: boolean = true): React.RefObject<HTMLDivElement> {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const cleanup = trapFocus(containerRef.current)
    return cleanup
  }, [isActive])

  return containerRef
}

// ============================================================================
// useAnnounce
// ============================================================================

/**
 * Hook for screen reader announcements
 */
export function useAnnounce() {
  return {
    announce,
    announceError,
    announceSuccess,
  }
}

// ============================================================================
// useKeyboardNavigation
// ============================================================================

interface UseKeyboardNavigationOptions {
  items: HTMLElement[] | NodeListOf<HTMLElement>
  wrap?: boolean
  horizontal?: boolean
  onSelect?: (index: number) => void
  enabled?: boolean
}

/**
 * Hook for keyboard navigation within a list
 */
export function useKeyboardNavigation({
  items,
  wrap = true,
  horizontal = false,
  onSelect,
  enabled = true,
}: UseKeyboardNavigationOptions) {
  const [activeIndex, setActiveIndex] = useState(0)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return

      const itemArray = Array.from(items)
      if (itemArray.length === 0) return

      const upKey = horizontal ? 'ArrowLeft' : 'ArrowUp'
      const downKey = horizontal ? 'ArrowRight' : 'ArrowDown'

      let newIndex = activeIndex

      if (e.key === upKey) {
        e.preventDefault()
        if (activeIndex > 0) {
          newIndex = activeIndex - 1
        } else if (wrap) {
          newIndex = itemArray.length - 1
        }
      } else if (e.key === downKey) {
        e.preventDefault()
        if (activeIndex < itemArray.length - 1) {
          newIndex = activeIndex + 1
        } else if (wrap) {
          newIndex = 0
        }
      } else if (e.key === 'Home') {
        e.preventDefault()
        newIndex = 0
      } else if (e.key === 'End') {
        e.preventDefault()
        newIndex = itemArray.length - 1
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onSelect?.(activeIndex)
        return
      }

      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex)
        itemArray[newIndex]?.focus()
      }
    },
    [activeIndex, items, wrap, horizontal, onSelect, enabled]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    activeIndex,
    setActiveIndex,
  }
}

// ============================================================================
// useAriaLive
// ============================================================================

/**
 * Hook for managing ARIA live regions
 */
export function useAriaLive() {
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite')

  const announceMessage = useCallback((msg: string, p: 'polite' | 'assertive' = 'polite') => {
    setPriority(p)
    setMessage('')
    // Small delay to ensure the clear is registered
    setTimeout(() => setMessage(msg), 50)
  }, [])

  return {
    message,
    priority,
    announce: announceMessage,
    LiveRegion: () => (
      <div
        role="status"
        aria-live={priority}
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {message}
      </div>
    ),
  }
}

// ============================================================================
// useEscapeKey
// ============================================================================

/**
 * Hook to handle Escape key press
 */
export function useEscapeKey(callback: () => void, enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [callback, enabled])
}

// ============================================================================
// useFocusVisible
// ============================================================================

/**
 * Hook to detect if focus should be visible (keyboard navigation)
 */
export function useFocusVisible(): boolean {
  const [focusVisible, setFocusVisible] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setFocusVisible(true)
      }
    }

    const handleMouseDown = () => {
      setFocusVisible(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return focusVisible
}

// ============================================================================
// useId (for ARIA relationships)
// ============================================================================

let idCounter = 0

/**
 * Generate a stable unique ID for ARIA relationships
 */
export function useId(prefix: string = 'pulse'): string {
  const [id] = useState(() => `${prefix}-${++idCounter}`)
  return id
}
