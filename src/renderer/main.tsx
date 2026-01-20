import React from "react"
import ReactDOM from "react-dom/client"
import { WidgetApp } from "./WidgetApp"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { ToastProvider } from "./components/Toast"
import "./styles/global.css"

// Debug: Log when React starts mounting
console.log("[Pulse] React mounting...")

const rootElement = document.getElementById("root")
if (!rootElement) {
  console.error("[Pulse] Root element not found!")
} else {
  console.log("[Pulse] Root element found, creating React root...")

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <ToastProvider>
          <WidgetApp />
        </ToastProvider>
      </ErrorBoundary>
    </React.StrictMode>
  )

  console.log("[Pulse] React render called")
}
