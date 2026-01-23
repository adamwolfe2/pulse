/**
 * Settings Window Component
 *
 * Accessibility: Implements WCAG 2.1 AA compliance with focus trapping,
 * ARIA labels, and keyboard navigation support.
 */

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Settings,
  Palette,
  Keyboard,
  Zap,
  Info,
  X,
  Monitor,
  Mic,
  Eye
} from "lucide-react"
import { usePulseStore } from "../../stores/pulseStore"
import { Logo } from "../Logo"
import { AccentColorConfig } from "./AccentColorConfig"
import { KeybindsConfig } from "./KeybindsConfig"
import { BehaviorConfig } from "./BehaviorConfig"
import { AboutSection } from "./AboutSection"
import { useReducedMotion, useEscapeKey } from "../../hooks/useAccessibility"
import { ANIMATIONS } from "../../../shared/constants"

interface SettingsWindowProps {
  isOpen: boolean
  onClose: () => void
}

type SettingsTab = "behavior" | "appearance" | "keybinds" | "about"

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "behavior", label: "Behavior", icon: <Zap size={18} /> },
  { id: "appearance", label: "Appearance", icon: <Palette size={18} /> },
  { id: "keybinds", label: "Keybinds", icon: <Keyboard size={18} /> },
  { id: "about", label: "About", icon: <Info size={18} /> },
]

export function SettingsWindow({ isOpen, onClose }: SettingsWindowProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("behavior")
  const { settings } = usePulseStore()
  const prefersReducedMotion = useReducedMotion()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEscapeKey(onClose, isOpen)

  // Focus trap and focus restoration
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const previousActiveElement = document.activeElement as HTMLElement
      dialogRef.current.focus()

      return () => {
        previousActiveElement?.focus()
      }
    }
  }, [isOpen])

  const animationProps = prefersReducedMotion
    ? {}
    : { type: "spring" as const, damping: 25, stiffness: 300 }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? {} : { opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          <motion.div
            ref={dialogRef}
            initial={prefersReducedMotion ? {} : { scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={prefersReducedMotion ? {} : { scale: 0.95, opacity: 0 }}
            transition={animationProps}
            onClick={(e) => e.stopPropagation()}
            className="w-[720px] h-[520px] rounded-2xl overflow-hidden flex"
            tabIndex={-1}
            style={{
              background: "rgba(30, 30, 30, 0.85)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Sidebar */}
            <div
              className="w-[200px] flex flex-col py-4 px-3"
              style={{
                background: "rgba(0, 0, 0, 0.2)",
                borderRight: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              {/* App Title */}
              <div className="px-3 mb-6 flex items-center gap-3">
                <Logo size={32} />
                <div>
                  <h1 id="settings-title" className="text-white/90 font-semibold text-lg">Pulse</h1>
                  <p className="text-white/40 text-xs">Settings</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-1" role="tablist" aria-label="Settings navigation">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                      transition-all duration-150
                      ${activeTab === tab.id
                        ? "text-white"
                        : "text-white/50 hover:text-white/70 hover:bg-white/5"
                      }
                    `}
                    style={activeTab === tab.id ? {
                      background: `linear-gradient(135deg, ${settings.accentColor || "#6366f1"}, ${settings.accentColor2 || "#8b5cf6"})`,
                    } : {}}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`${tab.id}-panel`}
                    id={`${tab.id}-tab`}
                  >
                    <span aria-hidden="true">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>

              {/* Version */}
              <div className="px-3 pt-4 border-t border-white/5">
                <p className="text-white/30 text-xs">Version 0.2.0</p>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h2 className="text-white/90 font-medium">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
                  aria-label="Close settings"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              {/* Content Area */}
              <div
                className="flex-1 overflow-y-auto p-6"
                role="tabpanel"
                id={`${activeTab}-panel`}
                aria-labelledby={`${activeTab}-tab`}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={prefersReducedMotion ? {} : { opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                  >
                    {activeTab === "behavior" && <BehaviorConfig />}
                    {activeTab === "appearance" && <AccentColorConfig />}
                    {activeTab === "keybinds" && <KeybindsConfig />}
                    {activeTab === "about" && <AboutSection />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
