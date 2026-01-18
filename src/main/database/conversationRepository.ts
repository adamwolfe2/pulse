/**
 * Conversation Repository
 *
 * Handles all database operations for conversations and messages.
 * Provides a clean API for the rest of the application.
 */

import { v4 as uuidv4 } from "uuid"
import { getDatabase } from "./index"

// Types
export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  pinned: boolean
  archived: boolean
  messageCount?: number
  lastMessage?: string
}

export interface Message {
  id: string
  conversationId: string
  role: "user" | "assistant" | "system"
  content: string
  screenshotPath?: string | null
  tokensUsed: number
  createdAt: number
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[]
}

/**
 * Create a new conversation
 */
export function createConversation(title?: string): Conversation {
  const db = getDatabase()
  const id = uuidv4()
  const now = Date.now()

  db.prepare(`
    INSERT INTO conversations (id, title, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(id, title || "New Conversation", now, now)

  return {
    id,
    title: title || "New Conversation",
    createdAt: now,
    updatedAt: now,
    pinned: false,
    archived: false,
  }
}

/**
 * Get a conversation by ID
 */
export function getConversation(id: string): Conversation | null {
  const db = getDatabase()

  const row = db
    .prepare(
      `
    SELECT
      id, title, created_at, updated_at, pinned, archived
    FROM conversations
    WHERE id = ?
  `
    )
    .get(id) as {
    id: string
    title: string
    created_at: number
    updated_at: number
    pinned: number
    archived: number
  } | undefined

  if (!row) return null

  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pinned: row.pinned === 1,
    archived: row.archived === 1,
  }
}

/**
 * Get a conversation with all its messages
 */
export function getConversationWithMessages(
  id: string
): ConversationWithMessages | null {
  const conversation = getConversation(id)
  if (!conversation) return null

  const messages = getMessages(id)

  return {
    ...conversation,
    messages,
  }
}

/**
 * Get all conversations (with optional filters)
 */
export function getConversations(options: {
  includeArchived?: boolean
  pinnedFirst?: boolean
  limit?: number
  offset?: number
  search?: string
} = {}): Conversation[] {
  const db = getDatabase()
  const {
    includeArchived = false,
    pinnedFirst = true,
    limit = 100,
    offset = 0,
    search,
  } = options

  let sql = `
    SELECT
      c.id,
      c.title,
      c.created_at,
      c.updated_at,
      c.pinned,
      c.archived,
      COUNT(m.id) as message_count,
      (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
    FROM conversations c
    LEFT JOIN messages m ON c.id = m.conversation_id
    WHERE 1=1
  `

  const params: (string | number)[] = []

  if (!includeArchived) {
    sql += ` AND c.archived = 0`
  }

  if (search) {
    sql += ` AND (c.title LIKE ? OR c.id IN (SELECT conversation_id FROM messages WHERE content LIKE ?))`
    params.push(`%${search}%`, `%${search}%`)
  }

  sql += ` GROUP BY c.id`

  if (pinnedFirst) {
    sql += ` ORDER BY c.pinned DESC, c.updated_at DESC`
  } else {
    sql += ` ORDER BY c.updated_at DESC`
  }

  sql += ` LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const rows = db.prepare(sql).all(...params) as Array<{
    id: string
    title: string
    created_at: number
    updated_at: number
    pinned: number
    archived: number
    message_count: number
    last_message: string | null
  }>

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pinned: row.pinned === 1,
    archived: row.archived === 1,
    messageCount: row.message_count,
    lastMessage: row.last_message || undefined,
  }))
}

/**
 * Update a conversation
 */
export function updateConversation(
  id: string,
  updates: Partial<Pick<Conversation, "title" | "pinned" | "archived">>
): Conversation | null {
  const db = getDatabase()
  const now = Date.now()

  const fields: string[] = ["updated_at = ?"]
  const values: (string | number)[] = [now]

  if (updates.title !== undefined) {
    fields.push("title = ?")
    values.push(updates.title)
  }
  if (updates.pinned !== undefined) {
    fields.push("pinned = ?")
    values.push(updates.pinned ? 1 : 0)
  }
  if (updates.archived !== undefined) {
    fields.push("archived = ?")
    values.push(updates.archived ? 1 : 0)
  }

  values.push(id)

  db.prepare(`UPDATE conversations SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values
  )

  return getConversation(id)
}

/**
 * Delete a conversation and all its messages
 */
export function deleteConversation(id: string): boolean {
  const db = getDatabase()

  // Messages are deleted automatically due to ON DELETE CASCADE
  const result = db.prepare(`DELETE FROM conversations WHERE id = ?`).run(id)

  return result.changes > 0
}

/**
 * Add a message to a conversation
 */
export function addMessage(
  conversationId: string,
  message: Omit<Message, "id" | "conversationId" | "createdAt">
): Message {
  const db = getDatabase()
  const id = uuidv4()
  const now = Date.now()

  db.prepare(`
    INSERT INTO messages (id, conversation_id, role, content, screenshot_path, tokens_used, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    conversationId,
    message.role,
    message.content,
    message.screenshotPath || null,
    message.tokensUsed || 0,
    now
  )

  // Update conversation's updated_at timestamp
  db.prepare(`UPDATE conversations SET updated_at = ? WHERE id = ?`).run(
    now,
    conversationId
  )

  // Auto-generate title from first user message
  const conversation = getConversation(conversationId)
  if (conversation && conversation.title === "New Conversation" && message.role === "user") {
    const title = generateTitle(message.content)
    updateConversation(conversationId, { title })
  }

  return {
    id,
    conversationId,
    role: message.role,
    content: message.content,
    screenshotPath: message.screenshotPath || null,
    tokensUsed: message.tokensUsed || 0,
    createdAt: now,
  }
}

/**
 * Get all messages for a conversation
 */
export function getMessages(
  conversationId: string,
  options: { limit?: number; offset?: number } = {}
): Message[] {
  const db = getDatabase()
  const { limit = 1000, offset = 0 } = options

  const rows = db
    .prepare(
      `
    SELECT id, conversation_id, role, content, screenshot_path, tokens_used, created_at
    FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC
    LIMIT ? OFFSET ?
  `
    )
    .all(conversationId, limit, offset) as Array<{
    id: string
    conversation_id: string
    role: "user" | "assistant" | "system"
    content: string
    screenshot_path: string | null
    tokens_used: number
    created_at: number
  }>

  return rows.map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    screenshotPath: row.screenshot_path,
    tokensUsed: row.tokens_used,
    createdAt: row.created_at,
  }))
}

/**
 * Delete a message
 */
export function deleteMessage(id: string): boolean {
  const db = getDatabase()
  const result = db.prepare(`DELETE FROM messages WHERE id = ?`).run(id)
  return result.changes > 0
}

/**
 * Generate a title from the first message content
 */
function generateTitle(content: string): string {
  // Take first 50 characters, trim to last complete word
  let title = content.substring(0, 50).trim()

  if (content.length > 50) {
    const lastSpace = title.lastIndexOf(" ")
    if (lastSpace > 20) {
      title = title.substring(0, lastSpace)
    }
    title += "..."
  }

  // Remove newlines and excessive whitespace
  title = title.replace(/\s+/g, " ").trim()

  return title || "New Conversation"
}

/**
 * Get conversation statistics
 */
export function getStats(): {
  totalConversations: number
  totalMessages: number
  totalTokens: number
} {
  const db = getDatabase()

  const stats = db
    .prepare(
      `
    SELECT
      (SELECT COUNT(*) FROM conversations) as total_conversations,
      (SELECT COUNT(*) FROM messages) as total_messages,
      (SELECT COALESCE(SUM(tokens_used), 0) FROM messages) as total_tokens
  `
    )
    .get() as {
    total_conversations: number
    total_messages: number
    total_tokens: number
  }

  return {
    totalConversations: stats.total_conversations,
    totalMessages: stats.total_messages,
    totalTokens: stats.total_tokens,
  }
}
