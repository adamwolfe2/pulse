import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Check, Plus, Pencil, Trash2, User } from "lucide-react"
import {
  getAllPersonas,
  getActivePersona,
  setActivePersonaId,
  saveCustomPersona,
  deleteCustomPersona,
  type Persona
} from "../lib/personas"

interface PersonaSelectorProps {
  onPersonaChange?: (persona: Persona) => void
  compact?: boolean
  className?: string
}

export function PersonaSelector({
  onPersonaChange,
  compact = false,
  className = ""
}: PersonaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [activePersona, setActivePersona] = useState<Persona | null>(null)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load personas on mount
  useEffect(() => {
    setPersonas(getAllPersonas())
    setActivePersona(getActivePersona())
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setShowCustomForm(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelectPersona = (persona: Persona) => {
    setActivePersonaId(persona.id)
    setActivePersona(persona)
    onPersonaChange?.(persona)
    setIsOpen(false)
  }

  const handleDeletePersona = (e: React.MouseEvent, personaId: string) => {
    e.stopPropagation()
    if (confirm("Delete this custom persona?")) {
      deleteCustomPersona(personaId)
      setPersonas(getAllPersonas())
      if (activePersona?.id === personaId) {
        const defaultPersona = getAllPersonas()[0]
        setActivePersona(defaultPersona)
        onPersonaChange?.(defaultPersona)
      }
    }
  }

  if (!activePersona) return null

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-lg transition-colors
          ${compact
            ? "px-2 py-1 text-xs bg-white/5 hover:bg-white/10"
            : "px-3 py-1.5 text-sm bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]"
          }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-base">{activePersona.icon}</span>
        {!compact && (
          <span className="text-white/80 font-medium truncate max-w-[100px]">
            {activePersona.name}
          </span>
        )}
        <ChevronDown
          size={compact ? 12 : 14}
          className={`text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 z-50 min-w-[280px] max-h-[400px] overflow-y-auto
                       rounded-xl border border-white/10 shadow-2xl"
            style={{
              background: "rgba(20, 20, 25, 0.98)",
              backdropFilter: "blur(20px)"
            }}
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/50 uppercase tracking-wide">
                  AI Persona
                </span>
                <button
                  onClick={() => setShowCustomForm(!showCustomForm)}
                  className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
                  title="Create custom persona"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Custom Persona Form */}
            <AnimatePresence>
              {showCustomForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-white/5"
                >
                  <CustomPersonaForm
                    onSave={(persona) => {
                      setPersonas(getAllPersonas())
                      setShowCustomForm(false)
                      handleSelectPersona(persona)
                    }}
                    onCancel={() => setShowCustomForm(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Persona List */}
            <div className="py-1">
              {personas.map((persona) => (
                <motion.button
                  key={persona.id}
                  onClick={() => handleSelectPersona(persona)}
                  className={`w-full px-3 py-2 flex items-start gap-3 text-left transition-colors
                    ${persona.id === activePersona.id
                      ? "bg-indigo-500/10"
                      : "hover:bg-white/5"
                    }`}
                  whileHover={{ x: 2 }}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{persona.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white">
                        {persona.name}
                      </span>
                      {persona.id === activePersona.id && (
                        <Check size={14} className="text-indigo-400" />
                      )}
                      {persona.isCustom && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white/50">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
                      {persona.description}
                    </p>
                  </div>
                  {persona.isCustom && (
                    <button
                      onClick={(e) => handleDeletePersona(e, persona.id)}
                      className="p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Footer hint */}
            <div className="px-3 py-2 border-t border-white/5">
              <p className="text-[10px] text-white/30">
                Personas customize how Pulse responds to you
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Custom Persona Form Component
function CustomPersonaForm({
  onSave,
  onCancel
}: {
  onSave: (persona: Persona) => void
  onCancel: () => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("🤖")
  const [systemPrompt, setSystemPrompt] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !systemPrompt.trim()) return

    const persona = saveCustomPersona({
      name: name.trim(),
      description: description.trim() || `Custom persona: ${name}`,
      icon,
      systemPrompt: systemPrompt.trim(),
      temperature: 0.7
    })

    onSave(persona)
  }

  const emojiOptions = ["🤖", "🧠", "💡", "🎯", "🚀", "🔮", "⭐", "🌟", "💫", "🎨"]

  return (
    <form onSubmit={handleSubmit} className="p-3 space-y-3">
      <div>
        <label className="text-xs text-white/50 block mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Custom Assistant"
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10
                     text-sm text-white placeholder-white/30
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          required
        />
      </div>

      <div>
        <label className="text-xs text-white/50 block mb-1">Icon</label>
        <div className="flex gap-1 flex-wrap">
          {emojiOptions.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIcon(emoji)}
              className={`p-2 rounded-lg text-lg transition-colors
                ${icon === emoji ? "bg-indigo-500/20 ring-1 ring-indigo-500/50" : "hover:bg-white/5"}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-white/50 block mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this persona"
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10
                     text-sm text-white placeholder-white/30
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>

      <div>
        <label className="text-xs text-white/50 block mb-1">System Prompt</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Instructions for how the AI should behave..."
          rows={4}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10
                     text-sm text-white placeholder-white/30 resize-none
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          required
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white
                     bg-indigo-500 hover:bg-indigo-600 transition-colors"
        >
          Create Persona
        </button>
      </div>
    </form>
  )
}

// Compact persona indicator for minimal UI
export function PersonaIndicator({ className = "" }: { className?: string }) {
  const [persona, setPersona] = useState<Persona | null>(null)

  useEffect(() => {
    setPersona(getActivePersona())
  }, [])

  if (!persona) return null

  return (
    <div
      className={`flex items-center gap-1 text-xs text-white/40 ${className}`}
      title={`Using ${persona.name} persona`}
    >
      <span>{persona.icon}</span>
      <span className="truncate max-w-[60px]">{persona.name}</span>
    </div>
  )
}
