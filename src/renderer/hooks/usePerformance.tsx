/**
 * Performance Optimization Hooks
 *
 * Collection of hooks for optimizing React component performance.
 * Includes debouncing, throttling, intersection observer, and more.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

// ============================================================================
// useDebounce
// ============================================================================

/**
 * Debounce a value - delays updating until after wait milliseconds
 * of no changes.
 *
 * @example
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebounce(search, 300)
 *
 * useEffect(() => {
 *   // API call with debouncedSearch
 * }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

// ============================================================================
// useDebouncedCallback
// ============================================================================

/**
 * Returns a debounced version of a callback function.
 *
 * @example
 * const handleSearch = useDebouncedCallback((query: string) => {
 *   // API call
 * }, 300)
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  )
}

// ============================================================================
// useThrottle
// ============================================================================

/**
 * Throttle a value - ensures updates happen at most once per interval.
 *
 * @example
 * const [scrollPos, setScrollPos] = useState(0)
 * const throttledScrollPos = useThrottle(scrollPos, 100)
 */
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastExecuted = useRef<number>(Date.now())

  useEffect(() => {
    const now = Date.now()

    if (now >= lastExecuted.current + interval) {
      lastExecuted.current = now
      setThrottledValue(value)
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now()
        setThrottledValue(value)
      }, interval - (now - lastExecuted.current))

      return () => clearTimeout(timer)
    }
  }, [value, interval])

  return throttledValue
}

// ============================================================================
// useThrottledCallback
// ============================================================================

/**
 * Returns a throttled version of a callback function.
 *
 * @example
 * const handleScroll = useThrottledCallback(() => {
 *   // Update position
 * }, 100)
 */
export function useThrottledCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  interval: number
): (...args: Parameters<T>) => void {
  const lastExecuted = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()

      if (now >= lastExecuted.current + interval) {
        lastExecuted.current = now
        callbackRef.current(...args)
      } else if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          lastExecuted.current = Date.now()
          callbackRef.current(...args)
          timeoutRef.current = null
        }, interval - (now - lastExecuted.current))
      }
    },
    [interval]
  )
}

// ============================================================================
// useIntersectionObserver
// ============================================================================

interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
  freezeOnceVisible?: boolean
}

/**
 * Hook for detecting when an element enters the viewport.
 * Useful for lazy loading, infinite scroll, and animations.
 *
 * @example
 * const { ref, isIntersecting } = useIntersectionObserver({
 *   threshold: 0.5,
 *   freezeOnceVisible: true
 * })
 *
 * return <div ref={ref}>{isIntersecting && <Content />}</div>
 */
export function useIntersectionObserver<T extends Element>({
  threshold = 0,
  root = null,
  rootMargin = '0px',
  freezeOnceVisible = false
}: UseIntersectionObserverOptions = {}) {
  const [ref, setRef] = useState<T | null>(null)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)

  const frozen = entry?.isIntersecting && freezeOnceVisible

  useEffect(() => {
    if (!ref || frozen) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry)
      },
      { threshold, root, rootMargin }
    )

    observer.observe(ref)

    return () => {
      observer.disconnect()
    }
  }, [ref, threshold, root, rootMargin, frozen])

  return {
    ref: setRef,
    entry,
    isIntersecting: entry?.isIntersecting ?? false
  }
}

// ============================================================================
// useLazyLoad
// ============================================================================

/**
 * Hook for lazy loading components when they enter viewport.
 *
 * @example
 * const { ref, shouldLoad } = useLazyLoad()
 *
 * return (
 *   <div ref={ref}>
 *     {shouldLoad ? <HeavyComponent /> : <Skeleton />}
 *   </div>
 * )
 */
export function useLazyLoad<T extends Element>(rootMargin: string = '200px') {
  const { ref, isIntersecting } = useIntersectionObserver<T>({
    rootMargin,
    freezeOnceVisible: true
  })

  return {
    ref,
    shouldLoad: isIntersecting
  }
}

// ============================================================================
// useAnimationFrame
// ============================================================================

/**
 * Hook for running animations with requestAnimationFrame.
 *
 * @example
 * const progress = useAnimationFrame((time) => {
 *   return Math.sin(time / 1000) * 50 + 50
 * })
 */
export function useAnimationFrame(callback: (time: number) => number): number {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number>()
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const animate = (time: number) => {
      setValue(callbackRef.current(time))
      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  return value
}

// ============================================================================
// useIdle
// ============================================================================

/**
 * Hook to detect when user is idle (no mouse/keyboard activity).
 *
 * @example
 * const isIdle = useIdle(30000) // 30 seconds
 *
 * if (isIdle) {
 *   // Reduce polling, hide UI, etc.
 * }
 */
export function useIdle(timeout: number = 60000): boolean {
  const [isIdle, setIsIdle] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const resetTimer = () => {
      setIsIdle(false)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        setIsIdle(true)
      }, timeout)
    }

    // Events to track
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']

    // Add listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true)
    })

    // Start timer
    resetTimer()

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true)
      })

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [timeout])

  return isIdle
}

// ============================================================================
// usePrevious
// ============================================================================

/**
 * Hook to get the previous value of a variable.
 *
 * @example
 * const count = useState(0)
 * const prevCount = usePrevious(count)
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

// ============================================================================
// useLatest
// ============================================================================

/**
 * Hook to always get the latest value without causing re-renders.
 * Useful for callbacks that need access to current state.
 *
 * @example
 * const latestCount = useLatest(count)
 *
 * const handleClick = useCallback(() => {
 *   console.log(latestCount.current)
 * }, []) // No dependency needed
 */
export function useLatest<T>(value: T): React.MutableRefObject<T> {
  const ref = useRef(value)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref
}

// ============================================================================
// useStableCallback
// ============================================================================

/**
 * Returns a stable callback that always calls the latest version
 * of the provided function.
 *
 * @example
 * const stableOnChange = useStableCallback((value) => {
 *   console.log(value, someState) // Always has latest someState
 * })
 *
 * // Pass to memoized components without causing re-renders
 * <MemoizedInput onChange={stableOnChange} />
 */
export function useStableCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T
): T {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  )
}

// ============================================================================
// useMemoCompare
// ============================================================================

/**
 * Like useMemo, but with a custom comparison function.
 *
 * @example
 * const data = useMemoCompare(
 *   fetchedData,
 *   (prev, next) => prev?.id === next?.id
 * )
 */
export function useMemoCompare<T>(
  value: T,
  compare: (prev: T | undefined, next: T) => boolean
): T {
  const previousRef = useRef<T>()

  const isEqual = previousRef.current !== undefined && compare(previousRef.current, value)

  useEffect(() => {
    if (!isEqual) {
      previousRef.current = value
    }
  })

  return isEqual ? previousRef.current as T : value
}

// ============================================================================
// useUpdateEffect
// ============================================================================

/**
 * Like useEffect, but skips the first render.
 *
 * @example
 * useUpdateEffect(() => {
 *   // Only runs on updates, not initial mount
 * }, [dependency])
 */
export function useUpdateEffect(effect: React.EffectCallback, deps?: React.DependencyList): void {
  const isFirstMount = useRef(true)

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    return effect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// ============================================================================
// useVirtualList
// ============================================================================

interface UseVirtualListOptions {
  itemHeight: number
  overscan?: number
}

/**
 * Hook for rendering virtualized lists efficiently.
 *
 * @example
 * const { visibleItems, containerProps, wrapperProps } = useVirtualList({
 *   items,
 *   itemHeight: 50,
 *   containerHeight: 400
 * })
 */
export function useVirtualList<T>(
  items: T[],
  containerHeight: number,
  options: UseVirtualListOptions
) {
  const { itemHeight, overscan = 5 } = options
  const [scrollTop, setScrollTop] = useState(0)

  const totalHeight = items.length * itemHeight

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = useMemo(
    () =>
      items.slice(startIndex, endIndex + 1).map((item, index) => ({
        item,
        index: startIndex + index,
        style: {
          position: 'absolute' as const,
          top: (startIndex + index) * itemHeight,
          height: itemHeight,
          width: '100%'
        }
      })),
    [items, startIndex, endIndex, itemHeight]
  )

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    containerProps: {
      onScroll: handleScroll,
      style: {
        height: containerHeight,
        overflow: 'auto' as const
      }
    },
    wrapperProps: {
      style: {
        height: totalHeight,
        position: 'relative' as const
      }
    }
  }
}

// ============================================================================
// useRenderCount (development only)
// ============================================================================

/**
 * Debug hook to count component renders.
 * Only active in development mode.
 *
 * @example
 * const renderCount = useRenderCount('MyComponent')
 * // Logs: "MyComponent rendered 5 times"
 */
export function useRenderCount(componentName: string): number {
  const count = useRef(0)
  count.current++

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${count.current} times`)
    }
  })

  return count.current
}
