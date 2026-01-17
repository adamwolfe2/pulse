import React from "react"
import { ExternalLink, Github, Heart, Coffee } from "lucide-react"

export function AboutSection() {
  return (
    <div className="space-y-6">
      {/* App Info */}
      <section className="text-center py-6">
        <div
          className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-3xl font-bold text-white mb-4"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            boxShadow: "0 10px 30px -10px rgba(99, 102, 241, 0.5)",
          }}
        >
          G
        </div>
        <h2 className="text-white/90 text-xl font-semibold">GhostBar</h2>
        <p className="text-white/40 text-sm mt-1">Your AI Desktop Companion</p>
        <p className="text-white/30 text-xs mt-2">Version 0.2.0</p>
      </section>

      {/* Description */}
      <section
        className="p-4 rounded-xl"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <p className="text-white/60 text-sm leading-relaxed">
          GhostBar is an intelligent AI assistant that floats above your desktop,
          ready to help with anything on your screen. Powered by Claude, it can
          see your screen, answer questions, and assist with tasks - all through
          a beautiful glassmorphic interface.
        </p>
      </section>

      {/* Features */}
      <section>
        <h3 className="text-white/70 text-sm font-medium mb-3">Features</h3>
        <ul className="space-y-2 text-white/50 text-sm">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Screen capture with AI vision analysis
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Voice input for hands-free interaction
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Proactive assistance mode
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
            Global keyboard shortcuts
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            Beautiful glassmorphic UI
          </li>
        </ul>
      </section>

      {/* Links */}
      <section>
        <h3 className="text-white/70 text-sm font-medium mb-3">Links</h3>
        <div className="space-y-2">
          <a
            href="#"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            <div className="flex items-center gap-3">
              <Github size={18} className="text-white/40" />
              <span className="text-white/60 text-sm">GitHub Repository</span>
            </div>
            <ExternalLink size={14} className="text-white/20 group-hover:text-white/40" />
          </a>
          <a
            href="#"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            <div className="flex items-center gap-3">
              <Coffee size={18} className="text-white/40" />
              <span className="text-white/60 text-sm">Buy Me a Coffee</span>
            </div>
            <ExternalLink size={14} className="text-white/20 group-hover:text-white/40" />
          </a>
        </div>
      </section>

      {/* Credits */}
      <section className="pt-4 border-t border-white/5 text-center">
        <p className="text-white/30 text-xs flex items-center justify-center gap-1">
          Made with <Heart size={12} className="text-red-400" /> by adamwolfe2
        </p>
        <p className="text-white/20 text-xs mt-1">
          Powered by Claude AI
        </p>
      </section>
    </div>
  )
}
