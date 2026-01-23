/**
 * Toast Notification System
 *
 * Provides toast notifications with accessibility support.
 * ARIA live regions for screen reader announcements.
 */

import React, { useEffect, useState, createContext, useContext, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react"
import { useReducedMotion } from "../hooks/useAccessibility"
import { TIMING } from "../../shared/constants"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: "success", title, message, duration: 3000 })
  }, [addToast])

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: "error", title, message, duration: 5000 })
  }, [addToast])

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: "warning", title, message, duration: 4000 })
  }, [addToast])

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: "info", title, message, duration: 3000 })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-relevant="additions removals"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const prefersReducedMotion = useReducedMotion()
  const toastRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(onRemove, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.duration, onRemove])

  const icons = {
    success: <CheckCircle size={18} className="text-green-400" aria-hidden="true" />,
    error: <XCircle size={18} className="text-red-400" aria-hidden="true" />,
    warning: <AlertCircle size={18} className="text-amber-400" aria-hidden="true" />,
    info: <Info size={18} className="text-blue-400" aria-hidden="true" />
  }

  const colors = {
    success: "border-green-500/20 bg-green-500/10",
    error: "border-red-500/20 bg-red-500/10",
    warning: "border-amber-500/20 bg-amber-500/10",
    info: "border-blue-500/20 bg-blue-500/10"
  }

  // Map toast type to ARIA role
  const ariaRole = toast.type === "error" || toast.type === "warning" ? "alert" : "status"

  return (
    <motion.div
      ref={toastRef}
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? {} : { opacity: 0, y: -20, scale: 0.95 }}
      transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", damping: 25, stiffness: 300 }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl
                  min-w-[280px] max-w-[360px] ${colors[toast.type]}`}
      style={{
        background: "rgba(20, 20, 25, 0.95)",
        boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.5)"
      }}
      role={ariaRole}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-white/60 mt-1">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1 rounded text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </motion.div>
  )
}

// Standalone toast function for use outside React components
let globalAddToast: ((toast: Omit<Toast, "id">) => void) | null = null

export function setGlobalToastHandler(handler: (toast: Omit<Toast, "id">) => void) {
  globalAddToast = handler
}

export const toast = {
  success: (title: string, message?: string) => {
    globalAddToast?.({ type: "success", title, message, duration: 3000 })
  },
  error: (title: string, message?: string) => {
    globalAddToast?.({ type: "error", title, message, duration: 5000 })
  },
  warning: (title: string, message?: string) => {
    globalAddToast?.({ type: "warning", title, message, duration: 4000 })
  },
  info: (title: string, message?: string) => {
    globalAddToast?.({ type: "info", title, message, duration: 3000 })
  }
}
