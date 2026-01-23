/**
 * Hooks Index
 *
 * Barrel export for all custom React hooks.
 * Import from this file for cleaner imports.
 *
 * @example
 * import { useReducedMotion, useDebounce, useNetworkStatus } from '../hooks'
 */

// Accessibility Hooks
export {
  useReducedMotion,
  useFocusTrap,
  useAnnounce,
  useKeyboardNavigation,
  useAriaLive,
  useEscapeKey,
  useFocusVisible,
  useId,
  useRovingTabIndex,
  useHotkey,
  useHotkeys,
  useTypeahead,
  useSkipLink
} from './useAccessibility'

// Network Status Hooks
export {
  useNetworkStatus,
  useNetworkSpeed,
  formatOfflineDuration,
  type NetworkStatus,
  type NetworkState
} from './useNetworkStatus'

// Performance Hooks
export {
  useDebounce,
  useDebouncedCallback,
  useThrottle,
  useThrottledCallback,
  useIntersectionObserver,
  useLazyLoad,
  useAnimationFrame,
  useIdle,
  usePrevious,
  useLatest,
  useStableCallback,
  useMemoCompare,
  useUpdateEffect,
  useVirtualList,
  useRenderCount
} from './usePerformance'
