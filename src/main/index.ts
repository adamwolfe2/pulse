import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
  Tray,
  Menu,
  nativeImage,
  desktopCapturer,
  systemPreferences,
  dialog
} from "electron"
import * as path from "path"
import * as fs from "fs"
import { autoUpdater } from "electron-updater"
import { WINDOW, TIMING, SHORTCUTS } from "../shared/constants"
import type { DynamicIslandState, WindowPosition } from "../shared/types"

// Optional imports - may fail if native modules aren't compiled
let initializeKeyVault: () => void = () => {}
let registerVaultHandlers: () => void = () => {}

try {
  const vault = require("./services/keyVault")
  initializeKeyVault = vault.initializeKeyVault
  const vaultIpc = require("./services/vaultIpc")
  registerVaultHandlers = vaultIpc.registerVaultHandlers
} catch (e) {
  console.warn("[Vault] Module not available")
}

// Keep references to prevent garbage collection
let widgetWindow: BrowserWindow | null = null
let taskListWindow: BrowserWindow | null = null
let dynamicIslandWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isWidgetVisible = false
let isTaskListVisible = false
let isDynamicIslandVisible = false
let lastShortcutTime = 0
let proactiveInterval: NodeJS.Timeout | null = null
let isProactiveEnabled = false
let mouseEdgeCheckInterval: NodeJS.Timeout | null = null
let dynamicIslandHoverTimer: NodeJS.Timeout | null = null
let dynamicIslandDismissTimer: NodeJS.Timeout | null = null
let islandState: DynamicIslandState = 'hidden'
let isCompactMode = false

// Use centralized constants for window dimensions
const { WIDGET, TASK_LIST, DYNAMIC_ISLAND } = WINDOW

// Window position memory
const SETTINGS_FILE = path.join(app.getPath("userData"), "pulse-settings.json")

interface AppSettings {
  windowPosition?: { x: number; y: number }
  taskListPosition?: { x: number; y: number }
  taskListVisible?: boolean
  lastDisplay?: string
}

function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"))
    }
  } catch (e) {
    console.warn("[Settings] Failed to load settings:", e)
  }
  return {}
}

function saveSettings(settings: AppSettings): void {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
  } catch (e) {
    console.warn("[Settings] Failed to save settings:", e)
  }
}

// Get the correct path for resources in dev vs production
const isDev = process.env.NODE_ENV === "development"
const RENDERER_URL = isDev
  ? "http://localhost:5173"
  : `file://${path.join(__dirname, "../renderer/index.html")}`

function getWidgetPosition() {
  const settings = loadSettings()
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  const menuBarHeight = primaryDisplay.workArea.y || 25

  // Try to restore saved position if on same display
  if (settings.windowPosition && settings.lastDisplay === primaryDisplay.id.toString()) {
    const { x, y } = settings.windowPosition
    // Validate position is still on screen
    if (x >= 0 && x + WIDGET.WIDTH <= width && y >= menuBarHeight && y + WIDGET.HEIGHT <= height) {
      return { x, y }
    }
  }

  // Default: Position centered at top, just below menu bar (like Nook)
  return {
    x: Math.round((width - WIDGET.WIDTH) / 2),
    y: menuBarHeight + WIDGET.MARGIN
  }
}

function saveWidgetPosition(): void {
  if (!widgetWindow) return

  const [x, y] = widgetWindow.getPosition()
  const primaryDisplay = screen.getPrimaryDisplay()

  const settings = loadSettings()
  settings.windowPosition = { x, y }
  settings.lastDisplay = primaryDisplay.id.toString()
  saveSettings(settings)
}

function createWidgetWindow() {
  const { x, y } = getWidgetPosition()

  // Use different settings for macOS vs other platforms
  const isMac = process.platform === "darwin"

  widgetWindow = new BrowserWindow({
    width: WIDGET.WIDTH,
    height: WIDGET.HEIGHT,
    x,
    y,
    // Transparency settings - macOS handles this differently
    transparent: isMac,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: true,
    hasShadow: true,
    // Use solid background color for better compatibility
    // The app container provides its own rounded corners and styling
    backgroundColor: isMac ? "#00000000" : "#0a0a0f",
    roundedCorners: true,
    // Enable hardware acceleration for better rendering
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      // Enable hardware acceleration
      enableBlinkFeatures: "CSSColorSchemeUARendering"
    }
  })

  console.log("[Main] Loading renderer URL:", RENDERER_URL)
  console.log("[Main] Preload path:", path.join(__dirname, "preload.js"))

  widgetWindow.loadURL(RENDERER_URL)
  widgetWindow.hide()

  // Log when the page finishes loading
  widgetWindow.webContents.on("did-finish-load", () => {
    console.log("[Main] Renderer finished loading")
  })

  // Log any renderer errors
  widgetWindow.webContents.on("did-fail-load", (_, errorCode, errorDescription) => {
    console.error("[Main] Renderer failed to load:", errorCode, errorDescription)
  })

  // Log console messages from the renderer
  widgetWindow.webContents.on("console-message", (_, level, message, line, sourceId) => {
    const levelName = ["verbose", "info", "warning", "error"][level] || "log"
    console.log(`[Renderer ${levelName}] ${message}`)
  })

  // Hide when losing focus (click outside)
  widgetWindow.on("blur", () => {
    if (isWidgetVisible) {
      hideWidget()
    }
  })

  widgetWindow.on("closed", () => {
    widgetWindow = null
  })

  if (isDev) {
    widgetWindow.webContents.openDevTools({ mode: "detach" })
  }
}

// Task List Window - Floating, draggable task widget
function createTaskListWindow() {
  const settings = loadSettings()
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  // Default position: right side of screen
  const defaultX = width - TASK_LIST.WIDTH - 20
  const defaultY = 100

  const x = settings.taskListPosition?.x ?? defaultX
  const y = settings.taskListPosition?.y ?? defaultY

  const isMac = process.platform === "darwin"

  taskListWindow = new BrowserWindow({
    width: TASK_LIST.WIDTH,
    height: TASK_LIST.HEIGHT,
    x,
    y,
    transparent: isMac,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    movable: true,
    focusable: true,
    hasShadow: true,
    backgroundColor: isMac ? "#00000000" : "#0a0a0f",
    roundedCorners: true,
    minWidth: 280,
    minHeight: TASK_LIST.MIN_HEIGHT,
    maxHeight: TASK_LIST.MAX_HEIGHT,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  })

  const taskUrl = isDev
    ? "http://localhost:5173/tasks.html"
    : `file://${path.join(__dirname, "../renderer/tasks.html")}`

  taskListWindow.loadURL(taskUrl)
  taskListWindow.hide()

  // Save position when moved
  taskListWindow.on("moved", () => {
    if (taskListWindow) {
      const [x, y] = taskListWindow.getPosition()
      const settings = loadSettings()
      settings.taskListPosition = { x, y }
      saveSettings(settings)
    }
  })

  taskListWindow.on("closed", () => {
    taskListWindow = null
    isTaskListVisible = false
  })
}

function showTaskList() {
  if (!taskListWindow) {
    createTaskListWindow()
  }
  taskListWindow?.show()
  isTaskListVisible = true
}

function hideTaskList() {
  taskListWindow?.hide()
  isTaskListVisible = false
}

function toggleTaskList() {
  if (isTaskListVisible) {
    hideTaskList()
  } else {
    showTaskList()
  }
}

// Dynamic Island Window - Hover-activated contextual AI
function createDynamicIslandWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width } = primaryDisplay.workAreaSize
  const menuBarHeight = primaryDisplay.workArea.y || 25

  const isMac = process.platform === "darwin"

  dynamicIslandWindow = new BrowserWindow({
    width: DYNAMIC_ISLAND.WIDTH_PILL,
    height: DYNAMIC_ISLAND.HEIGHT_PILL,
    x: Math.round((width - DYNAMIC_ISLAND.WIDTH_PILL) / 2),
    y: menuBarHeight + 4,
    transparent: isMac,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: false,
    hasShadow: true,
    backgroundColor: isMac ? "#00000000" : "#0a0a0f",
    roundedCorners: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  })

  const islandUrl = isDev
    ? "http://localhost:5173/island.html"
    : `file://${path.join(__dirname, "../renderer/island.html")}`

  dynamicIslandWindow.loadURL(islandUrl)
  dynamicIslandWindow.hide()

  dynamicIslandWindow.on("blur", () => {
    if (islandState === 'expanded') {
      collapseDynamicIsland()
    }
  })

  dynamicIslandWindow.on("closed", () => {
    dynamicIslandWindow = null
    isDynamicIslandVisible = false
    islandState = 'hidden'
  })
}

function showDynamicIslandPill() {
  if (!dynamicIslandWindow) return

  islandState = 'pill'
  isDynamicIslandVisible = true

  // Reset to pill size
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width } = primaryDisplay.workAreaSize
  const menuBarHeight = primaryDisplay.workArea.y || 25

  dynamicIslandWindow.setSize(DYNAMIC_ISLAND.WIDTH_PILL, DYNAMIC_ISLAND.HEIGHT_PILL)
  dynamicIslandWindow.setPosition(
    Math.round((width - DYNAMIC_ISLAND.WIDTH_PILL) / 2),
    menuBarHeight + 4
  )
  dynamicIslandWindow.setFocusable(false)
  dynamicIslandWindow.show()

  dynamicIslandWindow.webContents.send("island-state", { state: 'pill' })
}

function expandDynamicIsland(context?: any) {
  if (!dynamicIslandWindow) return

  islandState = 'expanded'

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width } = primaryDisplay.workAreaSize
  const menuBarHeight = primaryDisplay.workArea.y || 25

  // Expand with animation
  dynamicIslandWindow.setFocusable(true)
  dynamicIslandWindow.setSize(DYNAMIC_ISLAND.WIDTH_EXPANDED, DYNAMIC_ISLAND.HEIGHT_EXPANDED)
  dynamicIslandWindow.setPosition(
    Math.round((width - DYNAMIC_ISLAND.WIDTH_EXPANDED) / 2),
    menuBarHeight + 4
  )
  dynamicIslandWindow.focus()

  dynamicIslandWindow.webContents.send("island-state", {
    state: 'expanded',
    context
  })
}

function collapseDynamicIsland() {
  if (!dynamicIslandWindow) return

  // Start dismiss timer
  dynamicIslandDismissTimer = setTimeout(() => {
    hideDynamicIsland()
  }, 300)

  islandState = 'pill'
  showDynamicIslandPill()
}

function hideDynamicIsland() {
  if (!dynamicIslandWindow) return

  islandState = 'hidden'
  isDynamicIslandVisible = false
  dynamicIslandWindow.hide()
}

// Dynamic Island hover detection
function startDynamicIslandMonitoring() {
  setInterval(() => {
    const mousePos = screen.getCursorScreenPoint()
    const primaryDisplay = screen.getPrimaryDisplay()
    const menuBarHeight = primaryDisplay.workArea.y || 25
    const { width } = primaryDisplay.workAreaSize

    // Detection zone: top 30px, center 50% of screen
    const centerStart = width * 0.25
    const centerEnd = width * 0.75

    const isInHoverZone = (
      mousePos.y <= menuBarHeight + 25 &&
      mousePos.x >= centerStart &&
      mousePos.x <= centerEnd
    )

    if (isInHoverZone && islandState === 'hidden' && !isWidgetVisible) {
      // Clear any pending dismiss timer
      if (dynamicIslandDismissTimer) {
        clearTimeout(dynamicIslandDismissTimer)
        dynamicIslandDismissTimer = null
      }

      // Show pill after brief delay
      if (!dynamicIslandHoverTimer) {
        dynamicIslandHoverTimer = setTimeout(() => {
          showDynamicIslandPill()
          dynamicIslandHoverTimer = null
        }, 150)
      }
    } else if (isInHoverZone && islandState === 'pill') {
      // Start expansion timer if dwelling in pill state
      if (!dynamicIslandHoverTimer) {
        dynamicIslandHoverTimer = setTimeout(async () => {
          // Capture screen context before expanding
          const screenshot = await captureScreen()
          expandDynamicIsland({ screenshot })
          dynamicIslandHoverTimer = null
        }, 400)
      }
    } else if (!isInHoverZone) {
      // Clear hover timer
      if (dynamicIslandHoverTimer) {
        clearTimeout(dynamicIslandHoverTimer)
        dynamicIslandHoverTimer = null
      }

      // Hide immediately when mouse leaves
      if (isDynamicIslandVisible && islandState !== 'hidden') {
        if (!dynamicIslandDismissTimer) {
          dynamicIslandDismissTimer = setTimeout(() => {
            hideDynamicIsland()
            dynamicIslandDismissTimer = null
          }, 100) // Fast dismiss - feels instant
        }
      }
    }
  }, 30) // Faster polling for responsive feel
}

function createTray() {
  const iconPath = path.join(__dirname, "../../assets/icon.png")
  let trayIcon: nativeImage

  try {
    trayIcon = nativeImage.createFromPath(iconPath)
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty()
    }
  } catch {
    trayIcon = nativeImage.createEmpty()
  }

  const resizedIcon = trayIcon.isEmpty()
    ? trayIcon
    : trayIcon.resize({ width: 18, height: 18 })

  tray = new Tray(resizedIcon)
  tray.setToolTip("Pulse")

  updateTrayMenu()

  // Click tray icon to toggle widget
  tray.on("click", () => toggleWidget())
}

function updateTrayMenu() {
  if (!tray) return

  const appVersion = app.getVersion()

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Pulse",
      accelerator: "CommandOrControl+Shift+G",
      click: () => showWidget()
    },
    {
      label: "New Conversation",
      accelerator: "CommandOrControl+N",
      click: () => {
        showWidget()
        widgetWindow?.webContents.send("new-conversation")
      }
    },
    { type: "separator" },
    {
      label: "Voice Mode",
      accelerator: "CommandOrControl+Shift+V",
      click: () => showWidget("voice")
    },
    {
      label: "Screenshot & Ask",
      accelerator: "CommandOrControl+Shift+S",
      click: () => captureAndAsk()
    },
    { type: "separator" },
    {
      label: "Quick Task",
      accelerator: "CommandOrControl+Shift+T",
      click: () => {
        showWidget()
        widgetWindow?.webContents.send("quick-task-capture")
      }
    },
    {
      label: "Task List",
      accelerator: "CommandOrControl+Shift+L",
      click: () => toggleTaskList()
    },
    { type: "separator" },
    {
      label: "Conversation History",
      click: () => {
        showWidget()
        widgetWindow?.webContents.send("open-history")
      }
    },
    { type: "separator" },
    {
      label: "Proactive Suggestions",
      type: "checkbox",
      checked: isProactiveEnabled,
      click: (menuItem) => toggleProactiveMode(menuItem.checked)
    },
    {
      label: "Edge Activation",
      type: "checkbox",
      checked: mouseEdgeCheckInterval !== null,
      click: (menuItem) => toggleEdgeActivation(menuItem.checked)
    },
    {
      label: "Launch at Login",
      type: "checkbox",
      checked: app.getLoginItemSettings().openAtLogin,
      click: (menuItem) => {
        app.setLoginItemSettings({
          openAtLogin: menuItem.checked,
          openAsHidden: true
        })
      }
    },
    { type: "separator" },
    {
      label: "Settings...",
      accelerator: "CommandOrControl+,",
      click: () => {
        showWidget()
        widgetWindow?.webContents.send("open-settings")
      }
    },
    {
      label: "Keyboard Shortcuts",
      click: () => {
        showWidget()
        widgetWindow?.webContents.send("open-shortcuts")
      }
    },
    { type: "separator" },
    {
      label: "Check for Updates",
      click: () => {
        autoUpdater.checkForUpdatesAndNotify()
      }
    },
    {
      label: `About Pulse v${appVersion}`,
      click: () => {
        dialog.showMessageBox({
          type: "info",
          title: "About Pulse",
          message: "Pulse - AI Desktop Companion",
          detail: `Version ${appVersion}\n\nYour intelligent AI assistant, always just a shortcut away.\n\n© 2024 Pulse`,
          buttons: ["OK"]
        })
      }
    },
    { type: "separator" },
    {
      label: "Quit Pulse",
      accelerator: "CommandOrControl+Q",
      click: () => app.quit()
    }
  ])

  tray.setContextMenu(contextMenu)
}

function toggleWidget() {
  if (isWidgetVisible) {
    hideWidget()
  } else {
    showWidget()
  }
}

function showWidget(mode: "chat" | "voice" = "chat") {
  if (!widgetWindow) return

  // Update position in case display changed
  const { x, y } = getWidgetPosition()
  widgetWindow.setPosition(x, y)

  widgetWindow.show()
  widgetWindow.focus()
  isWidgetVisible = true

  widgetWindow.webContents.send("widget-show", { mode })
}

function hideWidget() {
  if (!widgetWindow) return

  // Save position before hiding
  saveWidgetPosition()

  widgetWindow.hide()
  isWidgetVisible = false
  widgetWindow.webContents.send("widget-hide")
}

// Edge activation - show widget when mouse moves to top edge
function toggleEdgeActivation(enabled: boolean) {
  if (enabled && !mouseEdgeCheckInterval) {
    mouseEdgeCheckInterval = setInterval(() => {
      const mousePos = screen.getCursorScreenPoint()
      const primaryDisplay = screen.getPrimaryDisplay()
      const menuBarHeight = primaryDisplay.workArea.y || 25

      // Trigger if mouse is in the top 5px and centered
      const { width } = primaryDisplay.workAreaSize
      const centerZone = width / 4

      if (
        mousePos.y <= menuBarHeight + 5 &&
        mousePos.x > centerZone &&
        mousePos.x < width - centerZone &&
        !isWidgetVisible
      ) {
        showWidget()
      }
    }, 100)
  } else if (!enabled && mouseEdgeCheckInterval) {
    clearInterval(mouseEdgeCheckInterval)
    mouseEdgeCheckInterval = null
  }

  updateTrayMenu()
}

function toggleProactiveMode(enabled: boolean) {
  isProactiveEnabled = enabled

  if (enabled && !proactiveInterval) {
    // Show proactive suggestion every 30 seconds when enabled
    proactiveInterval = setInterval(async () => {
      if (!isWidgetVisible) {
        // Capture screen for context
        const screenshot = await captureScreen()
        if (screenshot) {
          showWidget()
          widgetWindow?.webContents.send("proactive-trigger", { screenshot })
        }
      }
    }, 30000)

    // Initial trigger after 5 seconds
    setTimeout(async () => {
      if (isProactiveEnabled && !isWidgetVisible) {
        const screenshot = await captureScreen()
        if (screenshot) {
          showWidget()
          widgetWindow?.webContents.send("proactive-trigger", { screenshot })
        }
      }
    }, 5000)
  } else if (!enabled && proactiveInterval) {
    clearInterval(proactiveInterval)
    proactiveInterval = null
  }

  updateTrayMenu()
}

async function captureScreen(): Promise<string | null> {
  try {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1920, height: 1080 }
    })

    if (sources.length > 0) {
      const screenshot = sources[0].thumbnail.toDataURL()
      return screenshot
    }
  } catch (error) {
    console.error("Screen capture failed:", error)
  }
  return null
}

async function captureAndAsk() {
  const screenshot = await captureScreen()
  if (screenshot) {
    showWidget()
    widgetWindow?.webContents.send("screenshot-ready", { screenshot })
  }
}

function registerGlobalShortcuts() {
  // Main toggle
  globalShortcut.register("CommandOrControl+Shift+G", () => {
    const now = Date.now()
    if (now - lastShortcutTime > 300) {
      lastShortcutTime = now
      toggleWidget()
    }
  })

  // Voice mode
  globalShortcut.register("CommandOrControl+Shift+V", () => {
    showWidget("voice")
  })

  // Screenshot
  globalShortcut.register("CommandOrControl+Shift+S", () => {
    captureAndAsk()
  })

  // Escape to hide
  globalShortcut.register("Escape", () => {
    if (isWidgetVisible) {
      hideWidget()
    }
    if (isDynamicIslandVisible) {
      hideDynamicIsland()
    }
  })

  // Quick task capture
  globalShortcut.register("CommandOrControl+Shift+T", () => {
    showWidget()
    widgetWindow?.webContents.send("quick-task-capture")
  })

  // Toggle task list
  globalShortcut.register("CommandOrControl+Shift+L", () => {
    toggleTaskList()
  })
}

function setupIpcHandlers() {
  ipcMain.on("hide-widget", () => hideWidget())
  ipcMain.on("show-widget", () => showWidget())

  ipcMain.handle("capture-screen", async () => {
    return await captureScreen()
  })

  ipcMain.handle("check-screen-permission", () => {
    if (process.platform === "darwin") {
      return systemPreferences.getMediaAccessStatus("screen")
    }
    return "granted"
  })

  ipcMain.handle("get-mic-permission", async () => {
    if (process.platform === "darwin") {
      const status = systemPreferences.getMediaAccessStatus("microphone")
      if (status !== "granted") {
        const granted = await systemPreferences.askForMediaAccess("microphone")
        return granted ? "granted" : "denied"
      }
      return status
    }
    return "granted"
  })

  ipcMain.handle("get-display-info", () => {
    const display = screen.getPrimaryDisplay()
    return {
      width: display.size.width,
      height: display.size.height,
      scaleFactor: display.scaleFactor
    }
  })

  ipcMain.on("set-proactive-mode", (_, enabled: boolean) => {
    toggleProactiveMode(enabled)
  })

  ipcMain.on("set-edge-activation", (_, enabled: boolean) => {
    toggleEdgeActivation(enabled)
  })

  // Compact/expanded mode handler
  ipcMain.on("set-widget-mode", (_, mode: "compact" | "expanded") => {
    if (!widgetWindow) return

    isCompactMode = mode === "compact"
    const newHeight = isCompactMode ? WIDGET.HEIGHT_COMPACT : WIDGET.HEIGHT

    // Get current position to maintain x position
    const [x, y] = widgetWindow.getPosition()

    // Animate height change
    widgetWindow.setSize(WIDGET.WIDTH, newHeight, true)

    // Notify renderer of mode change
    widgetWindow.webContents.send("widget-mode-changed", { mode })
  })

  ipcMain.handle("get-widget-mode", () => {
    return isCompactMode ? "compact" : "expanded"
  })

  // Task list IPC handlers
  ipcMain.on("task-list:show", () => showTaskList())
  ipcMain.on("task-list:hide", () => hideTaskList())
  ipcMain.on("task-list:toggle", () => toggleTaskList())

  ipcMain.handle("task-list:get-visible", () => isTaskListVisible)

  ipcMain.on("task-list:minimize", () => {
    taskListWindow?.minimize()
  })

  ipcMain.on("task-list:resize", (_, { height }: { height: number }) => {
    if (taskListWindow) {
      const [width] = taskListWindow.getSize()
      const clampedHeight = Math.max(TASK_LIST.MIN_HEIGHT, Math.min(height, TASK_LIST.MAX_HEIGHT))
      taskListWindow.setSize(width, clampedHeight)
    }
  })

  // Dynamic Island IPC handlers
  ipcMain.on("island:expand", (_, context?: any) => expandDynamicIsland(context))
  ipcMain.on("island:collapse", () => collapseDynamicIsland())
  ipcMain.on("island:hide", () => hideDynamicIsland())
  ipcMain.on("island:set-mode", (_, mode: string) => {
    dynamicIslandWindow?.webContents.send("island-mode", mode)
  })

  ipcMain.handle("island:get-state", () => islandState)

  // Quick task capture from any context
  ipcMain.on("quick-task-capture", () => {
    if (isDynamicIslandVisible && islandState === 'expanded') {
      dynamicIslandWindow?.webContents.send("island-mode", 'task-capture')
    } else {
      showWidget()
      widgetWindow?.webContents.send("quick-task-capture")
    }
  })
}

// Auto-updater configuration
function setupAutoUpdater() {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on("checking-for-update", () => {
    console.log("Checking for updates...")
    widgetWindow?.webContents.send("update-status", { status: "checking" })
  })

  autoUpdater.on("update-available", (info) => {
    console.log("Update available:", info.version)
    widgetWindow?.webContents.send("update-status", {
      status: "available",
      version: info.version,
      releaseNotes: info.releaseNotes
    })
  })

  autoUpdater.on("update-not-available", () => {
    console.log("App is up to date")
    widgetWindow?.webContents.send("update-status", { status: "up-to-date" })
  })

  autoUpdater.on("download-progress", (progress) => {
    widgetWindow?.webContents.send("update-status", {
      status: "downloading",
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    })
  })

  autoUpdater.on("update-downloaded", (info) => {
    console.log("Update downloaded:", info.version)
    widgetWindow?.webContents.send("update-status", {
      status: "ready",
      version: info.version,
      releaseNotes: info.releaseNotes
    })
  })

  autoUpdater.on("error", (error) => {
    console.error("Auto-updater error:", error)
    widgetWindow?.webContents.send("update-status", {
      status: "error",
      error: error.message
    })
  })

  // IPC handlers for update actions
  ipcMain.handle("update:check", async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return { success: true, version: result?.updateInfo?.version }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle("update:install", () => {
    autoUpdater.quitAndInstall(false, true)
  })

  // Check for updates periodically in production (every 4 hours)
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify()
    setInterval(() => {
      autoUpdater.checkForUpdatesAndNotify()
    }, 4 * 60 * 60 * 1000)
  }
}

// App lifecycle
app.whenReady().then(() => {
  // Initialize vault for secure key storage
  try {
    initializeKeyVault()
    registerVaultHandlers()
  } catch (error) {
    console.warn("[Vault] Failed to initialize:", error)
  }

  createWidgetWindow()
  createTaskListWindow()
  createDynamicIslandWindow()
  createTray()
  registerGlobalShortcuts()
  setupIpcHandlers()
  setupAutoUpdater()

  // Start dynamic island hover monitoring
  startDynamicIslandMonitoring()

  // Enable edge activation by default
  toggleEdgeActivation(true)

  // Restore task list visibility if it was open
  const settings = loadSettings()
  if (settings.taskListVisible) {
    showTaskList()
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWidgetWindow()
    }
  })
})

app.on("will-quit", () => {
  globalShortcut.unregisterAll()

  if (proactiveInterval) {
    clearInterval(proactiveInterval)
  }
  if (mouseEdgeCheckInterval) {
    clearInterval(mouseEdgeCheckInterval)
  }
  if (dynamicIslandHoverTimer) {
    clearTimeout(dynamicIslandHoverTimer)
  }
  if (dynamicIslandDismissTimer) {
    clearTimeout(dynamicIslandDismissTimer)
  }

  // Save task list state
  const settings = loadSettings()
  settings.taskListVisible = isTaskListVisible
  saveSettings(settings)
})

app.on("window-all-closed", () => {
  // Keep running in tray on macOS
  if (process.platform !== "darwin") {
    app.quit()
  }
})

// macOS specific: hide dock icon (menu bar app only)
if (process.platform === "darwin") {
  app.dock?.hide()
}
