/**
 * Error Boundary Component
 *
 * Catches React errors and displays a fallback UI with retry capabilities.
 * Accessibility: Implements ARIA labels for screen reader support.
 */

import React, { Component, ErrorInfo, ReactNode } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Show error details (useful for development) */
  showDetails?: boolean
  /** Component name for logging */
  name?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
}

const MAX_RETRIES = 3

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { name, onError } = this.props

    // Log error for debugging
    console.error(`[ErrorBoundary${name ? `:${name}` : ''}] Caught error:`, error)
    console.error(`[ErrorBoundary${name ? `:${name}` : ''}] Component stack:`, errorInfo.componentStack)

    this.setState({ errorInfo })

    // Notify parent component
    onError?.(error, errorInfo)
  }

  handleRetry = (): void => {
    if (this.state.retryCount < MAX_RETRIES) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }))
    }
  }

  handleReload = (): void => {
    window.location.reload()
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    })
  }

  render(): ReactNode {
    const { hasError, error, retryCount } = this.state
    const { children, fallback, showDetails } = this.props
    const canRetry = retryCount < MAX_RETRIES

    if (hasError) {
      // Custom fallback if provided
      if (fallback) {
        return fallback
      }

      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-xl"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", damping: 25 }}
            className="w-[400px] p-8 rounded-2xl text-center"
            style={{
              background: "rgba(30, 30, 30, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle size={32} className="text-red-400" aria-hidden="true" />
              </div>
            </motion.div>

            <h2 className="text-xl font-semibold text-white mb-2" id="error-title">
              Something went wrong
            </h2>

            <p className="text-white/60 mb-6 text-sm" id="error-description">
              Pulse encountered an unexpected error.
              {canRetry
                ? " You can try again or reload the app."
                : " Please reload the app to continue."}
            </p>

            {(showDetails || process.env.NODE_ENV === 'development') && error && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6 p-3 rounded-lg bg-white/5 text-left"
              >
                <p className="text-xs text-red-400 font-mono break-all">
                  {error.message}
                </p>
              </motion.div>
            )}

            <div className="flex gap-3" role="group" aria-label="Error recovery options">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="flex-1 px-4 py-2.5 rounded-xl text-white/70 hover:text-white
                           bg-white/5 hover:bg-white/10 transition-colors text-sm
                           flex items-center justify-center gap-2"
                  aria-label={`Try again (${MAX_RETRIES - retryCount} retries remaining)`}
                >
                  <RefreshCw size={14} aria-hidden="true" />
                  Try Again
                  {retryCount > 0 && (
                    <span className="text-white/40 text-xs">
                      ({MAX_RETRIES - retryCount} left)
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2.5 rounded-xl text-white font-medium
                         flex items-center justify-center gap-2 text-sm"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)"
                }}
                aria-label="Reload the application"
              >
                <Home size={14} aria-hidden="true" />
                Reload App
              </button>
            </div>
          </motion.div>
        </motion.div>
      )
    }

    return children
  }
}

/**
 * Wrapper component for catching errors in specific parts of the UI
 */
export function ErrorBoundaryWrapper({
  children,
  name,
  showDetails = false,
  fallback
}: {
  children: ReactNode
  name?: string
  showDetails?: boolean
  fallback?: ReactNode
}) {
  return (
    <ErrorBoundary
      name={name}
      showDetails={showDetails}
      fallback={fallback}
      onError={(error, errorInfo) => {
        // Could integrate with error reporting service here
        console.error(`[${name || 'Component'}] Uncaught error:`, error.message)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Higher-order component for adding error boundary to any component
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<Props, 'children'> = {}
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component'

  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...options} name={options.name || displayName}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  )

  WithErrorBoundary.displayName = `WithErrorBoundary(${displayName})`

  return WithErrorBoundary
}
