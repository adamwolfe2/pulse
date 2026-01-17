import { motion } from "framer-motion"
import { useRef, useEffect } from "react"
import { GlassPanel } from "./GlassPanel"
import { ActionButton } from "./ActionButton"
import type { Suggestion } from "../types"

interface SuggestionCardProps {
  suggestion: Suggestion
  onDismiss: () => void
  onAction: (actionId: string) => void
}

export function SuggestionCard({ suggestion, onDismiss, onAction }: SuggestionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  // Enable mouse events for the card area
  useEffect(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      window.ghostbar?.setSuggestionArea({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      })
    }

    return () => {
      window.ghostbar?.setSuggestionArea(null)
    }
  }, [suggestion])

  return (
    <motion.div
      ref={cardRef}
      className="pointer-events-auto flex flex-col items-center gap-4"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
    >
      {/* Main message bubble */}
      <GlassPanel className="px-6 py-4 max-w-md">
        <p className="text-white text-lg font-medium text-center leading-relaxed">
          {suggestion.title}
        </p>
      </GlassPanel>

      {/* Detail card with rich content */}
      {suggestion.detail && (
        <GlassPanel className="p-4 max-w-sm">
          <div className="flex items-start gap-4">
            {/* Thumbnail/Icon */}
            {suggestion.thumbnail && (
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/10">
                  {suggestion.thumbnail.type === "image" ? (
                    <img
                      src={suggestion.thumbnail.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : suggestion.thumbnail.type === "icon" ? (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      {suggestion.thumbnail.icon}
                    </div>
                  ) : suggestion.thumbnail.type === "map" ? (
                    <div className="w-full h-full bg-gradient-to-br from-cyan-400/30 to-blue-500/30 flex items-center justify-center">
                      <span className="text-2xl">🗺️</span>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              {suggestion.detail.subtitle && (
                <p className="text-white/60 text-sm mb-1">
                  {suggestion.detail.subtitle}
                </p>
              )}
              <h3 className="text-white text-base font-semibold mb-1 truncate">
                {suggestion.detail.title}
              </h3>
              {suggestion.detail.description && (
                <p className="text-white/70 text-sm">
                  {suggestion.detail.description}
                </p>
              )}

              {/* Meta info row */}
              {suggestion.detail.meta && (
                <div className="flex items-center gap-3 mt-2">
                  {suggestion.detail.meta.map((item, i) => (
                    <span
                      key={i}
                      className="text-white/60 text-sm flex items-center gap-1"
                    >
                      {item.icon && <span>{item.icon}</span>}
                      {item.text}
                    </span>
                  ))}
                </div>
              )}

              {/* Inline action button */}
              {suggestion.detail.inlineAction && (
                <div className="mt-3">
                  <ActionButton
                    action={suggestion.detail.inlineAction}
                    onClick={() => onAction(suggestion.detail!.inlineAction!.id)}
                    variant="inline"
                  />
                </div>
              )}
            </div>

            {/* Side action (like play button, call button) */}
            {suggestion.detail.sideAction && (
              <button
                className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30
                         flex items-center justify-center transition-colors"
                onClick={() => onAction(suggestion.detail!.sideAction!.id)}
              >
                <span className="text-white text-xl">
                  {suggestion.detail.sideAction.icon}
                </span>
              </button>
            )}
          </div>
        </GlassPanel>
      )}

      {/* Action hint */}
      {suggestion.hint && (
        <motion.p
          className="text-white/50 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {suggestion.hint}
        </motion.p>
      )}

      {/* Action buttons row */}
      {suggestion.actions && suggestion.actions.length > 0 && (
        <div className="flex items-center gap-3 mt-2">
          {suggestion.actions.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              onClick={() => onAction(action.id)}
            />
          ))}
        </div>
      )}

      {/* Dismiss hint */}
      <motion.p
        className="text-white/30 text-xs mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Press ESC to dismiss
      </motion.p>
    </motion.div>
  )
}
