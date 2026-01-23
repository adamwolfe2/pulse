/**
 * Behavior Configuration Component
 *
 * Accessibility: Implements WCAG 2.1 AA compliance with ARIA labels,
 * proper form controls, and keyboard navigation support.
 */

import React from "react"
import { usePulseStore } from "../../stores/pulseStore"
import {
  Monitor,
  Mic,
  Eye,
  Clock,
  Zap,
  Bell,
  Volume2,
  Shield,
  Sparkles,
  Thermometer,
  PinIcon
} from "lucide-react"
import { useId } from "../../hooks/useAccessibility"

export function BehaviorConfig() {
  const { settings, updateSettings } = usePulseStore()

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

  const SettingRow = ({
    icon,
    title,
    description,
    enabled,
    onToggle,
    settingId
  }: {
    icon: React.ReactNode
    title: string
    description: string
    enabled: boolean
    onToggle: () => void
    settingId: string
  }) => {
    const id = useId(settingId)
    return (
      <div
        className="flex items-start justify-between p-4 rounded-xl"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white/5 text-white/60" aria-hidden="true">
            {icon}
          </div>
          <div>
            <label htmlFor={id} className="text-white/80 text-sm font-medium cursor-pointer">
              {title}
            </label>
            <p className="text-white/40 text-xs mt-0.5" id={`${id}-description`}>
              {description}
            </p>
          </div>
        </div>
        <Toggle
          id={id}
          enabled={enabled}
          onToggle={onToggle}
          label={`${title}: ${enabled ? 'enabled' : 'disabled'}`}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6" role="form" aria-label="Behavior settings">
      {/* Screen Analysis */}
      <section aria-labelledby="screen-analysis-heading">
        <h3 id="screen-analysis-heading" className="text-white/70 text-sm font-medium mb-3">
          Screen Analysis
        </h3>
        <div className="space-y-2">
          <SettingRow
            settingId="screen-capture"
            icon={<Monitor size={18} />}
            title="Screen Capture"
            description="Allow Pulse to capture your screen for context-aware assistance"
            enabled={settings.screenCaptureEnabled ?? true}
            onToggle={() => updateSettings({ screenCaptureEnabled: !settings.screenCaptureEnabled })}
          />
          <SettingRow
            settingId="proactive-mode"
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
          aria-labelledby="proactive-interval-label"
        >
          <div className="flex items-center gap-2 text-white/60">
            <Clock size={14} aria-hidden="true" />
            <span id="proactive-interval-label" className="text-xs font-medium">
              Proactive Check Interval
            </span>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="15"
              max="120"
              step="15"
              value={settings.proactiveInterval ?? 30}
              onChange={(e) => updateSettings({ proactiveInterval: parseInt(e.target.value) })}
              aria-labelledby="proactive-interval-label"
              aria-valuemin={15}
              aria-valuemax={120}
              aria-valuenow={settings.proactiveInterval ?? 30}
              aria-valuetext={`${settings.proactiveInterval ?? 30} seconds`}
              className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:shadow-md
                focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-white/60 text-sm font-mono w-16 text-right" aria-hidden="true">
              {settings.proactiveInterval ?? 30}s
            </span>
          </div>
        </section>
      )}

      {/* AI Settings */}
      <section aria-labelledby="ai-settings-heading">
        <h3 id="ai-settings-heading" className="text-white/70 text-sm font-medium mb-3">
          AI Settings
        </h3>
        <div className="space-y-3">
          {/* Model Selection */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-white/60" aria-hidden="true" />
              <label htmlFor="ai-model" className="text-white/80 text-sm font-medium">
                AI Model
              </label>
            </div>
            <select
              id="ai-model"
              value={settings.aiModel ?? 'claude-sonnet-4-20250514'}
              onChange={(e) => updateSettings({ aiModel: e.target.value as typeof settings.aiModel })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-describedby="ai-model-description"
            >
              <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Balanced)</option>
              <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fast)</option>
            </select>
            <p id="ai-model-description" className="text-white/30 text-xs mt-2">
              Sonnet offers better quality, Haiku is faster and more affordable.
            </p>
          </div>

          {/* Temperature */}
          <div
            className="p-4 rounded-xl space-y-4"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            <div className="flex items-center gap-2 text-white/60">
              <Thermometer size={18} aria-hidden="true" />
              <label id="temperature-label" className="text-sm font-medium text-white/80">
                Response Creativity
              </label>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-white/40">Precise</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.aiTemperature ?? 0.7}
                onChange={(e) => updateSettings({ aiTemperature: parseFloat(e.target.value) })}
                aria-labelledby="temperature-label"
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={settings.aiTemperature ?? 0.7}
                aria-valuetext={`${Math.round((settings.aiTemperature ?? 0.7) * 100)}% creativity`}
                className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-md
                  focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs text-white/40">Creative</span>
            </div>
            <p className="text-white/30 text-xs">
              Lower values give more predictable responses, higher values are more creative.
            </p>
          </div>
        </div>
      </section>

      {/* Voice Input */}
      <section aria-labelledby="voice-heading">
        <h3 id="voice-heading" className="text-white/70 text-sm font-medium mb-3">Voice Input</h3>
        <div className="space-y-2">
          <SettingRow
            settingId="voice-mode"
            icon={<Mic size={18} />}
            title="Voice Mode"
            description="Enable voice input for hands-free interaction with Pulse"
            enabled={settings.voiceEnabled ?? true}
            onToggle={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })}
          />
        </div>
      </section>

      {/* Notifications */}
      <section aria-labelledby="notifications-heading">
        <h3 id="notifications-heading" className="text-white/70 text-sm font-medium mb-3">
          Notifications
        </h3>
        <div className="space-y-2">
          <SettingRow
            settingId="notifications"
            icon={<Bell size={18} />}
            title="Notifications"
            description="Show system notifications for suggestions and alerts"
            enabled={settings.notificationsEnabled ?? true}
            onToggle={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
          />
          <SettingRow
            settingId="sound"
            icon={<Volume2 size={18} />}
            title="Sound Effects"
            description="Play sounds for notifications and interactions"
            enabled={settings.soundEnabled ?? true}
            onToggle={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
          />
        </div>
      </section>

      {/* Window Behavior */}
      <section aria-labelledby="window-heading">
        <h3 id="window-heading" className="text-white/70 text-sm font-medium mb-3">
          Window Behavior
        </h3>
        <div className="space-y-2">
          <SettingRow
            settingId="always-on-top"
            icon={<PinIcon size={18} />}
            title="Always on Top"
            description="Keep the Pulse window above other windows"
            enabled={settings.alwaysOnTop ?? true}
            onToggle={() => updateSettings({ alwaysOnTop: !settings.alwaysOnTop })}
          />
        </div>
      </section>

      {/* Startup */}
      <section aria-labelledby="startup-heading">
        <h3 id="startup-heading" className="text-white/70 text-sm font-medium mb-3">Startup</h3>
        <div className="space-y-2">
          <SettingRow
            settingId="launch-login"
            icon={<Zap size={18} />}
            title="Launch at Login"
            description="Automatically start Pulse when you log in"
            enabled={settings.launchAtLogin ?? false}
            onToggle={() => updateSettings({ launchAtLogin: !settings.launchAtLogin })}
          />
        </div>
      </section>

      {/* Privacy */}
      <section aria-labelledby="privacy-heading">
        <h3 id="privacy-heading" className="text-white/70 text-sm font-medium mb-3">Privacy</h3>
        <div className="space-y-2">
          <SettingRow
            settingId="analytics"
            icon={<Shield size={18} />}
            title="Usage Analytics"
            description="Help improve Pulse by sending anonymous usage data"
            enabled={settings.analyticsEnabled ?? false}
            onToggle={() => updateSettings({ analyticsEnabled: !settings.analyticsEnabled })}
          />
        </div>
      </section>

      {/* API Configuration */}
      <section aria-labelledby="api-heading">
        <h3 id="api-heading" className="text-white/70 text-sm font-medium mb-3">API Configuration</h3>
        <div
          className="p-4 rounded-xl"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <label htmlFor="api-key" className="text-white/60 text-xs mb-2 block">
            Claude API Key
          </label>
          <input
            id="api-key"
            type="password"
            value={settings.apiKey || ""}
            onChange={(e) => updateSettings({ apiKey: e.target.value })}
            placeholder="sk-ant-api03-..."
            autoComplete="off"
            aria-describedby="api-key-description"
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm font-mono placeholder:text-white/20
              focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p id="api-key-description" className="text-white/30 text-xs mt-2">
            Your API key is stored locally and never sent to our servers.
          </p>
        </div>
      </section>
    </div>
  )
}
