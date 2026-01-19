// Conversation Export Utilities
// Export conversations to various formats

import type { Conversation, Message } from "./persistence"

// Export single conversation to Markdown
export function exportToMarkdown(conversation: Conversation): string {
  const lines: string[] = []

  // Header
  lines.push(`# ${conversation.title}`)
  lines.push("")
  lines.push(`**Created:** ${new Date(conversation.createdAt).toLocaleString()}`)
  lines.push(`**Last updated:** ${new Date(conversation.updatedAt).toLocaleString()}`)
  if (conversation.model) {
    lines.push(`**Model:** ${conversation.model}`)
  }
  lines.push("")
  lines.push("---")
  lines.push("")

  // Messages
  for (const message of conversation.messages) {
    const timestamp = message.timestamp
      ? new Date(message.timestamp).toLocaleTimeString()
      : ""

    if (message.role === "user") {
      lines.push(`### You ${timestamp ? `(${timestamp})` : ""}`)
    } else {
      lines.push(`### Pulse ${timestamp ? `(${timestamp})` : ""}`)
    }
    lines.push("")
    lines.push(message.content)
    lines.push("")

    if (message.screenshot) {
      lines.push("*[Screenshot attached]*")
      lines.push("")
    }
  }

  return lines.join("\n")
}

// Export single conversation to JSON
export function exportToJSON(conversation: Conversation): string {
  return JSON.stringify(conversation, null, 2)
}

// Export all conversations to JSON
export function exportAllToJSON(conversations: Conversation[]): string {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    version: "1.0",
    count: conversations.length,
    conversations
  }, null, 2)
}

// Export conversation to plain text
export function exportToText(conversation: Conversation): string {
  const lines: string[] = []

  lines.push(`Conversation: ${conversation.title}`)
  lines.push(`Date: ${new Date(conversation.createdAt).toLocaleString()}`)
  lines.push("=".repeat(50))
  lines.push("")

  for (const message of conversation.messages) {
    const role = message.role === "user" ? "You" : "Pulse"
    lines.push(`[${role}]`)
    lines.push(message.content)
    lines.push("")
  }

  return lines.join("\n")
}

// Download helper
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Export and download conversation
export function downloadConversation(
  conversation: Conversation,
  format: "markdown" | "json" | "text" = "markdown"
): void {
  const sanitizedTitle = conversation.title
    .replace(/[^a-z0-9]/gi, "_")
    .slice(0, 50)

  const timestamp = new Date().toISOString().split("T")[0]

  switch (format) {
    case "markdown": {
      const content = exportToMarkdown(conversation)
      downloadFile(content, `pulse_${sanitizedTitle}_${timestamp}.md`, "text/markdown")
      break
    }
    case "json": {
      const content = exportToJSON(conversation)
      downloadFile(content, `pulse_${sanitizedTitle}_${timestamp}.json`, "application/json")
      break
    }
    case "text": {
      const content = exportToText(conversation)
      downloadFile(content, `pulse_${sanitizedTitle}_${timestamp}.txt`, "text/plain")
      break
    }
  }
}

// Export all conversations
export function downloadAllConversations(conversations: Conversation[]): void {
  const timestamp = new Date().toISOString().split("T")[0]
  const content = exportAllToJSON(conversations)
  downloadFile(content, `pulse_all_conversations_${timestamp}.json`, "application/json")
}

// Import conversations from JSON file
export async function importFromFile(file: File): Promise<{ imported: number; errors: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        const errors: string[] = []
        let imported = 0

        // Handle both single conversation and bulk export format
        const conversations: Conversation[] = data.conversations || [data]

        for (const conv of conversations) {
          if (isValidConversation(conv)) {
            imported++
          } else {
            errors.push(`Invalid conversation format: ${conv.id || "unknown"}`)
          }
        }

        resolve({ imported, errors })
      } catch (error) {
        reject(new Error("Invalid JSON file"))
      }
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

// Validate conversation structure
function isValidConversation(obj: unknown): obj is Conversation {
  if (typeof obj !== "object" || obj === null) return false

  const conv = obj as Record<string, unknown>

  return (
    typeof conv.id === "string" &&
    typeof conv.title === "string" &&
    Array.isArray(conv.messages) &&
    typeof conv.createdAt === "number" &&
    typeof conv.updatedAt === "number"
  )
}

// Generate shareable link (placeholder - would need backend)
export function generateShareableLink(conversation: Conversation): string {
  // In production, this would upload to a server and return a shareable URL
  // For now, we encode to base64 (limited to small conversations)
  const data = JSON.stringify({
    title: conversation.title,
    messages: conversation.messages.slice(-10) // Last 10 messages only
  })

  const encoded = btoa(encodeURIComponent(data))
  return `pulse://share/${encoded}`
}
