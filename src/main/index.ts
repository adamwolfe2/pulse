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
import { autoUpdater } from "electron-updater"

// Optional imports - may fail if native modules aren't compiled
let initializeDatabase: () => void = () => {}
let closeDatabase: () => void = () => {}
let registerDatabaseHandlers: () => void = () => {}
let initializeKeyVault: () => void = () => {}
let registerVaultHandlers: () => void = () => {}

try {
  const db = require("./database")
  initializeDatabase = db.initializeDatabase
  closeDatabase = db.closeDatabase
  const dbIpc = require("./services/databaseIpc")
  registerDatabaseHandlers = dbIpc.registerDatabaseHandlers
} catch (e) {
  console.warn("[Database] Native module not available - running without persistence")
}

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
let tray: Tray | null = null
let isWidgetVisible = false
let lastShortcutTime = 0
let proactiveInterval: NodeJS.Timeout | null = null
let isProactiveEnabled = false
let mouseEdgeCheckInterval: NodeJS.Timeout | null = null

// Widget dimensions - compact like Nook/Atoll
const WIDGET_WIDTH = 420
const WIDGET_HEIGHT = 380
const WIDGET_MARGIN = 8

// Get the correct path for resources in dev vs production
const isDev = process.env.NODE_ENV === "development"
const RENDERER_URL = isDev
  ? "http://localhost:5173"
  : `file://${path.join(__dirname, "../renderer/index.html")}`

function getWidgetPosition() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width } = primaryDisplay.workAreaSize
  const menuBarHeight = primaryDisplay.workArea.y || 25

  // Position centered at top, just below menu bar (like Nook)
  return {
    x: Math.round((width - WIDGET_WIDTH) / 2),
    y: menuBarHeight + WIDGET_MARGIN
  }
}

function createWidgetWindow() {
  const { x, y } = getWidgetPosition()

  widgetWindow = new BrowserWindow({
    width: WIDGET_WIDTH,
    height: WIDGET_HEIGHT,
    x,
    y,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: true,
    hasShadow: true,
    backgroundColor: "#00000000",
    roundedCorners: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  })

  widgetWindow.loadURL(RENDERER_URL)
  widgetWindow.hide()

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

function createTray() {
  const iconPath = path.join(__dirname, "../../assets/Pulselogo.png")
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

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Pulse",
      accelerator: "CommandOrControl+Shift+G",
      click: () => showWidget()
    },
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
    { type: "separator" },
    {
      label: "Settings...",
      click: () => {
        showWidget()
        widgetWindow?.webContents.send("open-settings")
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
  // Initialize services (database is optional - may fail on some systems)
  try {
    initializeDatabase()
    registerDatabaseHandlers()
  } catch (error) {
    console.warn("[Database] Failed to initialize (running without persistence):", error)
  }

  try {
    initializeKeyVault()
    registerVaultHandlers()
  } catch (error) {
    console.warn("[Vault] Failed to initialize:", error)
  }

  createWidgetWindow()
  createTray()
  registerGlobalShortcuts()
  setupIpcHandlers()
  setupAutoUpdater()

  // Enable edge activation by default
  toggleEdgeActivation(true)

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWidgetWindow()
    }
  })
})

app.on("will-quit", () => {
  globalShortcut.unregisterAll()
  closeDatabase()

  if (proactiveInterval) {
    clearInterval(proactiveInterval)
  }
  if (mouseEdgeCheckInterval) {
    clearInterval(mouseEdgeCheckInterval)
  }
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
