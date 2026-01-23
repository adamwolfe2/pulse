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

// ============================================================================
// useRovingTabIndex
// ============================================================================

/**
 * Hook for roving tabindex pattern (single tab stop with arrow key navigation)
 * Useful for toolbars, tab lists, and menu items
 */
export function useRovingTabIndex<T extends HTMLElement>(
  itemCount: number,
  options: {
    initialIndex?: number
    wrap?: boolean
    horizontal?: boolean
    onFocus?: (index: number) => void
    onSelect?: (index: number) => void
  } = {}
) {
  const {
    initialIndex = 0,
    wrap = true,
    horizontal = true,
    onFocus,
    onSelect
  } = options

  const [focusedIndex, setFocusedIndex] = useState(initialIndex)
  const itemRefs = useRef<(T | null)[]>([])

  const setItemRef = useCallback((index: number) => (el: T | null) => {
    itemRefs.current[index] = el
  }, [])

  const focusItem = useCallback((index: number) => {
    if (index >= 0 && index < itemCount) {
      setFocusedIndex(index)
      itemRefs.current[index]?.focus()
      onFocus?.(index)
    }
  }, [itemCount, onFocus])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const prevKey = horizontal ? 'ArrowLeft' : 'ArrowUp'
    const nextKey = horizontal ? 'ArrowRight' : 'ArrowDown'

    let newIndex = focusedIndex

    switch (e.key) {
      case prevKey:
        e.preventDefault()
        if (focusedIndex > 0) {
          newIndex = focusedIndex - 1
        } else if (wrap) {
          newIndex = itemCount - 1
        }
        break
      case nextKey:
        e.preventDefault()
        if (focusedIndex < itemCount - 1) {
          newIndex = focusedIndex + 1
        } else if (wrap) {
          newIndex = 0
        }
        break
      case 'Home':
        e.preventDefault()
        newIndex = 0
        break
      case 'End':
        e.preventDefault()
        newIndex = itemCount - 1
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onSelect?.(focusedIndex)
        return
      default:
        return
    }

    if (newIndex !== focusedIndex) {
      focusItem(newIndex)
    }
  }, [focusedIndex, itemCount, wrap, horizontal, onSelect, focusItem])

  const getItemProps = useCallback((index: number) => ({
    ref: setItemRef(index),
    tabIndex: index === focusedIndex ? 0 : -1,
    onKeyDown: handleKeyDown,
    onFocus: () => setFocusedIndex(index),
    role: 'option',
    'aria-selected': index === focusedIndex
  }), [focusedIndex, setItemRef, handleKeyDown])

  return {
    focusedIndex,
    setFocusedIndex,
    focusItem,
    getItemProps,
    handleKeyDown
  }
}

// ============================================================================
// useHotkey
// ============================================================================

type ModifierKey = 'ctrl' | 'shift' | 'alt' | 'meta'

interface HotkeyConfig {
  key: string
  modifiers?: ModifierKey[]
  callback: (e: KeyboardEvent) => void
  enabled?: boolean
  preventDefault?: boolean
}

/**
 * Hook for handling global keyboard shortcuts
 */
export function useHotkey(config: HotkeyConfig): void {
  const { key, modifiers = [], callback, enabled = true, preventDefault = true } = config

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMatches = e.key.toLowerCase() === key.toLowerCase()
      const ctrlMatches = modifiers.includes('ctrl') === (e.ctrlKey || e.metaKey)
      const shiftMatches = modifiers.includes('shift') === e.shiftKey
      const altMatches = modifiers.includes('alt') === e.altKey
      const metaMatches = modifiers.includes('meta') === e.metaKey

      if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
        if (preventDefault) {
          e.preventDefault()
        }
        callback(e)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [key, modifiers, callback, enabled, preventDefault])
}

/**
 * Hook for handling multiple global keyboard shortcuts
 */
export function useHotkeys(configs: HotkeyConfig[]): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const config of configs) {
        if (config.enabled === false) continue

        const { key, modifiers = [], callback, preventDefault = true } = config

        const keyMatches = e.key.toLowerCase() === key.toLowerCase()
        const ctrlMatches = modifiers.includes('ctrl') === (e.ctrlKey || e.metaKey)
        const shiftMatches = modifiers.includes('shift') === e.shiftKey
        const altMatches = modifiers.includes('alt') === e.altKey
        const metaMatches = modifiers.includes('meta') === e.metaKey

        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          if (preventDefault) {
            e.preventDefault()
          }
          callback(e)
          return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [configs])
}

// ============================================================================
// useTypeahead
// ============================================================================

/**
 * Hook for typeahead/search-by-typing in lists
 */
export function useTypeahead<T>(
  items: T[],
  options: {
    getLabel: (item: T) => string
    onMatch?: (index: number) => void
    timeout?: number
  }
) {
  const { getLabel, onMatch, timeout = 500 } = options
  const [searchString, setSearchString] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleKeyDown = useCallback((e: React.KeyboardEvent | KeyboardEvent) => {
    // Only handle printable characters
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) {
      return
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const newSearchString = searchString + e.key.toLowerCase()
    setSearchString(newSearchString)

    // Find matching item
    const matchIndex = items.findIndex(item =>
      getLabel(item).toLowerCase().startsWith(newSearchString)
    )

    if (matchIndex !== -1) {
      onMatch?.(matchIndex)
    }

    // Clear search string after timeout
    timeoutRef.current = setTimeout(() => {
      setSearchString('')
    }, timeout)
  }, [searchString, items, getLabel, onMatch, timeout])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    searchString,
    handleKeyDown,
    clearSearch: () => setSearchString('')
  }
}

// ============================================================================
// useSkipLink
// ============================================================================

/**
 * Hook for skip link functionality (skip to main content)
 */
export function useSkipLink(targetId: string = 'main-content') {
  const skipToMain = useCallback(() => {
    const target = document.getElementById(targetId)
    if (target) {
      target.tabIndex = -1
      target.focus()
      // Announce to screen readers
      announce(`Skipped to main content`)
    }
  }, [targetId])

  return {
    skipToMain,
    targetProps: {
      id: targetId,
      tabIndex: -1
    }
  }
}
