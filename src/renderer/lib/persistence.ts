// Conversation Persistence Layer
// Stores conversations in localStorage with optional sync

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  screenshot?: string
  timestamp: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  model?: string
}

const STORAGE_KEY = "pulse_conversations"
const MAX_CONVERSATIONS = 100

// Get all conversations
export function getConversations(): Conversation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const conversations = JSON.parse(stored) as Conversation[]
    // Sort by most recent
    return conversations.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

// Get a specific conversation
export function getConversation(id: string): Conversation | null {
  const conversations = getConversations()
  return conversations.find(c => c.id === id) || null
}

// Save a conversation
export function saveConversation(conversation: Conversation): void {
  try {
    const conversations = getConversations()
    const existingIndex = conversations.findIndex(c => c.id === conversation.id)

    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation
    } else {
      conversations.unshift(conversation)
    }

    // Limit storage to MAX_CONVERSATIONS
    const trimmed = conversations.slice(0, MAX_CONVERSATIONS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (e) {
    console.error("Failed to save conversation:", e)
  }
}

// Delete a conversation
export function deleteConversation(id: string): void {
  try {
    const conversations = getConversations().filter(c => c.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
  } catch (e) {
    console.error("Failed to delete conversation:", e)
  }
}

// Create a new conversation
export function createConversation(messages: Message[] = [], model?: string): Conversation {
  const now = Date.now()
  return {
    id: `conv-${now}-${Math.random().toString(36).slice(2, 9)}`,
    title: generateTitle(messages),
    messages,
    createdAt: now,
    updatedAt: now,
    model
  }
}

// Generate a title from messages
export function generateTitle(messages: Message[]): string {
  if (messages.length === 0) return "New Conversation"

  const firstUserMessage = messages.find(m => m.role === "user")
  if (!firstUserMessage) return "New Conversation"

  // Truncate to first 50 chars
  const title = firstUserMessage.content.slice(0, 50)
  return title.length < firstUserMessage.content.length ? `${title}...` : title
}

// Update conversation title
export function updateConversationTitle(id: string, title: string): void {
  const conversation = getConversation(id)
  if (conversation) {
    conversation.title = title
    conversation.updatedAt = Date.now()
    saveConversation(conversation)
  }
}

// Add message to conversation
export function addMessageToConversation(conversationId: string, message: Message): Conversation {
  let conversation = getConversation(conversationId)

  if (!conversation) {
    conversation = createConversation([message])
  } else {
    conversation.messages.push(message)
    conversation.updatedAt = Date.now()
    // Update title if it's the first user message
    if (conversation.title === "New Conversation" && message.role === "user") {
      conversation.title = generateTitle(conversation.messages)
    }
  }

  saveConversation(conversation)
  return conversation
}

// Clear all conversations
export function clearAllConversations(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// Search conversations
export function searchConversations(query: string): Conversation[] {
  const conversations = getConversations()
  const lowerQuery = query.toLowerCase()

  return conversations.filter(conv =>
    conv.title.toLowerCase().includes(lowerQuery) ||
    conv.messages.some(m => m.content.toLowerCase().includes(lowerQuery))
  )
}

// Export conversations as JSON
export function exportConversations(): string {
  return JSON.stringify(getConversations(), null, 2)
}

// Import conversations from JSON
export function importConversations(json: string): number {
  try {
    const imported = JSON.parse(json) as Conversation[]
    const existing = getConversations()
    const existingIds = new Set(existing.map(c => c.id))

    // Only add new conversations
    const newConversations = imported.filter(c => !existingIds.has(c.id))
    const merged = [...newConversations, ...existing].slice(0, MAX_CONVERSATIONS)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    return newConversations.length
  } catch {
    return 0
  }
}
