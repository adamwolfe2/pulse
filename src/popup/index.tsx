import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useGhostStore } from "~/stores/ghostStore"
import { useDarkMode } from "~/hooks/useDarkMode"
import { Button } from "~/components/shared/Button"
import { AnimatedIcon } from "~/components/shared/AnimatedIcon"
import type { TriggerType } from "~/types"
import "~/styles/global.css"

type Tab = "settings" | "history" | "triggers"

function Popup() {
  const [activeTab, setActiveTab] = useState<Tab>("settings")
  const isDark = useDarkMode()
  const {
    settings,
    updateSettings,
    toggleDarkMode,
    toggleTrigger,
    suggestionHistory,
    clearHistory
  } = useGhostStore()

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "settings", icon: "⚙️", label: "Settings" },
    { id: "triggers", icon: "🎯", label: "Triggers" },
    { id: "history", icon: "📜", label: "History" }
  ]

  return (
    <div
      className={`
        w-80 min-h-96
        ${isDark ? "bg-ghost-900 text-white" : "bg-white text-ghost-900"}
      `}
    >
      {/* Header */}
      <div
        className={`
          flex items-center gap-2 p-4 border-b
          ${isDark ? "border-white/10" : "border-ghost-200"}
        `}
      >
        <AnimatedIcon icon="👻" size="lg" />
        <div>
          <h1 className="font-bold">GhostBar</h1>
          <p
            className={`
              text-xs
              ${isDark ? "text-white/60" : "text-ghost-500"}
            `}
          >
            AI Browser Companion
          </p>
        </div>
        <div className="ml-auto">
          <Button
            variant={settings.enabled ? "primary" : "ghost"}
            size="sm"
            onClick={() => updateSettings({ enabled: !settings.enabled })}
          >
            {settings.enabled ? "On" : "Off"}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className={`
          flex border-b
          ${isDark ? "border-white/10" : "border-ghost-200"}
        `}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`
              flex-1 py-2 text-xs font-medium
              transition-colors duration-200
              ${
                activeTab === tab.id
                  ? isDark
                    ? "text-white border-b-2 border-white"
                    : "text-ghost-900 border-b-2 border-ghost-900"
                  : isDark
                    ? "text-white/50 hover:text-white/80"
                    : "text-ghost-400 hover:text-ghost-600"
              }
            `}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="p-4"
        >
          {activeTab === "settings" && (
            <SettingsTab
              settings={settings}
              updateSettings={updateSettings}
              toggleDarkMode={toggleDarkMode}
              isDark={isDark}
            />
          )}
          {activeTab === "triggers" && (
            <TriggersTab
              settings={settings}
              toggleTrigger={toggleTrigger}
              isDark={isDark}
            />
          )}
          {activeTab === "history" && (
            <HistoryTab
              history={suggestionHistory}
              clearHistory={clearHistory}
              isDark={isDark}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Settings Tab Component
interface SettingsTabProps {
  settings: ReturnType<typeof useGhostStore>["settings"]
  updateSettings: ReturnType<typeof useGhostStore>["updateSettings"]
  toggleDarkMode: ReturnType<typeof useGhostStore>["toggleDarkMode"]
  isDark: boolean
}

function SettingsTab({
  settings,
  updateSettings,
  toggleDarkMode,
  isDark
}: SettingsTabProps) {
  return (
    <div className="space-y-4">
      {/* API Key */}
      <div>
        <label
          className={`
            block text-xs font-medium mb-1
            ${isDark ? "text-white/80" : "text-ghost-700"}
          `}
        >
          Claude API Key
        </label>
        <input
          type="password"
          value={settings.apiKey}
          onChange={(e) => updateSettings({ apiKey: e.target.value })}
          className={`
            w-full px-2 py-1.5 rounded text-xs
            ${
              isDark
                ? "bg-white/10 text-white border-white/20"
                : "bg-ghost-50 text-ghost-900 border-ghost-200"
            }
            border focus:outline-none focus:ring-1 focus:ring-blue-500
          `}
        />
      </div>

      {/* Theme */}
      <div className="flex items-center justify-between">
        <span
          className={`
            text-sm
            ${isDark ? "text-white/80" : "text-ghost-700"}
          `}
        >
          Dark Mode
        </span>
        <button
          className={`
            w-12 h-6 rounded-full relative transition-colors
            ${
              settings.darkMode === "dark"
                ? "bg-ghost-600"
                : isDark
                  ? "bg-white/20"
                  : "bg-ghost-200"
            }
          `}
          onClick={toggleDarkMode}
        >
          <motion.div
            className={`
              w-5 h-5 rounded-full absolute top-0.5
              ${isDark ? "bg-white" : "bg-ghost-900"}
            `}
            animate={{ left: settings.darkMode === "dark" ? "26px" : "2px" }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Position */}
      <div>
        <label
          className={`
            block text-xs font-medium mb-2
            ${isDark ? "text-white/80" : "text-ghost-700"}
          `}
        >
          Bar Position
        </label>
        <div className="flex gap-2">
          {(["top", "bottom"] as const).map((pos) => (
            <button
              key={pos}
              className={`
                flex-1 py-1.5 text-xs rounded capitalize
                ${
                  settings.position === pos
                    ? isDark
                      ? "bg-white/20 text-white"
                      : "bg-ghost-900 text-white"
                    : isDark
                      ? "bg-white/5 text-white/60"
                      : "bg-ghost-100 text-ghost-600"
                }
              `}
              onClick={() => updateSettings({ position: pos })}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Triggers Tab Component
interface TriggersTabProps {
  settings: ReturnType<typeof useGhostStore>["settings"]
  toggleTrigger: (trigger: TriggerType) => void
  isDark: boolean
}

function TriggersTab({ settings, toggleTrigger, isDark }: TriggersTabProps) {
  const triggers: { id: TriggerType; icon: string; label: string }[] = [
    { id: "github_repo", icon: "📦", label: "GitHub Repos" },
    { id: "long_article", icon: "📄", label: "Long Articles" },
    { id: "shopping", icon: "🛒", label: "Shopping" },
    { id: "clipboard_code", icon: "💻", label: "Code Clipboard" },
    { id: "documentation", icon: "📚", label: "Documentation" },
    { id: "video", icon: "🎬", label: "Videos" },
    { id: "news", icon: "📰", label: "News" }
  ]

  return (
    <div className="space-y-2">
      {triggers.map((trigger) => (
        <div
          key={trigger.id}
          className={`
            flex items-center justify-between p-2 rounded
            ${isDark ? "bg-white/5" : "bg-ghost-50"}
          `}
        >
          <div className="flex items-center gap-2">
            <span>{trigger.icon}</span>
            <span className="text-sm">{trigger.label}</span>
          </div>
          <button
            className={`
              w-10 h-5 rounded-full relative transition-colors
              ${
                settings.triggers[trigger.id]
                  ? "bg-green-500"
                  : isDark
                    ? "bg-white/20"
                    : "bg-ghost-200"
              }
            `}
            onClick={() => toggleTrigger(trigger.id)}
          >
            <motion.div
              className="w-4 h-4 rounded-full bg-white absolute top-0.5"
              animate={{
                left: settings.triggers[trigger.id] ? "22px" : "2px"
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      ))}
    </div>
  )
}

// History Tab Component
interface HistoryTabProps {
  history: ReturnType<typeof useGhostStore>["suggestionHistory"]
  clearHistory: ReturnType<typeof useGhostStore>["clearHistory"]
  isDark: boolean
}

function HistoryTab({ history, clearHistory, isDark }: HistoryTabProps) {
  if (history.length === 0) {
    return (
      <div
        className={`
          text-center py-8
          ${isDark ? "text-white/40" : "text-ghost-400"}
        `}
      >
        <p className="text-2xl mb-2">📭</p>
        <p className="text-sm">No suggestions yet</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span
          className={`
            text-xs
            ${isDark ? "text-white/60" : "text-ghost-500"}
          `}
        >
          Recent suggestions
        </span>
        <button
          className={`
            text-xs
            ${isDark ? "text-white/40 hover:text-white/60" : "text-ghost-400 hover:text-ghost-600"}
          `}
          onClick={clearHistory}
        >
          Clear
        </button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {history.slice(0, 10).map((item) => (
          <div
            key={item.id}
            className={`
              p-2 rounded text-xs
              ${isDark ? "bg-white/5" : "bg-ghost-50"}
            `}
          >
            <p
              className={`
                font-medium truncate
                ${isDark ? "text-white" : "text-ghost-900"}
              `}
            >
              {item.title}
            </p>
            <p
              className={`
                truncate mt-0.5
                ${isDark ? "text-white/50" : "text-ghost-500"}
              `}
            >
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Popup
