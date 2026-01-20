import { useEffect, useCallback, useRef, useState } from "react"

interface KeyboardNavigationOptions {
  // Element selectors for focusable items
  itemSelector?: string
  // Enable arrow key navigation
  enableArrowKeys?: boolean
  // Enable tab trapping within container
  trapFocus?: boolean
  // Callback when item is selected (Enter key)
  onSelect?: (element: HTMLElement, index: number) => void
  // Callback when escape is pressed
  onEscape?: () => void
  // Enable wrap-around navigation
  wrapAround?: boolean
  // Orientation for arrow key navigation
  orientation?: "vertical" | "horizontal" | "both"
  // Auto-focus first item on mount
  autoFocus?: boolean
}

const DEFAULT_FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  options: KeyboardNavigationOptions = {}
) {
  const {
    itemSelector = DEFAULT_FOCUSABLE_SELECTOR,
    enableArrowKeys = true,
    trapFocus = false,
    onSelect,
    onEscape,
    wrapAround = true,
    orientation = "vertical",
    autoFocus = false
  } = options

  const [focusedIndex, setFocusedIndex] = useState(-1)
  const itemsRef = useRef<HTMLElement[]>([])

  // Get all focusable items in the container
  const getFocusableItems = useCallback(() => {
    if (!containerRef.current) return []
    const items = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(itemSelector)
    )
    itemsRef.current = items
    return items
  }, [containerRef, itemSelector])

  // Focus an item by index
  const focusItem = useCallback((index: number) => {
    const items = getFocusableItems()
    if (items.length === 0) return

    let newIndex = index
    if (wrapAround) {
      if (index < 0) newIndex = items.length - 1
      if (index >= items.length) newIndex = 0
    } else {
      newIndex = Math.max(0, Math.min(index, items.length - 1))
    }

    items[newIndex]?.focus()
    setFocusedIndex(newIndex)
  }, [getFocusableItems, wrapAround])

  // Focus first item
  const focusFirst = useCallback(() => focusItem(0), [focusItem])

  // Focus last item
  const focusLast = useCallback(() => {
    const items = getFocusableItems()
    focusItem(items.length - 1)
  }, [focusItem, getFocusableItems])

  // Focus next item
  const focusNext = useCallback(() => {
    focusItem(focusedIndex + 1)
  }, [focusItem, focusedIndex])

  // Focus previous item
  const focusPrevious = useCallback(() => {
    focusItem(focusedIndex - 1)
  }, [focusItem, focusedIndex])

  // Handle keyboard events
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const items = getFocusableItems()
      if (items.length === 0) return

      // Find current focused element index
      const currentIndex = items.findIndex(
        item => item === document.activeElement
      )

      switch (e.key) {
        case "ArrowDown":
          if (enableArrowKeys && (orientation === "vertical" || orientation === "both")) {
            e.preventDefault()
            focusItem(currentIndex + 1)
          }
          break

        case "ArrowUp":
          if (enableArrowKeys && (orientation === "vertical" || orientation === "both")) {
            e.preventDefault()
            focusItem(currentIndex - 1)
          }
          break

        case "ArrowRight":
          if (enableArrowKeys && (orientation === "horizontal" || orientation === "both")) {
            e.preventDefault()
            focusItem(currentIndex + 1)
          }
          break

        case "ArrowLeft":
          if (enableArrowKeys && (orientation === "horizontal" || orientation === "both")) {
            e.preventDefault()
            focusItem(currentIndex - 1)
          }
          break

        case "Home":
          e.preventDefault()
          focusFirst()
          break

        case "End":
          e.preventDefault()
          focusLast()
          break

        case "Enter":
        case " ":
          if (document.activeElement && items.includes(document.activeElement as HTMLElement)) {
            const element = document.activeElement as HTMLElement
            const index = items.indexOf(element)
            onSelect?.(element, index)
          }
          break

        case "Escape":
          onEscape?.()
          break

        case "Tab":
          if (trapFocus) {
            const firstItem = items[0]
            const lastItem = items[items.length - 1]

            if (e.shiftKey && document.activeElement === firstItem) {
              e.preventDefault()
              lastItem?.focus()
            } else if (!e.shiftKey && document.activeElement === lastItem) {
              e.preventDefault()
              firstItem?.focus()
            }
          }
          break
      }
    }

    // Track focus changes
    const handleFocusIn = () => {
      const items = getFocusableItems()
      const index = items.findIndex(item => item === document.activeElement)
      if (index !== -1) {
        setFocusedIndex(index)
      }
    }

    container.addEventListener("keydown", handleKeyDown)
    container.addEventListener("focusin", handleFocusIn)

    // Auto-focus first item
    if (autoFocus) {
      requestAnimationFrame(() => {
        focusFirst()
      })
    }

    return () => {
      container.removeEventListener("keydown", handleKeyDown)
      container.removeEventListener("focusin", handleFocusIn)
    }
  }, [
    containerRef,
    getFocusableItems,
    focusItem,
    focusFirst,
    focusLast,
    enableArrowKeys,
    trapFocus,
    onSelect,
    onEscape,
    orientation,
    autoFocus
  ])

  return {
    focusedIndex,
    focusItem,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    getFocusableItems
  }
}

// Hook for global keyboard shortcuts
export function useGlobalShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Build shortcut key string
      const parts: string[] = []
      if (e.metaKey || e.ctrlKey) parts.push("cmd")
      if (e.shiftKey) parts.push("shift")
      if (e.altKey) parts.push("alt")
      parts.push(e.key.toLowerCase())

      const shortcutKey = parts.join("+")

      if (shortcuts[shortcutKey]) {
        e.preventDefault()
        shortcuts[shortcutKey]()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [shortcuts])
}

// Hook for managing focus trap in modals
export function useFocusTrap(
  isOpen: boolean,
  containerRef: React.RefObject<HTMLElement>
) {
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Save the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement

      // Focus the first focusable element in the container
      const container = containerRef.current
      if (container) {
        const focusable = container.querySelector<HTMLElement>(
          DEFAULT_FOCUSABLE_SELECTOR
        )
        focusable?.focus()
      }
    } else {
      // Restore focus when closing
      previousActiveElement.current?.focus()
    }
  }, [isOpen, containerRef])

  // Handle tab key to trap focus
  useEffect(() => {
    if (!isOpen) return

    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      const focusableElements = container.querySelectorAll<HTMLElement>(
        DEFAULT_FOCUSABLE_SELECTOR
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }

    container.addEventListener("keydown", handleKeyDown)
    return () => container.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, containerRef])
}

// Utility to create accessible keyboard handlers
export function createKeyboardHandler(handlers: {
  onEnter?: () => void
  onSpace?: () => void
  onEscape?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
}) {
  return (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
        handlers.onEnter?.()
        break
      case " ":
        e.preventDefault()
        handlers.onSpace?.()
        break
      case "Escape":
        handlers.onEscape?.()
        break
      case "ArrowUp":
        e.preventDefault()
        handlers.onArrowUp?.()
        break
      case "ArrowDown":
        e.preventDefault()
        handlers.onArrowDown?.()
        break
      case "ArrowLeft":
        handlers.onArrowLeft?.()
        break
      case "ArrowRight":
        handlers.onArrowRight?.()
        break
    }
  }
}
