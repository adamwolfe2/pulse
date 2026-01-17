import { useState, useEffect, useCallback } from "react"

interface ClipboardContent {
  text: string
  isCode: boolean
  timestamp: number
}

export function useClipboard() {
  const [clipboardContent, setClipboardContent] = useState<ClipboardContent | null>(null)
  const [hasPermission, setHasPermission] = useState(false)

  const checkPermission = useCallback(async () => {
    try {
      const permission = await navigator.permissions.query({
        name: "clipboard-read" as PermissionName
      })
      setHasPermission(permission.state === "granted")
      return permission.state === "granted"
    } catch {
      return false
    }
  }, [])

  const readClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (!text) return null

      // Detect if content is code
      const isCode = detectCode(text)

      const content: ClipboardContent = {
        text,
        isCode,
        timestamp: Date.now()
      }

      setClipboardContent(content)
      return content
    } catch (error) {
      console.error("Failed to read clipboard:", error)
      return null
    }
  }, [])

  const requestPermission = useCallback(async () => {
    try {
      // Trigger permission prompt by attempting to read
      await navigator.clipboard.readText()
      setHasPermission(true)
      return true
    } catch {
      setHasPermission(false)
      return false
    }
  }, [])

  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  return {
    clipboardContent,
    hasPermission,
    readClipboard,
    requestPermission,
    checkPermission
  }
}

function detectCode(text: string): boolean {
  const codeIndicators = [
    /^(import|export|const|let|var|function|class|interface|type)\s/m,
    /[{}\[\]();]/,
    /=>/,
    /^\s*(if|for|while|switch|try|catch)\s*\(/m,
    /^\s*<[a-zA-Z][^>]*>/m, // JSX/HTML
    /^\s*#(include|define|ifdef)/m, // C/C++
    /^\s*(def|class|import|from)\s/m, // Python
    /^\s*(fn|let|mut|impl|struct|enum)\s/m // Rust
  ]

  return codeIndicators.some((pattern) => pattern.test(text))
}
