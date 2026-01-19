import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Keyboard, Command } from "lucide-react"

interface KeyboardShortcutsPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutGroup {
  title: string
  shortcuts: { keys: string[]; description: string }[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "General",
    shortcuts: [
      { keys: ["⌘", "⇧", "G"], description: "Toggle Pulse widget" },
      { keys: ["⌘", "⇧", "S"], description: "Capture screenshot" },
      { keys: ["⌘", "⇧", "V"], description: "Voice input mode" },
      { keys: ["Esc"], description: "Close widget / Cancel" },
    ]
  },
  {
    title: "Chat",
    shortcuts: [
      { keys: ["Enter"], description: "Send message" },
      { keys: ["⇧", "Enter"], description: "New line in message" },
      { keys: ["↑"], description: "Edit last message" },
      { keys: ["⌘", "K"], description: "Clear conversation" },
    ]
  },
  {
    title: "Commands",
    shortcuts: [
      { keys: ["/"], description: "Open command palette" },
      { keys: ["@"], description: "Insert context mention" },
      { keys: ["#"], description: "Add response formatting tag" },
      { keys: ["Tab"], description: "Accept command suggestion" },
    ]
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["⌘", "H"], description: "Open conversation history" },
      { keys: ["⌘", ","], description: "Open settings" },
      { keys: ["⌘", "N"], description: "New conversation" },
      { keys: ["↑", "↓"], description: "Navigate suggestions" },
    ]
  }
]

export function KeyboardShortcutsPanel({ isOpen, onClose }: KeyboardShortcutsPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                       md:w-[500px] md:max-h-[80vh] z-50 overflow-hidden rounded-2xl"
            style={{
              background: "rgba(20, 20, 25, 0.98)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)"
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20">
                  <Keyboard size={18} className="text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-6">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                    {group.title}
                  </h3>
                  <div className="space-y-2">
                    {group.shortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                      >
                        <span className="text-sm text-white/70">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <kbd
                              key={keyIndex}
                              className="px-2 py-1 rounded bg-white/10 text-white/80 text-xs font-mono min-w-[24px] text-center"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <Command size={12} />
                <span>Press ? anytime to show this panel</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
