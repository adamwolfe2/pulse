import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Logo } from "./Logo"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-xl">
          <div
            className="w-[400px] p-8 rounded-2xl text-center"
            style={{
              background: "rgba(30, 30, 30, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}
          >
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle size={32} className="text-red-400" />
              </div>
            </div>

            <h2 className="text-xl font-semibold text-white mb-2">
              Something went wrong
            </h2>

            <p className="text-white/60 mb-6 text-sm">
              Pulse encountered an unexpected error. This has been logged and we'll work on fixing it.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 rounded-lg bg-white/5 text-left">
                <p className="text-xs text-red-400 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2.5 rounded-xl text-white/70 hover:text-white
                         bg-white/5 hover:bg-white/10 transition-colors text-sm"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2.5 rounded-xl text-white font-medium
                         flex items-center justify-center gap-2 text-sm"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)"
                }}
              >
                <RefreshCw size={14} />
                Reload App
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
