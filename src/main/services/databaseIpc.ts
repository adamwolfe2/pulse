/**
 * Database IPC Handlers
 *
 * Exposes database operations to the renderer process via IPC.
 */

import { ipcMain } from "electron"
import {
  createConversation,
  getConversation,
  getConversationWithMessages,
  getConversations,
  updateConversation,
  deleteConversation,
  addMessage,
  getMessages,
  deleteMessage,
  getStats,
  type Conversation,
  type Message,
} from "../database/conversationRepository"

/**
 * Register all database IPC handlers
 */
export function registerDatabaseHandlers(): void {
  // Conversation handlers
  ipcMain.handle("db:conversations:create", (_, title?: string) => {
    return createConversation(title)
  })

  ipcMain.handle("db:conversations:get", (_, id: string) => {
    return getConversation(id)
  })

  ipcMain.handle("db:conversations:getWithMessages", (_, id: string) => {
    return getConversationWithMessages(id)
  })

  ipcMain.handle(
    "db:conversations:list",
    (
      _,
      options?: {
        includeArchived?: boolean
        pinnedFirst?: boolean
        limit?: number
        offset?: number
        search?: string
      }
    ) => {
      return getConversations(options)
    }
  )

  ipcMain.handle(
    "db:conversations:update",
    (
      _,
      id: string,
      updates: Partial<Pick<Conversation, "title" | "pinned" | "archived">>
    ) => {
      return updateConversation(id, updates)
    }
  )

  ipcMain.handle("db:conversations:delete", (_, id: string) => {
    return deleteConversation(id)
  })

  // Message handlers
  ipcMain.handle(
    "db:messages:add",
    (
      _,
      conversationId: string,
      message: Omit<Message, "id" | "conversationId" | "createdAt">
    ) => {
      return addMessage(conversationId, message)
    }
  )

  ipcMain.handle(
    "db:messages:list",
    (_, conversationId: string, options?: { limit?: number; offset?: number }) => {
      return getMessages(conversationId, options)
    }
  )

  ipcMain.handle("db:messages:delete", (_, id: string) => {
    return deleteMessage(id)
  })

  // Stats handler
  ipcMain.handle("db:stats", () => {
    return getStats()
  })

  console.log("[IPC] Database handlers registered")
}
