import React from "react"
import { usePulseStore } from "../../stores/pulseStore"
import { Check } from "lucide-react"
import { Logo } from "../Logo"

const presetColors = [
  { name: "Indigo", color1: "#6366f1", color2: "#8b5cf6" },
  { name: "Blue", color1: "#3b82f6", color2: "#06b6d4" },
  { name: "Green", color1: "#10b981", color2: "#22c55e" },
  { name: "Orange", color1: "#f97316", color2: "#eab308" },
  { name: "Pink", color1: "#ec4899", color2: "#f43f5e" },
  { name: "Purple", color1: "#a855f7", color2: "#6366f1" },
  { name: "Teal", color1: "#14b8a6", color2: "#0ea5e9" },
  { name: "Rose", color1: "#f43f5e", color2: "#fb7185" },
]

export function AccentColorConfig() {
  const { settings, updateSettings } = usePulseStore()
  const currentColor1 = settings.accentColor || "#6366f1"
  const currentColor2 = settings.accentColor2 || "#8b5cf6"

  const handlePresetSelect = (preset: typeof presetColors[0]) => {
    updateSettings({
      accentColor: preset.color1,
      accentColor2: preset.color2,
    })
  }

  const handleCustomColor = (key: "accentColor" | "accentColor2", value: string) => {
    updateSettings({ [key]: value })
  }

  return (
    <div className="space-y-6">
      {/* Color Source */}
      <section>
        <h3 className="text-white/70 text-sm font-medium mb-3">Accent Color</h3>
        <p className="text-white/40 text-xs mb-4">
          Choose a color theme for the Pulse interface. This affects buttons, highlights, and accents.
        </p>

        {/* Preset Colors */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {presetColors.map((preset) => {
            const isSelected = preset.color1 === currentColor1 && preset.color2 === currentColor2
            return (
              <button
                key={preset.name}
                onClick={() => handlePresetSelect(preset)}
                className={`
                  relative p-3 rounded-xl transition-all duration-150
                  ${isSelected ? "ring-2 ring-white/30" : "hover:bg-white/5"}
                `}
                style={{
                  background: isSelected ? "rgba(255, 255, 255, 0.05)" : "transparent",
                }}
              >
                <div
                  className="w-full h-8 rounded-lg mb-2"
                  style={{
                    background: `linear-gradient(135deg, ${preset.color1}, ${preset.color2})`,
                  }}
                />
                <span className="text-white/60 text-xs">{preset.name}</span>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                    <Check size={10} className="text-black" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Custom Colors */}
      <section>
        <h3 className="text-white/70 text-sm font-medium mb-3">Custom Colors</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-white/40 text-xs mb-2 block">Primary</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentColor1}
                onChange={(e) => handleCustomColor("accentColor", e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={currentColor1}
                onChange={(e) => handleCustomColor("accentColor", e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm font-mono"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-white/40 text-xs mb-2 block">Secondary</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentColor2}
                onChange={(e) => handleCustomColor("accentColor2", e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={currentColor2}
                onChange={(e) => handleCustomColor("accentColor2", e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm font-mono"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Preview */}
      <section>
        <h3 className="text-white/70 text-sm font-medium mb-3">Preview</h3>
        <div
          className="p-4 rounded-xl"
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div className="flex items-center gap-3">
            <Logo size={48} />
            <div>
              <div className="text-white/90 font-medium">Pulse Overlay</div>
              <div className="text-white/40 text-sm">Your AI desktop companion</div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{
                background: `linear-gradient(135deg, ${currentColor1}, ${currentColor2})`,
              }}
            >
              Primary Action
            </button>
            <button
              className="px-4 py-2 rounded-lg text-white/70 text-sm border"
              style={{ borderColor: currentColor1 }}
            >
              Secondary
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
