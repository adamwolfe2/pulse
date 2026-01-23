/**
 * Toast Notification System
 *
 * Provides toast notifications with accessibility support.
 * Features: ARIA live regions, progress bars, action buttons,
 * hover-to-pause, and configurable positioning.
 *
 * @example
 * // Using the hook
 * const { success, error } = useToast()
 * success('Saved!', 'Your changes have been saved')
 *
 * @example
 * // Using the global toast
 * import { toast } from './Toast'
 * toast.success('Done!')
 */

import React, { useEffect, useState, createContext, useContext, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, AlertCircle, Info, X, Loader2 } from "lucide-react"
import { useReducedMotion } from "../hooks/useAccessibility"
import { TIMING, ANIMATIONS } from "../../shared/constants"

type ToastType = "success" | "error" | "warning" | "info" | "loading"
type ToastPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center"

interface ToastAction {
  label: string
  onClick: () => void
  variant?: "primary" | "secondary"
}

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: ToastAction
  dismissable?: boolean
  progress?: boolean
}

interface ToastOptions {
  message?: string
  duration?: number
  action?: ToastAction
  dismissable?: boolean
  progress?: boolean
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => string
  removeToast: (id: string) => void
  updateToast: (id: string, updates: Partial<Toast>) => void
  success: (title: string, options?: ToastOptions | string) => string
  error: (title: string, options?: ToastOptions | string) => string
  warning: (title: string, options?: ToastOptions | string) => string
  info: (title: string, options?: ToastOptions | string) => string
  loading: (title: string, options?: ToastOptions | string) => string
  dismiss: (id: string) => void
  dismissAll: () => void
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((err: unknown) => string)
    }
  ) => Promise<T>
}

const MAX_TOASTS = 5
const DEFAULT_POSITION: ToastPosition = "bottom-right"

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
  position?: ToastPosition
  maxToasts?: number
}

export function ToastProvider({
  children,
  position = DEFAULT_POSITION,
  maxToasts = MAX_TOASTS
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    setToasts((prev) => {
      const newToasts = [...prev, { ...toast, id, dismissable: toast.dismissable ?? true }]
      // Limit number of toasts
      if (newToasts.length > maxToasts) {
        return newToasts.slice(-maxToasts)
      }
      return newToasts
    })
    return id
  }, [maxToasts])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  const normalizeOptions = (options?: ToastOptions | string): ToastOptions => {
    if (typeof options === "string") {
      return { message: options }
    }
    return options || {}
  }

  const success = useCallback((title: string, options?: ToastOptions | string) => {
    const opts = normalizeOptions(options)
    return addToast({
      type: "success",
      title,
      message: opts.message,
      duration: opts.duration ?? 3000,
      action: opts.action,
      dismissable: opts.dismissable,
      progress: opts.progress
    })
  }, [addToast])

  const error = useCallback((title: string, options?: ToastOptions | string) => {
    const opts = normalizeOptions(options)
    return addToast({
      type: "error",
      title,
      message: opts.message,
      duration: opts.duration ?? 5000,
      action: opts.action,
      dismissable: opts.dismissable,
      progress: opts.progress
    })
  }, [addToast])

  const warning = useCallback((title: string, options?: ToastOptions | string) => {
    const opts = normalizeOptions(options)
    return addToast({
      type: "warning",
      title,
      message: opts.message,
      duration: opts.duration ?? 4000,
      action: opts.action,
      dismissable: opts.dismissable,
      progress: opts.progress
    })
  }, [addToast])

  const info = useCallback((title: string, options?: ToastOptions | string) => {
    const opts = normalizeOptions(options)
    return addToast({
      type: "info",
      title,
      message: opts.message,
      duration: opts.duration ?? 3000,
      action: opts.action,
      dismissable: opts.dismissable,
      progress: opts.progress
    })
  }, [addToast])

  const loading = useCallback((title: string, options?: ToastOptions | string) => {
    const opts = normalizeOptions(options)
    return addToast({
      type: "loading",
      title,
      message: opts.message,
      duration: undefined, // Loading toasts don't auto-dismiss
      action: opts.action,
      dismissable: opts.dismissable ?? false,
      progress: false
    })
  }, [addToast])

  const promiseHandler = useCallback(async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((err: unknown) => string)
    }
  ): Promise<T> => {
    const id = loading(messages.loading)

    try {
      const data = await promise
      const successMessage = typeof messages.success === "function"
        ? messages.success(data)
        : messages.success
      updateToast(id, {
        type: "success",
        title: successMessage,
        duration: 3000,
        dismissable: true
      })
      // Auto-dismiss after success
      setTimeout(() => removeToast(id), 3000)
      return data
    } catch (err) {
      const errorMessage = typeof messages.error === "function"
        ? messages.error(err)
        : messages.error
      updateToast(id, {
        type: "error",
        title: errorMessage,
        duration: 5000,
        dismissable: true
      })
      // Auto-dismiss after error
      setTimeout(() => removeToast(id), 5000)
      throw err
    }
  }, [loading, updateToast, removeToast])

  // Sync global handler
  useEffect(() => {
    setGlobalToastHandler(addToast)
    setGlobalRemoveHandler(removeToast)
    return () => {
      setGlobalToastHandler(null)
      setGlobalRemoveHandler(null)
    }
  }, [addToast, removeToast])

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        updateToast,
        success,
        error,
        warning,
        info,
        loading,
        dismiss: removeToast,
        dismissAll,
        promise: promiseHandler
      }}
    >
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} position={position} />
    </ToastContext.Provider>
  )
}

function ToastContainer({
  toasts,
  removeToast,
  position
}: {
  toasts: Toast[]
  removeToast: (id: string) => void
  position: ToastPosition
}) {
  const positionClasses: Record<ToastPosition, string> = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2"
  }

  const isTop = position.startsWith("top")

  return (
    <div
      className={`fixed z-[100] flex flex-col gap-2 pointer-events-none ${positionClasses[position]}`}
      style={{ flexDirection: isTop ? "column" : "column-reverse" }}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-relevant="additions removals"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} isTop={isTop} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({
  toast,
  onRemove,
  isTop
}: {
  toast: Toast
  onRemove: () => void
  isTop: boolean
}) {
  const prefersReducedMotion = useReducedMotion()
  const toastRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(100)
  const startTimeRef = useRef(Date.now())
  const remainingTimeRef = useRef(toast.duration || 0)

  useEffect(() => {
    if (!toast.duration || toast.type === "loading") return

    let animationFrame: number
    const duration = toast.duration

    const animate = () => {
      if (isPaused) {
        animationFrame = requestAnimationFrame(animate)
        return
      }

      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(0, remainingTimeRef.current - elapsed)
      const newProgress = (remaining / duration) * 100

      setProgress(newProgress)

      if (remaining <= 0) {
        onRemove()
      } else {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [toast.duration, toast.type, isPaused, onRemove])

  // Handle pause/resume
  const handleMouseEnter = () => {
    if (toast.duration && toast.type !== "loading") {
      const elapsed = Date.now() - startTimeRef.current
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed)
      setIsPaused(true)
    }
  }

  const handleMouseLeave = () => {
    if (toast.duration && toast.type !== "loading") {
      startTimeRef.current = Date.now()
      setIsPaused(false)
    }
  }

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={18} className="text-green-400" aria-hidden="true" />,
    error: <XCircle size={18} className="text-red-400" aria-hidden="true" />,
    warning: <AlertCircle size={18} className="text-amber-400" aria-hidden="true" />,
    info: <Info size={18} className="text-blue-400" aria-hidden="true" />,
    loading: <Loader2 size={18} className="text-indigo-400 animate-spin" aria-hidden="true" />
  }

  const colors: Record<ToastType, string> = {
    success: "border-green-500/20",
    error: "border-red-500/20",
    warning: "border-amber-500/20",
    info: "border-blue-500/20",
    loading: "border-indigo-500/20"
  }

  const progressColors: Record<ToastType, string> = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
    loading: "bg-indigo-500"
  }

  // Map toast type to ARIA role
  const ariaRole = toast.type === "error" || toast.type === "warning" ? "alert" : "status"

  const animationY = isTop ? -20 : 20

  return (
    <motion.div
      ref={toastRef}
      initial={prefersReducedMotion ? {} : { opacity: 0, y: animationY, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? {} : { opacity: 0, y: animationY * -1, scale: 0.95 }}
      transition={prefersReducedMotion ? { duration: 0 } : ANIMATIONS.SPRING.SNAPPY}
      className={`pointer-events-auto flex flex-col rounded-xl border backdrop-blur-xl overflow-hidden
                  min-w-[280px] max-w-[360px] ${colors[toast.type]}`}
      style={{
        background: "rgba(20, 20, 25, 0.95)",
        boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.5)"
      }}
      role={ariaRole}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{toast.title}</p>
          {toast.message && (
            <p className="text-xs text-white/60 mt-1">{toast.message}</p>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick()
                onRemove()
              }}
              className={`mt-2 text-xs font-medium px-2 py-1 rounded transition-colors
                ${toast.action.variant === "primary"
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "text-white/70 hover:text-white"
                }`}
            >
              {toast.action.label}
            </button>
          )}
        </div>
        {toast.dismissable !== false && (
          <button
            onClick={onRemove}
            className="flex-shrink-0 p-1 rounded text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors
                     focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Dismiss notification"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {toast.progress !== false && toast.duration && toast.type !== "loading" && (
        <div className="h-1 w-full bg-white/5">
          <motion.div
            className={`h-full ${progressColors[toast.type]}`}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0 }}
          />
        </div>
      )}
    </motion.div>
  )
}

// Global toast handler for use outside React components
let globalAddToast: ((toast: Omit<Toast, "id">) => string) | null = null
let globalRemoveToast: ((id: string) => void) | null = null

export function setGlobalToastHandler(handler: ((toast: Omit<Toast, "id">) => string) | null) {
  globalAddToast = handler
}

export function setGlobalRemoveHandler(handler: ((id: string) => void) | null) {
  globalRemoveToast = handler
}

/**
 * Global toast API for use outside React components
 * Must be used after ToastProvider is mounted
 */
export const toast = {
  success: (title: string, options?: ToastOptions | string): string => {
    const opts = typeof options === "string" ? { message: options } : options || {}
    return globalAddToast?.({
      type: "success",
      title,
      message: opts.message,
      duration: opts.duration ?? 3000,
      action: opts.action,
      dismissable: opts.dismissable,
      progress: opts.progress
    }) || ""
  },
  error: (title: string, options?: ToastOptions | string): string => {
    const opts = typeof options === "string" ? { message: options } : options || {}
    return globalAddToast?.({
      type: "error",
      title,
      message: opts.message,
      duration: opts.duration ?? 5000,
      action: opts.action,
      dismissable: opts.dismissable,
      progress: opts.progress
    }) || ""
  },
  warning: (title: string, options?: ToastOptions | string): string => {
    const opts = typeof options === "string" ? { message: options } : options || {}
    return globalAddToast?.({
      type: "warning",
      title,
      message: opts.message,
      duration: opts.duration ?? 4000,
      action: opts.action,
      dismissable: opts.dismissable,
      progress: opts.progress
    }) || ""
  },
  info: (title: string, options?: ToastOptions | string): string => {
    const opts = typeof options === "string" ? { message: options } : options || {}
    return globalAddToast?.({
      type: "info",
      title,
      message: opts.message,
      duration: opts.duration ?? 3000,
      action: opts.action,
      dismissable: opts.dismissable,
      progress: opts.progress
    }) || ""
  },
  loading: (title: string, options?: ToastOptions | string): string => {
    const opts = typeof options === "string" ? { message: options } : options || {}
    return globalAddToast?.({
      type: "loading",
      title,
      message: opts.message,
      duration: undefined,
      action: opts.action,
      dismissable: opts.dismissable ?? false,
      progress: false
    }) || ""
  },
  dismiss: (id: string): void => {
    globalRemoveToast?.(id)
  },
  custom: (toast: Omit<Toast, "id">): string => {
    return globalAddToast?.(toast) || ""
  }
}
