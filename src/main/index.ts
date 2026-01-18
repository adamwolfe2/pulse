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
import { initializeDatabase, closeDatabase } from "./database"
import { registerDatabaseHandlers } from "./services/databaseIpc"
import { initializeKeyVault } from "./services/keyVault"
import { registerVaultHandlers } from "./services/vaultIpc"

// Keep references to prevent garbage collection
let overlayWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isOverlayVisible = false
let lastShortcutTime = 0
let proactiveInterval: NodeJS.Timeout | null = null
let isProactiveEnabled = false

// Get the correct path for resources in dev vs production
const isDev = process.env.NODE_ENV === "development"
const RENDERER_URL = isDev
  ? "http://localhost:5173"
  : `file://${path.join(__dirname, "../renderer/index.html")}`

function createOverlayWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  overlayWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  })

  overlayWindow.setIgnoreMouseEvents(true, { forward: true })
  overlayWindow.loadURL(RENDERER_URL)
  overlayWindow.hide()

  overlayWindow.on("closed", () => {
    overlayWindow = null
  })

  if (isDev) {
    overlayWindow.webContents.openDevTools({ mode: "detach" })
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
    : trayIcon.resize({ width: 16, height: 16 })

  tray = new Tray(resizedIcon)
  tray.setToolTip("Pulse - AI Desktop Companion")

  updateTrayMenu()
  tray.on("click", () => toggleOverlay("chat"))
}

function updateTrayMenu() {
  if (!tray) return

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Pulse",
      accelerator: "CommandOrControl+Shift+G",
      click: () => toggleOverlay("chat")
    },
    {
      label: "Voice Mode",
      accelerator: "CommandOrControl+Shift+V",
      click: () => showOverlay("voice")
    },
    {
      label: "Screenshot & Ask",
      accelerator: "CommandOrControl+Shift+S",
      click: () => captureAndAsk()
    },
    { type: "separator" },
    {
      label: "Proactive Mode",
      type: "checkbox",
      checked: isProactiveEnabled,
      click: (menuItem) => toggleProactiveMode(menuItem.checked)
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

function toggleOverlay(mode: "chat" | "voice" = "chat") {
  if (!overlayWindow) return

  if (isOverlayVisible) {
    hideOverlay()
  } else {
    showOverlay(mode)
  }
}

function showOverlay(mode: "chat" | "voice" = "chat") {
  if (!overlayWindow) return

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  overlayWindow.setBounds({ x: 0, y: 0, width, height })
  overlayWindow.show()
  overlayWindow.setIgnoreMouseEvents(false)
  isOverlayVisible = true

  overlayWindow.webContents.send("overlay-show", { mode })
}

function hideOverlay() {
  if (!overlayWindow) return

  overlayWindow.hide()
  overlayWindow.setIgnoreMouseEvents(true, { forward: true })
  isOverlayVisible = false

  overlayWindow.webContents.send("overlay-hide")
}

// Screen capture function
async function captureScreen(): Promise<string | null> {
  try {
    if (process.platform === "darwin") {
      const status = systemPreferences.getMediaAccessStatus("screen")
      if (status !== "granted") {
        console.log("Screen recording permission needed. Status:", status)
        // Trigger permission prompt
        await desktopCapturer.getSources({ types: ["screen"] })
      }
    }

    // Hide overlay temporarily for clean screenshot
    const wasVisible = isOverlayVisible
    if (wasVisible && overlayWindow) {
      overlayWindow.hide()
    }

    // Small delay to ensure overlay is hidden
    await new Promise(resolve => setTimeout(resolve, 100))

    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1920, height: 1080 }
    })

    // Restore overlay
    if (wasVisible && overlayWindow) {
      overlayWindow.show()
    }

    if (sources.length === 0) return null

    const primarySource = sources[0]
    const thumbnail = primarySource.thumbnail
    const base64 = thumbnail.toPNG().toString("base64")
    return `data:image/png;base64,${base64}`
  } catch (error) {
    console.error("Screen capture failed:", error)
    return null
  }
}

async function captureAndAsk() {
  const screenshot = await captureScreen()
  if (screenshot) {
    showOverlay("chat")
    setTimeout(() => {
      overlayWindow?.webContents.send("screenshot-ready", { screenshot })
    }, 300)
  }
}

// Proactive mode - periodically analyze screen
function toggleProactiveMode(enabled: boolean) {
  isProactiveEnabled = enabled
  updateTrayMenu()

  if (enabled) {
    console.log("Proactive mode enabled - analyzing screen every 30s")
    proactiveInterval = setInterval(async () => {
      if (!isOverlayVisible) {
        const screenshot = await captureScreen()
        if (screenshot && overlayWindow) {
          overlayWindow.webContents.send("proactive-trigger", { screenshot })
        }
      }
    }, 30000)
  } else {
    console.log("Proactive mode disabled")
    if (proactiveInterval) {
      clearInterval(proactiveInterval)
      proactiveInterval = null
    }
  }
}

function registerGlobalShortcuts() {
  // Main shortcut with double-tap detection
  globalShortcut.register("CommandOrControl+Shift+G", () => {
    const now = Date.now()
    const timeSinceLastPress = now - lastShortcutTime
    lastShortcutTime = now

    if (timeSinceLastPress < 400) {
      // Double-tap = voice mode
      if (isOverlayVisible) {
        overlayWindow?.webContents.send("activate-voice")
      } else {
        showOverlay("voice")
      }
    } else {
      // Single tap = toggle chat
      toggleOverlay("chat")
    }
  })

  // Direct voice shortcut
  globalShortcut.register("CommandOrControl+Shift+V", () => {
    if (isOverlayVisible) {
      overlayWindow?.webContents.send("activate-voice")
    } else {
      showOverlay("voice")
    }
  })

  // Screenshot shortcut
  globalShortcut.register("CommandOrControl+Shift+S", () => {
    captureAndAsk()
  })

  // Escape to hide
  globalShortcut.register("Escape", () => {
    if (isOverlayVisible) {
      hideOverlay()
    }
  })
}

function setupIpcHandlers() {
  ipcMain.on("set-ignore-mouse", (_, ignore: boolean) => {
    if (overlayWindow) {
      overlayWindow.setIgnoreMouseEvents(ignore, { forward: true })
    }
  })

  ipcMain.on("hide-overlay", () => {
    hideOverlay()
  })

  ipcMain.on("enable-interaction", () => {
    if (overlayWindow) {
      overlayWindow.setIgnoreMouseEvents(false)
    }
  })

  ipcMain.handle("capture-screen", async () => {
    return await captureScreen()
  })

  ipcMain.handle("get-display-info", () => {
    const primaryDisplay = screen.getPrimaryDisplay()
    return {
      width: primaryDisplay.workAreaSize.width,
      height: primaryDisplay.workAreaSize.height,
      scaleFactor: primaryDisplay.scaleFactor
    }
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
}

// Auto-updater configuration
function setupAutoUpdater() {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on("checking-for-update", () => {
    console.log("Checking for updates...")
    overlayWindow?.webContents.send("update-status", { status: "checking" })
  })

  autoUpdater.on("update-available", (info) => {
    console.log("Update available:", info.version)
    overlayWindow?.webContents.send("update-status", {
      status: "available",
      version: info.version,
      releaseNotes: info.releaseNotes
    })
  })

  autoUpdater.on("update-not-available", () => {
    console.log("App is up to date")
    overlayWindow?.webContents.send("update-status", { status: "up-to-date" })
  })

  autoUpdater.on("download-progress", (progress) => {
    overlayWindow?.webContents.send("update-status", {
      status: "downloading",
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    })
  })

  autoUpdater.on("update-downloaded", (info) => {
    console.log("Update downloaded:", info.version)
    overlayWindow?.webContents.send("update-status", {
      status: "ready",
      version: info.version,
      releaseNotes: info.releaseNotes
    })
  })

  autoUpdater.on("error", (error) => {
    console.error("Auto-updater error:", error)
    overlayWindow?.webContents.send("update-status", {
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
  // Initialize services
  initializeDatabase()
  registerDatabaseHandlers()
  initializeKeyVault()
  registerVaultHandlers()

  createOverlayWindow()
  createTray()
  registerGlobalShortcuts()
  setupIpcHandlers()
  setupAutoUpdater()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createOverlayWindow()
    }
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("will-quit", () => {
  globalShortcut.unregisterAll()
  if (proactiveInterval) {
    clearInterval(proactiveInterval)
  }
  closeDatabase()
})

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on("second-instance", () => {
    if (overlayWindow) {
      showOverlay("chat")
    }
  })
}
