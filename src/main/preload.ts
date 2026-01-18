import { contextBridge, ipcRenderer } from "electron"

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

  // Cleanup
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners("overlay-show")
    ipcRenderer.removeAllListeners("overlay-hide")
    ipcRenderer.removeAllListeners("activate-voice")
    ipcRenderer.removeAllListeners("screenshot-ready")
    ipcRenderer.removeAllListeners("proactive-trigger")
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
      onOverlayShow: (callback: (data: { mode: "chat" | "voice" }) => void) => void
      onOverlayHide: (callback: () => void) => void
      onActivateVoice: (callback: () => void) => void
      onScreenshotReady: (callback: (data: { screenshot: string }) => void) => void
      onProactiveTrigger: (callback: (data: { screenshot: string }) => void) => void
      removeAllListeners: () => void
    }
  }
}
