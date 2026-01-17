import React from "react"
import { useGhostStore } from "../../stores/ghostStore"
import { Monitor, Mic, Eye, Clock, Zap } from "lucide-react"

export function BehaviorConfig() {
  const { settings, updateSettings } = useGhostStore()

  const Toggle = ({
    enabled,
    onToggle
  }: {
    enabled: boolean
    onToggle: () => void
  }) => (
    <button
      onClick={onToggle}
      className={`
        w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0
        ${enabled ? "bg-green-500" : "bg-white/10"}
      `}
    >
      <div
        className={`
          w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform
          ${enabled ? "translate-x-5" : "translate-x-0.5"}
        `}
      />
    </button>
  )

  const SettingRow = ({
    icon,
    title,
    description,
    enabled,
    onToggle,
  }: {
    icon: React.ReactNode
    title: string
    description: string
    enabled: boolean
    onToggle: () => void
  }) => (
    <div
      className="flex items-start justify-between p-4 rounded-xl"
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-white/5 text-white/60">
          {icon}
        </div>
        <div>
          <h4 className="text-white/80 text-sm font-medium">{title}</h4>
          <p className="text-white/40 text-xs mt-0.5">{description}</p>
        </div>
      </div>
      <Toggle enabled={enabled} onToggle={onToggle} />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Screen Analysis */}
      <section>
        <h3 className="text-white/70 text-sm font-medium mb-3">Screen Analysis</h3>
        <div className="space-y-2">
          <SettingRow
            icon={<Monitor size={18} />}
            title="Screen Capture"
            description="Allow Pulse to capture your screen for context-aware assistance"
            enabled={settings.screenCaptureEnabled ?? true}
            onToggle={() => updateSettings({ screenCaptureEnabled: !settings.screenCaptureEnabled })}
          />
          <SettingRow
            icon={<Eye size={18} />}
            title="Proactive Mode"
            description="Periodically analyze screen and offer contextual suggestions"
            enabled={settings.proactiveEnabled ?? false}
            onToggle={() => updateSettings({ proactiveEnabled: !settings.proactiveEnabled })}
          />
        </div>
      </section>

      {/* Proactive Settings */}
      {settings.proactiveEnabled && (
        <section
          className="p-4 rounded-xl space-y-4"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div className="flex items-center gap-2 text-white/60">
            <Clock size={14} />
            <span className="text-xs font-medium">Proactive Check Interval</span>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="15"
              max="120"
              step="15"
              value={settings.proactiveInterval ?? 30}
              onChange={(e) => updateSettings({ proactiveInterval: parseInt(e.target.value) })}
              className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:shadow-md"
            />
            <span className="text-white/60 text-sm font-mono w-16 text-right">
              {settings.proactiveInterval ?? 30}s
            </span>
          </div>
        </section>
      )}

      {/* Voice Input */}
      <section>
        <h3 className="text-white/70 text-sm font-medium mb-3">Voice Input</h3>
        <div className="space-y-2">
          <SettingRow
            icon={<Mic size={18} />}
            title="Voice Mode"
            description="Enable voice input for hands-free interaction with Pulse"
            enabled={settings.voiceEnabled ?? true}
            onToggle={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })}
          />
        </div>
      </section>

      {/* Startup */}
      <section>
        <h3 className="text-white/70 text-sm font-medium mb-3">Startup</h3>
        <div className="space-y-2">
          <SettingRow
            icon={<Zap size={18} />}
            title="Launch at Login"
            description="Automatically start Pulse when you log in"
            enabled={settings.launchAtLogin ?? false}
            onToggle={() => updateSettings({ launchAtLogin: !settings.launchAtLogin })}
          />
        </div>
      </section>

      {/* API Configuration */}
      <section>
        <h3 className="text-white/70 text-sm font-medium mb-3">API Configuration</h3>
        <div
          className="p-4 rounded-xl"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <label className="text-white/60 text-xs mb-2 block">Claude API Key</label>
          <input
            type="password"
            value={settings.apiKey || ""}
            onChange={(e) => updateSettings({ apiKey: e.target.value })}
            placeholder="sk-ant-api03-..."
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm font-mono placeholder:text-white/20"
          />
          <p className="text-white/30 text-xs mt-2">
            Your API key is stored locally and never sent to our servers.
          </p>
        </div>
      </section>
    </div>
  )
}
