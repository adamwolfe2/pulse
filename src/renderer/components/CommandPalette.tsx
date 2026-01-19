import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Command, Hash, AtSign, Slash, ArrowRight } from "lucide-react"
import { getCommandSuggestions, type Command as CommandType } from "../lib/commands"

interface CommandPaletteProps {
  input: string
  isVisible: boolean
  onSelect: (command: CommandType, args: string) => void
  onClose: () => void
}

export function CommandPalette({ input, isVisible, onSelect, onClose }: CommandPaletteProps) {
  const [suggestions, setSuggestions] = useState<CommandType[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && input) {
      const cmds = getCommandSuggestions(input, 6)
      setSuggestions(cmds)
      setSelectedIndex(0)
    } else {
      setSuggestions([])
    }
  }, [input, isVisible])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || suggestions.length === 0) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % suggestions.length)
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
          break
        case "Tab":
        case "Enter":
          if (suggestions[selectedIndex]) {
            e.preventDefault()
            const cmd = suggestions[selectedIndex]
            const args = input.slice(cmd.name.length + 1).trim()
            onSelect(cmd, args)
          }
          break
        case "Escape":
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isVisible, suggestions, selectedIndex, input, onSelect, onClose])

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current
    if (list && suggestions.length > 0) {
      const item = list.children[selectedIndex] as HTMLElement
      if (item) {
        item.scrollIntoView({ block: "nearest" })
      }
    }
  }, [selectedIndex])

  const getPrefixIcon = (prefix: "/" | "@" | "#") => {
    switch (prefix) {
      case "/": return <Slash size={14} className="text-indigo-400" />
      case "@": return <AtSign size={14} className="text-green-400" />
      case "#": return <Hash size={14} className="text-purple-400" />
    }
  }

  if (!isVisible || suggestions.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute bottom-full left-0 right-0 mb-2 mx-2 overflow-hidden rounded-xl"
        style={{
          background: "rgba(25, 25, 30, 0.98)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 -10px 40px -10px rgba(0, 0, 0, 0.5)"
        }}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
          <Command size={14} className="text-white/40" />
          <span className="text-xs text-white/50">Quick Commands</span>
          <span className="text-xs text-white/30 ml-auto">↑↓ to navigate • Enter to select</span>
        </div>

        {/* Suggestions list */}
        <div ref={listRef} className="max-h-[200px] overflow-y-auto py-1">
          {suggestions.map((cmd, index) => (
            <button
              key={cmd.id}
              onClick={() => {
                const args = input.slice(cmd.name.length + 1).trim()
                onSelect(cmd, args)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                ${index === selectedIndex
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5"
                }`}
            >
              <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                {getPrefixIcon(cmd.prefix)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {cmd.prefix}{cmd.name}
                  </span>
                  {cmd.aliases && cmd.aliases.length > 0 && (
                    <span className="text-xs text-white/30">
                      ({cmd.aliases.map(a => cmd.prefix + a).join(", ")})
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/40 truncate">{cmd.description}</p>
              </div>
              {index === selectedIndex && (
                <ArrowRight size={14} className="text-white/40" />
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Inline command hint that shows while typing
export function CommandHint({ input }: { input: string }) {
  const suggestions = getCommandSuggestions(input, 1)
  const suggestion = suggestions[0]

  if (!suggestion || !input.trim()) return null

  const prefix = input.charAt(0)
  const typed = input.slice(1).toLowerCase()
  const remaining = suggestion.name.slice(typed.length)

  if (!suggestion.name.startsWith(typed)) return null

  return (
    <span className="text-white/20 pointer-events-none">
      {remaining}
    </span>
  )
}
