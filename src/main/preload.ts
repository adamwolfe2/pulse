import { contextBridge, ipcRenderer } from "electron"

// Types for database operations
interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  pinned: boolean
  archived: boolean
  messageCount?: number
  lastMessage?: string
}

interface Message {
  id: string
  conversationId: string
  role: "user" | "assistant" | "system"
  content: string
  screenshotPath?: string | null
  tokensUsed: number
  createdAt: number
}

interface ConversationWithMessages extends Conversation {
  messages: Message[]
}

interface UpdateStatus {
  status: "checking" | "available" | "up-to-date" | "downloading" | "ready" | "error"
  version?: string
  releaseNotes?: string
  percent?: number
  bytesPerSecond?: number
  transferred?: number
  total?: number
  error?: string
}

// Expose protected methods to renderer
contextBridge.exposeInMainWorld("pulse", {
  // Overlay control
  hideOverlay: () => ipcRenderer.send("hide-overlay"),
  setIgnoreMouse: (ignore: boolean) => ipcRenderer.send("set-ignore-mouse", ignore),
  enableInteraction: () => ipcRenderer.send("enable-interaction"),

  // Screen capture
  captureScreen: () => ipcRenderer.invoke("capture-screen"),
  checkScreenPermission: () => ipcRenderer.invoke("check-screen-permission"),

  // Microphone
  getMicPermission: () => ipcRenderer.invoke("get-mic-permission"),

  // Display info
  getDisplayInfo: () => ipcRenderer.invoke("get-display-info"),

  // Secure Key Vault
  vault: {
    get: (key: string) => ipcRenderer.invoke("vault:get", key),
    set: (key: string, value: string) => ipcRenderer.invoke("vault:set", key, value),
    delete: (key: string) => ipcRenderer.invoke("vault:delete", key),
    has: (key: string) => ipcRenderer.invoke("vault:has", key),
    isSecure: () => ipcRenderer.invoke("vault:isSecure"),
    migrate: (legacyData: Record<string, string>) => ipcRenderer.invoke("vault:migrate", legacyData),
  },

  // Database: Conversations
  db: {
    conversations: {
      create: (title?: string) => ipcRenderer.invoke("db:conversations:create", title),
      get: (id: string) => ipcRenderer.invoke("db:conversations:get", id),
      getWithMessages: (id: string) => ipcRenderer.invoke("db:conversations:getWithMessages", id),
      list: (options?: {
        includeArchived?: boolean
        pinnedFirst?: boolean
        limit?: number
        offset?: number
        search?: string
      }) => ipcRenderer.invoke("db:conversations:list", options),
      update: (id: string, updates: Partial<Pick<Conversation, "title" | "pinned" | "archived">>) =>
        ipcRenderer.invoke("db:conversations:update", id, updates),
      delete: (id: string) => ipcRenderer.invoke("db:conversations:delete", id),
    },
    messages: {
      add: (conversationId: string, message: Omit<Message, "id" | "conversationId" | "createdAt">) =>
        ipcRenderer.invoke("db:messages:add", conversationId, message),
      list: (conversationId: string, options?: { limit?: number; offset?: number }) =>
        ipcRenderer.invoke("db:messages:list", conversationId, options),
      delete: (id: string) => ipcRenderer.invoke("db:messages:delete", id),
    },
    stats: () => ipcRenderer.invoke("db:stats"),
  },

  // Event listeners
  onOverlayShow: (callback: (data: { mode: "chat" | "voice" }) => void) => {
    ipcRenderer.on("overlay-show", (_, data) => callback(data))
  },
  onOverlayHide: (callback: () => void) => {
    ipcRenderer.on("overlay-hide", () => callback())
  },
  onActivateVoice: (callback: () => void) => {
    ipcRenderer.on("activate-voice", () => callback())
  },
  onScreenshotReady: (callback: (data: { screenshot: string }) => void) => {
    ipcRenderer.on("screenshot-ready", (_, data) => callback(data))
  },
  onProactiveTrigger: (callback: (data: { screenshot: string }) => void) => {
    ipcRenderer.on("proactive-trigger", (_, data) => callback(data))
  },
  onUpdateStatus: (callback: (data: UpdateStatus) => void) => {
    ipcRenderer.on("update-status", (_, data) => callback(data))
  },

  // Updates
  updates: {
    check: () => ipcRenderer.invoke("update:check"),
    install: () => ipcRenderer.invoke("update:install"),
  },

  // Cleanup
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners("overlay-show")
    ipcRenderer.removeAllListeners("overlay-hide")
    ipcRenderer.removeAllListeners("activate-voice")
    ipcRenderer.removeAllListeners("screenshot-ready")
    ipcRenderer.removeAllListeners("proactive-trigger")
    ipcRenderer.removeAllListeners("update-status")
  }
})

// TypeScript declarations
declare global {
  interface Window {
    pulse: {
      hideOverlay: () => void
      setIgnoreMouse: (ignore: boolean) => void
      enableInteraction: () => void
      captureScreen: () => Promise<string | null>
      checkScreenPermission: () => Promise<string>
      getMicPermission: () => Promise<string>
      getDisplayInfo: () => Promise<{ width: number; height: number; scaleFactor: number }>
      vault: {
        get: (key: string) => Promise<string | null>
        set: (key: string, value: string) => Promise<boolean>
        delete: (key: string) => Promise<boolean>
        has: (key: string) => Promise<boolean>
        isSecure: () => Promise<boolean>
        migrate: (legacyData: Record<string, string>) => Promise<boolean>
      }
      db: {
        conversations: {
          create: (title?: string) => Promise<Conversation>
          get: (id: string) => Promise<Conversation | null>
          getWithMessages: (id: string) => Promise<ConversationWithMessages | null>
          list: (options?: {
            includeArchived?: boolean
            pinnedFirst?: boolean
            limit?: number
            offset?: number
            search?: string
          }) => Promise<Conversation[]>
          update: (id: string, updates: Partial<Pick<Conversation, "title" | "pinned" | "archived">>) => Promise<Conversation | null>
          delete: (id: string) => Promise<boolean>
        }
        messages: {
          add: (conversationId: string, message: Omit<Message, "id" | "conversationId" | "createdAt">) => Promise<Message>
          list: (conversationId: string, options?: { limit?: number; offset?: number }) => Promise<Message[]>
          delete: (id: string) => Promise<boolean>
        }
        stats: () => Promise<{ totalConversations: number; totalMessages: number; totalTokens: number }>
      }
      onOverlayShow: (callback: (data: { mode: "chat" | "voice" }) => void) => void
      onOverlayHide: (callback: () => void) => void
      onActivateVoice: (callback: () => void) => void
      onScreenshotReady: (callback: (data: { screenshot: string }) => void) => void
      onProactiveTrigger: (callback: (data: { screenshot: string }) => void) => void
      onUpdateStatus: (callback: (data: {
        status: "checking" | "available" | "up-to-date" | "downloading" | "ready" | "error"
        version?: string
        releaseNotes?: string
        percent?: number
        bytesPerSecond?: number
        transferred?: number
        total?: number
        error?: string
      }) => void) => void
      updates: {
        check: () => Promise<{ success: boolean; version?: string; error?: string }>
        install: () => Promise<void>
      }
      removeAllListeners: () => void
    }
  }
}
