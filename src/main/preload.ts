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
  // Widget control
  hideWidget: () => ipcRenderer.send("hide-widget"),
  showWidget: () => ipcRenderer.send("show-widget"),

  // Settings controls
  setProactiveMode: (enabled: boolean) => ipcRenderer.send("set-proactive-mode", enabled),
  setEdgeActivation: (enabled: boolean) => ipcRenderer.send("set-edge-activation", enabled),

  // Widget mode (compact/expanded)
  setWidgetMode: (mode: "compact" | "expanded") => ipcRenderer.send("set-widget-mode", mode),
  getWidgetMode: () => ipcRenderer.invoke("get-widget-mode"),

  // Legacy aliases
  hideOverlay: () => ipcRenderer.send("hide-widget"),
  setIgnoreMouse: (_ignore: boolean) => {}, // No-op for widget mode
  enableInteraction: () => {},

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
  onWidgetShow: (callback: (data: { mode: string }) => void) => {
    ipcRenderer.on("widget-show", (_, data) => callback(data))
  },
  onWidgetHide: (callback: () => void) => {
    ipcRenderer.on("widget-hide", () => callback())
  },
  onOpenSettings: (callback: () => void) => {
    ipcRenderer.on("open-settings", () => callback())
  },
  onOpenHistory: (callback: () => void) => {
    ipcRenderer.on("open-history", () => callback())
  },
  onOpenShortcuts: (callback: () => void) => {
    ipcRenderer.on("open-shortcuts", () => callback())
  },
  onNewConversation: (callback: () => void) => {
    ipcRenderer.on("new-conversation", () => callback())
  },
  onWidgetModeChanged: (callback: (data: { mode: "compact" | "expanded" }) => void) => {
    ipcRenderer.on("widget-mode-changed", (_, data) => callback(data))
  },
  // Legacy aliases
  onOverlayShow: (callback: (data: { mode: "chat" | "voice" }) => void) => {
    ipcRenderer.on("widget-show", (_, data) => callback(data))
  },
  onOverlayHide: (callback: () => void) => {
    ipcRenderer.on("widget-hide", () => callback())
  },
  onActivateVoice: (callback: () => void) => {
    ipcRenderer.on("widget-show", (_, data) => {
      if (data.mode === "voice") callback()
    })
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

  // Task List Window
  taskWindow: {
    show: () => ipcRenderer.send("task-list:show"),
    hide: () => ipcRenderer.send("task-list:hide"),
    toggle: () => ipcRenderer.send("task-list:toggle"),
    minimize: () => ipcRenderer.send("task-list:minimize"),
    resize: (height: number) => ipcRenderer.send("task-list:resize", { height }),
    isVisible: () => ipcRenderer.invoke("task-list:get-visible"),
  },

  // Task notifications
  tasks: {
    notifyTaskAdded: (task: any) => ipcRenderer.send("task-added", task),
    setWindowVisible: (visible: boolean) => ipcRenderer.send(visible ? "task-list:show" : "task-list:hide"),
  },

  // Dynamic Island
  island: {
    expand: (context?: any) => ipcRenderer.send("island:expand", context),
    collapse: () => ipcRenderer.send("island:collapse"),
    hide: () => ipcRenderer.send("island:hide"),
    setMode: (mode: string) => ipcRenderer.send("island:set-mode", mode),
    getState: () => ipcRenderer.invoke("island:get-state"),
  },

  // Quick Task Capture trigger
  triggerQuickTask: () => ipcRenderer.send("quick-task-capture"),

  // Quick task capture event
  onQuickTaskCapture: (callback: () => void) => {
    ipcRenderer.on("quick-task-capture", () => callback())
  },

  // Island events
  onIslandState: (callback: (data: { state: string; context?: any }) => void) => {
    ipcRenderer.on("island-state", (_, data) => callback(data))
  },
  onIslandMode: (callback: (mode: string) => void) => {
    ipcRenderer.on("island-mode", (_, mode) => callback(mode))
  },

  // Cleanup
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners("widget-show")
    ipcRenderer.removeAllListeners("widget-hide")
    ipcRenderer.removeAllListeners("open-settings")
    ipcRenderer.removeAllListeners("open-history")
    ipcRenderer.removeAllListeners("open-shortcuts")
    ipcRenderer.removeAllListeners("new-conversation")
    ipcRenderer.removeAllListeners("widget-mode-changed")
    ipcRenderer.removeAllListeners("screenshot-ready")
    ipcRenderer.removeAllListeners("proactive-trigger")
    ipcRenderer.removeAllListeners("update-status")
    ipcRenderer.removeAllListeners("quick-task-capture")
    ipcRenderer.removeAllListeners("island-state")
    ipcRenderer.removeAllListeners("island-mode")
  }
})

// TypeScript declarations
declare global {
  interface Window {
    pulse: {
      // Widget control
      hideWidget: () => void
      showWidget: () => void
      hideOverlay: () => void
      setIgnoreMouse: (ignore: boolean) => void
      enableInteraction: () => void

      // Widget mode
      setWidgetMode: (mode: "compact" | "expanded") => void
      getWidgetMode: () => Promise<"compact" | "expanded">

      // Screen capture
      captureScreen: () => Promise<string | null>
      checkScreenPermission: () => Promise<string>
      getMicPermission: () => Promise<string>
      getDisplayInfo: () => Promise<{ width: number; height: number; scaleFactor: number }>

      // Settings
      setProactiveMode: (enabled: boolean) => void
      setEdgeActivation: (enabled: boolean) => void

      // Vault
      vault: {
        get: (key: string) => Promise<string | null>
        set: (key: string, value: string) => Promise<boolean>
        delete: (key: string) => Promise<boolean>
        has: (key: string) => Promise<boolean>
        isSecure: () => Promise<boolean>
        migrate: (legacyData: Record<string, string>) => Promise<boolean>
      }

      // Database
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

      // Event listeners
      onWidgetShow: (callback: (data: { mode: string }) => void) => void
      onWidgetHide: (callback: () => void) => void
      onOpenSettings: (callback: () => void) => void
      onOpenHistory: (callback: () => void) => void
      onOpenShortcuts: (callback: () => void) => void
      onNewConversation: (callback: () => void) => void
      onWidgetModeChanged: (callback: (data: { mode: "compact" | "expanded" }) => void) => void
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

      // Updates
      updates: {
        check: () => Promise<{ success: boolean; version?: string; error?: string }>
        install: () => Promise<void>
      }

      // Task List Window
      taskWindow: {
        show: () => void
        hide: () => void
        toggle: () => void
        minimize: () => void
        resize: (height: number) => void
        isVisible: () => Promise<boolean>
      }

      // Task notifications
      tasks: {
        notifyTaskAdded: (task: any) => void
        setWindowVisible: (visible: boolean) => void
      }

      // Dynamic Island
      island: {
        expand: (context?: any) => void
        collapse: () => void
        hide: () => void
        setMode: (mode: string) => void
        getState: () => Promise<string>
      }

      // Quick task capture
      triggerQuickTask: () => void
      onQuickTaskCapture: (callback: () => void) => void
      onIslandState: (callback: (data: { state: string; context?: any }) => void) => void
      onIslandMode: (callback: (mode: string) => void) => void

      // Cleanup
      removeAllListeners: () => void
    }
  }
}
