import { contextBridge, ipcRenderer } from "electron"

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("ghostbar", {
  // Overlay control
  toggleOverlay: () => ipcRenderer.send("toggle-overlay"),
  hideOverlay: () => ipcRenderer.send("hide-overlay"),
  setIgnoreMouse: (ignore: boolean) => ipcRenderer.send("set-ignore-mouse", ignore),
  setSuggestionArea: (bounds: { x: number; y: number; width: number; height: number } | null) =>
    ipcRenderer.send("suggestion-area", bounds),

  // Display info
  getDisplayInfo: () => ipcRenderer.invoke("get-display-info"),

  // Event listeners
  onOverlayVisibility: (callback: (visible: boolean) => void) => {
    ipcRenderer.on("overlay-visibility", (_, visible) => callback(visible))
  },

  // Remove listeners
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners("overlay-visibility")
  }
})

// TypeScript declaration for the exposed API
declare global {
  interface Window {
    ghostbar: {
      toggleOverlay: () => void
      hideOverlay: () => void
      setIgnoreMouse: (ignore: boolean) => void
      setSuggestionArea: (bounds: { x: number; y: number; width: number; height: number } | null) => void
      getDisplayInfo: () => Promise<{ width: number; height: number; scaleFactor: number }>
      onOverlayVisibility: (callback: (visible: boolean) => void) => void
      removeAllListeners: () => void
    }
  }
}
