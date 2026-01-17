import React, { useState } from "react"
import { useGhostStore } from "../../stores/ghostStore"
import { Command, Keyboard, Plus, Trash2, RotateCcw } from "lucide-react"

interface Keybind {
  id: string
  action: string
  keys: string[]
  enabled: boolean
}

const defaultKeybinds: Keybind[] = [
  { id: "toggle-chat", action: "Toggle Chat Overlay", keys: ["CommandOrControl", "Shift", "G"], enabled: true },
  { id: "voice-mode", action: "Voice Input Mode", keys: ["CommandOrControl", "Shift", "V"], enabled: true },
  { id: "screenshot", action: "Capture Screen", keys: ["CommandOrControl", "Shift", "S"], enabled: true },
  { id: "hide-overlay", action: "Hide Overlay", keys: ["Escape"], enabled: true },
]

export function KeybindsConfig() {
  const { settings, updateSettings } = useGhostStore()
  const [keybinds, setKeybinds] = useState<Keybind[]>(
    settings.keybinds || defaultKeybinds
  )
  const [recordingId, setRecordingId] = useState<string | null>(null)

  const formatKeys = (keys: string[]) => {
    return keys.map(key => {
      if (key === "CommandOrControl") return navigator.platform.includes("Mac") ? "⌘" : "Ctrl"
      if (key === "Shift") return "⇧"
      if (key === "Alt") return navigator.platform.includes("Mac") ? "⌥" : "Alt"
      if (key === "Control") return "⌃"
      if (key === "Escape") return "Esc"
      return key
    }).join(" + ")
  }

  const toggleKeybind = (id: string) => {
    const updated = keybinds.map(kb =>
      kb.id === id ? { ...kb, enabled: !kb.enabled } : kb
    )
    setKeybinds(updated)
    updateSettings({ keybinds: updated })
  }

  const startRecording = (id: string) => {
    setRecordingId(id)
    // In a real implementation, we'd listen for key events here
  }

  const resetToDefaults = () => {
    setKeybinds(defaultKeybinds)
    updateSettings({ keybinds: defaultKeybinds })
  }

  return (
    <div className="space-y-6">
      {/* Trigger Key Info */}
      <section>
        <h3 className="text-white/70 text-sm font-medium mb-3">Keyboard Shortcuts</h3>
        <p className="text-white/40 text-xs mb-4">
          Configure keyboard shortcuts to quickly access Pulse features. Double-tap the chat shortcut to activate voice mode.
        </p>
      </section>

      {/* Keybinds List */}
      <section className="space-y-2">
        {keybinds.map((keybind) => (
          <div
            key={keybind.id}
            className="flex items-center justify-between p-3 rounded-xl"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            <div className="flex items-center gap-3">
              {/* Toggle */}
              <button
                onClick={() => toggleKeybind(keybind.id)}
                className={`
                  w-10 h-6 rounded-full transition-all duration-200
                  ${keybind.enabled ? "bg-green-500" : "bg-white/10"}
                `}
              >
                <div
                  className={`
                    w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform
                    ${keybind.enabled ? "translate-x-4" : "translate-x-0.5"}
                  `}
                />
              </button>

              {/* Action Name */}
              <span className={`text-sm ${keybind.enabled ? "text-white/80" : "text-white/40"}`}>
                {keybind.action}
              </span>
            </div>

            {/* Keybind Display */}
            <button
              onClick={() => startRecording(keybind.id)}
              className={`
                px-3 py-1.5 rounded-lg font-mono text-sm transition-all
                ${recordingId === keybind.id
                  ? "bg-blue-500/20 border-blue-500 text-blue-400 border animate-pulse"
                  : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                }
              `}
            >
              {recordingId === keybind.id ? "Recording..." : formatKeys(keybind.keys)}
            </button>
          </div>
        ))}
      </section>

      {/* Double-tap Info */}
      <section
        className="p-4 rounded-xl"
        style={{
          background: "rgba(99, 102, 241, 0.1)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
        }}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20">
            <Keyboard size={16} className="text-indigo-400" />
          </div>
          <div>
            <h4 className="text-white/80 text-sm font-medium mb-1">Quick Voice Mode</h4>
            <p className="text-white/50 text-xs">
              Double-tap <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">⌘⇧G</span> within
              400ms to instantly activate voice input mode for hands-free interaction.
            </p>
          </div>
        </div>
      </section>

      {/* Reset Button */}
      <section className="pt-4 border-t border-white/5">
        <button
          onClick={resetToDefaults}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors text-sm"
        >
          <RotateCcw size={14} />
          Reset to Defaults
        </button>
      </section>
    </div>
  )
}
