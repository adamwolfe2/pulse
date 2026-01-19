// Clipboard Integration
// Read and write clipboard content with smart formatting

export interface ClipboardContent {
  text: string | null
  html: string | null
  image: string | null // base64 data URL
  type: "text" | "html" | "image" | "mixed" | "empty"
  timestamp: number
}

// Read clipboard content
export async function readClipboard(): Promise<ClipboardContent> {
  const result: ClipboardContent = {
    text: null,
    html: null,
    image: null,
    type: "empty",
    timestamp: Date.now()
  }

  try {
    // Try to read from clipboard API
    const items = await navigator.clipboard.read()

    for (const item of items) {
      // Check for image
      if (item.types.includes("image/png")) {
        const blob = await item.getType("image/png")
        result.image = await blobToBase64(blob)
        result.type = "image"
      }

      // Check for HTML
      if (item.types.includes("text/html")) {
        const blob = await item.getType("text/html")
        result.html = await blob.text()
        result.type = result.image ? "mixed" : "html"
      }

      // Check for plain text
      if (item.types.includes("text/plain")) {
        const blob = await item.getType("text/plain")
        result.text = await blob.text()
        if (result.type === "empty") {
          result.type = "text"
        }
      }
    }
  } catch (e) {
    // Fall back to simple text read
    try {
      result.text = await navigator.clipboard.readText()
      result.type = result.text ? "text" : "empty"
    } catch {
      // Clipboard access denied
      console.warn("Clipboard access denied")
    }
  }

  return result
}

// Write text to clipboard
export async function writeToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (e) {
    console.error("Failed to write to clipboard:", e)
    return false
  }
}

// Copy code block with formatting
export async function copyCodeBlock(code: string, language?: string): Promise<boolean> {
  try {
    // Write both plain text and HTML
    const html = `<pre><code class="language-${language || "text"}">${escapeHtml(code)}</code></pre>`

    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob([code], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" })
      })
    ])
    return true
  } catch (e) {
    // Fall back to plain text
    return writeToClipboard(code)
  }
}

// Format clipboard content for display
export function formatClipboardForContext(content: ClipboardContent): string {
  if (content.type === "empty") {
    return "[Clipboard is empty]"
  }

  if (content.type === "image") {
    return "[Image in clipboard - attach screenshot to analyze]"
  }

  if (content.text) {
    const text = content.text.trim()
    if (text.length > 500) {
      return `[Clipboard content - ${text.length} characters]\n\n${text.slice(0, 500)}...\n\n[Truncated]`
    }
    return `[Clipboard content]\n\n${text}`
  }

  return "[Unable to read clipboard]"
}

// Detect content type from clipboard text
export function detectContentType(text: string): "code" | "url" | "email" | "text" {
  // Check for URLs
  if (/^https?:\/\/[^\s]+$/i.test(text.trim())) {
    return "url"
  }

  // Check for email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim())) {
    return "email"
  }

  // Check for code patterns
  const codePatterns = [
    /^(function|const|let|var|import|export|class|interface|type)\s/m,
    /^(def|class|import|from|if|for|while)\s/m,
    /[{}\[\]()];$/m,
    /=>|->|\|>/,
    /^\s*(\/\/|#|\/\*|\*)/m
  ]

  if (codePatterns.some(pattern => pattern.test(text))) {
    return "code"
  }

  return "text"
}

// Helper: Convert blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Helper: Escape HTML
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// Clipboard history (in-memory for session)
const clipboardHistory: ClipboardContent[] = []
const MAX_HISTORY = 10

export function addToClipboardHistory(content: ClipboardContent): void {
  if (content.type === "empty") return

  // Remove duplicates
  const filtered = clipboardHistory.filter(c => c.text !== content.text)
  filtered.unshift(content)

  // Keep only recent items
  clipboardHistory.length = 0
  clipboardHistory.push(...filtered.slice(0, MAX_HISTORY))
}

export function getClipboardHistory(): ClipboardContent[] {
  return [...clipboardHistory]
}

export function clearClipboardHistory(): void {
  clipboardHistory.length = 0
}
