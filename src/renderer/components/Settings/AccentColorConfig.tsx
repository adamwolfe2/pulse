/**
 * Accent Color Configuration Component
 *
 * Accessibility: Implements WCAG 2.1 AA compliance with ARIA labels,
 * proper form controls, and keyboard navigation support.
 */

import React from "react"
import { usePulseStore } from "../../stores/pulseStore"
import { Check, Minimize2, Maximize2 } from "lucide-react"
import { Logo } from "../Logo"
import { useId } from "../../hooks/useAccessibility"

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
  const primaryColorId = useId("primary-color")
  const secondaryColorId = useId("secondary-color")

  const handlePresetSelect = (preset: typeof presetColors[0]) => {
    updateSettings({
      accentColor: preset.color1,
      accentColor2: preset.color2,
    })
  }

  const handleCustomColor = (key: "accentColor" | "accentColor2", value: string) => {
    updateSettings({ [key]: value })
  }

  const Toggle = ({
    enabled,
    onToggle,
    id,
    label
  }: {
    enabled: boolean
    onToggle: () => void
    id: string
    label: string
  }) => (
    <button
      id={id}
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      className={`
        w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-[#1e1e1e]
        ${enabled ? "bg-green-500" : "bg-white/10"}
      `}
    >
      <div
        className={`
          w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform
          ${enabled ? "translate-x-5" : "translate-x-0.5"}
        `}
        aria-hidden="true"
      />
    </button>
  )

  return (
    <div className="space-y-6" role="form" aria-label="Appearance settings">
      {/* Color Source */}
      <section aria-labelledby="accent-color-heading">
        <h3 id="accent-color-heading" className="text-white/70 text-sm font-medium mb-3">
          Accent Color
        </h3>
        <p className="text-white/40 text-xs mb-4">
          Choose a color theme for the Pulse interface. This affects buttons, highlights, and accents.
        </p>

        {/* Preset Colors */}
        <div
          className="grid grid-cols-4 gap-3 mb-6"
          role="radiogroup"
          aria-label="Preset color themes"
        >
          {presetColors.map((preset) => {
            const isSelected = preset.color1 === currentColor1 && preset.color2 === currentColor2
            return (
              <button
                key={preset.name}
                onClick={() => handlePresetSelect(preset)}
                role="radio"
                aria-checked={isSelected}
                aria-label={`${preset.name} color theme`}
                className={`
                  relative p-3 rounded-xl transition-all duration-150
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#1e1e1e]
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
                  aria-hidden="true"
                />
                <span className="text-white/60 text-xs">{preset.name}</span>
                {isSelected && (
                  <div
                    className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <Check size={10} className="text-black" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Custom Colors */}
      <section aria-labelledby="custom-colors-heading">
        <h3 id="custom-colors-heading" className="text-white/70 text-sm font-medium mb-3">
          Custom Colors
        </h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor={primaryColorId} className="text-white/40 text-xs mb-2 block">
              Primary
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id={`${primaryColorId}-picker`}
                value={currentColor1}
                onChange={(e) => handleCustomColor("accentColor", e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                aria-label="Pick primary color"
              />
              <input
                type="text"
                id={primaryColorId}
                value={currentColor1}
                onChange={(e) => handleCustomColor("accentColor", e.target.value)}
                aria-label="Primary color hex value"
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm font-mono
                  focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex-1">
            <label htmlFor={secondaryColorId} className="text-white/40 text-xs mb-2 block">
              Secondary
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id={`${secondaryColorId}-picker`}
                value={currentColor2}
                onChange={(e) => handleCustomColor("accentColor2", e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                aria-label="Pick secondary color"
              />
              <input
                type="text"
                id={secondaryColorId}
                value={currentColor2}
                onChange={(e) => handleCustomColor("accentColor2", e.target.value)}
                aria-label="Secondary color hex value"
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm font-mono
                  focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Display Settings */}
      <section aria-labelledby="display-settings-heading">
        <h3 id="display-settings-heading" className="text-white/70 text-sm font-medium mb-3">
          Display
        </h3>
        <div className="space-y-2">
          {/* Reduced Motion */}
          <div
            className="flex items-start justify-between p-4 rounded-xl"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5 text-white/60" aria-hidden="true">
                <Minimize2 size={18} />
              </div>
              <div>
                <label htmlFor="reduced-motion" className="text-white/80 text-sm font-medium cursor-pointer">
                  Reduce Motion
                </label>
                <p className="text-white/40 text-xs mt-0.5" id="reduced-motion-description">
                  Disable animations for accessibility or to reduce distraction
                </p>
              </div>
            </div>
            <Toggle
              id="reduced-motion"
              enabled={settings.reducedMotion ?? false}
              onToggle={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
              label={`Reduce motion: ${settings.reducedMotion ? 'enabled' : 'disabled'}`}
            />
          </div>

          {/* Compact Mode */}
          <div
            className="flex items-start justify-between p-4 rounded-xl"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5 text-white/60" aria-hidden="true">
                <Maximize2 size={18} />
              </div>
              <div>
                <label htmlFor="compact-mode" className="text-white/80 text-sm font-medium cursor-pointer">
                  Compact Mode
                </label>
                <p className="text-white/40 text-xs mt-0.5" id="compact-mode-description">
                  Use a smaller, more compact interface layout
                </p>
              </div>
            </div>
            <Toggle
              id="compact-mode"
              enabled={settings.compactMode ?? false}
              onToggle={() => updateSettings({ compactMode: !settings.compactMode })}
              label={`Compact mode: ${settings.compactMode ? 'enabled' : 'disabled'}`}
            />
          </div>
        </div>
      </section>

      {/* Preview */}
      <section aria-labelledby="preview-heading">
        <h3 id="preview-heading" className="text-white/70 text-sm font-medium mb-3">Preview</h3>
        <div
          className="p-4 rounded-xl"
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
          aria-label="Color theme preview"
          role="img"
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
              tabIndex={-1}
              aria-hidden="true"
            >
              Primary Action
            </button>
            <button
              className="px-4 py-2 rounded-lg text-white/70 text-sm border"
              style={{ borderColor: currentColor1 }}
              tabIndex={-1}
              aria-hidden="true"
            >
              Secondary
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
