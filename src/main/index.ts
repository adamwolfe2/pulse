import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
  Tray,
  Menu,
  nativeImage
} from "electron"
import * as path from "path"

// Keep references to prevent garbage collection
let overlayWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isOverlayVisible = false

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
    // Enable click-through for transparent areas
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  })

  // Make the window click-through by default
  overlayWindow.setIgnoreMouseEvents(true, { forward: true })

  // Load the renderer
  overlayWindow.loadURL(RENDERER_URL)

  // Hide on start
  overlayWindow.hide()

  // Handle window close
  overlayWindow.on("closed", () => {
    overlayWindow = null
  })

  // Open DevTools in development
  if (isDev) {
    overlayWindow.webContents.openDevTools({ mode: "detach" })
  }
}

function createTray() {
  // Create a simple tray icon
  const iconPath = path.join(__dirname, "../../assets/icon.png")
  let trayIcon: nativeImage

  try {
    trayIcon = nativeImage.createFromPath(iconPath)
    if (trayIcon.isEmpty()) {
      // Create a simple colored icon if file not found
      trayIcon = nativeImage.createEmpty()
    }
  } catch {
    trayIcon = nativeImage.createEmpty()
  }

  // Resize for tray (16x16 on most platforms)
  const resizedIcon = trayIcon.isEmpty()
    ? trayIcon
    : trayIcon.resize({ width: 16, height: 16 })

  tray = new Tray(resizedIcon)
  tray.setToolTip("GhostBar - AI Desktop Companion")

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Overlay",
      accelerator: "CommandOrControl+Shift+G",
      click: () => toggleOverlay()
    },
    {
      label: "Settings",
      click: () => openSettings()
    },
    { type: "separator" },
    {
      label: "Quit GhostBar",
      accelerator: "CommandOrControl+Q",
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  // Click on tray icon toggles overlay
  tray.on("click", () => {
    toggleOverlay()
  })
}

function toggleOverlay() {
  if (!overlayWindow) return

  if (isOverlayVisible) {
    hideOverlay()
  } else {
    showOverlay()
  }
}

function showOverlay() {
  if (!overlayWindow) return

  // Position overlay on primary display
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  overlayWindow.setBounds({ x: 0, y: 0, width, height })
  overlayWindow.show()
  overlayWindow.setIgnoreMouseEvents(false)
  isOverlayVisible = true

  // Notify renderer
  overlayWindow.webContents.send("overlay-visibility", true)
}

function hideOverlay() {
  if (!overlayWindow) return

  overlayWindow.hide()
  overlayWindow.setIgnoreMouseEvents(true, { forward: true })
  isOverlayVisible = false

  // Notify renderer
  overlayWindow.webContents.send("overlay-visibility", false)
}

function openSettings() {
  // TODO: Open settings window
  console.log("Opening settings...")
}

function registerGlobalShortcuts() {
  // Toggle overlay with Cmd/Ctrl + Shift + G
  globalShortcut.register("CommandOrControl+Shift+G", () => {
    toggleOverlay()
  })

  // Hide overlay with Escape
  globalShortcut.register("Escape", () => {
    if (isOverlayVisible) {
      hideOverlay()
    }
  })
}

// IPC Handlers
function setupIpcHandlers() {
  // Handle mouse events passthrough toggle
  ipcMain.on("set-ignore-mouse", (_, ignore: boolean) => {
    if (overlayWindow) {
      overlayWindow.setIgnoreMouseEvents(ignore, { forward: true })
    }
  })

  // Handle overlay visibility toggle from renderer
  ipcMain.on("toggle-overlay", () => {
    toggleOverlay()
  })

  // Handle hide overlay request
  ipcMain.on("hide-overlay", () => {
    hideOverlay()
  })

  // Handle suggestion shown - make interactive area clickable
  ipcMain.on("suggestion-area", (_, bounds: { x: number; y: number; width: number; height: number } | null) => {
    if (!overlayWindow) return

    if (bounds) {
      // Make only the suggestion area interactive
      overlayWindow.setIgnoreMouseEvents(false)
    } else {
      // Make entire overlay click-through again
      overlayWindow.setIgnoreMouseEvents(true, { forward: true })
    }
  })

  // Get display info
  ipcMain.handle("get-display-info", () => {
    const primaryDisplay = screen.getPrimaryDisplay()
    return {
      width: primaryDisplay.workAreaSize.width,
      height: primaryDisplay.workAreaSize.height,
      scaleFactor: primaryDisplay.scaleFactor
    }
  })
}

// App lifecycle
app.whenReady().then(() => {
  createOverlayWindow()
  createTray()
  registerGlobalShortcuts()
  setupIpcHandlers()

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
  // Unregister all shortcuts
  globalShortcut.unregisterAll()
})

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on("second-instance", () => {
    // Someone tried to run a second instance, show our overlay instead
    if (overlayWindow) {
      showOverlay()
    }
  })
}
