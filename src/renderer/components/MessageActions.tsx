import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Check, RefreshCw, ThumbsUp, ThumbsDown, MoreHorizontal } from "lucide-react"

interface MessageActionsProps {
  content: string
  messageId: string
  isAssistant: boolean
  onRegenerate?: () => void
  onFeedback?: (type: "positive" | "negative") => void
  className?: string
}

export function MessageActions({
  content,
  messageId,
  isAssistant,
  onRegenerate,
  onFeedback,
  className = ""
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null)
  const [showMore, setShowMore] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleFeedback = (type: "positive" | "negative") => {
    setFeedback(type)
    onFeedback?.(type)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center gap-1 ${className}`}
    >
      {/* Copy button */}
      <ActionButton
        onClick={handleCopy}
        icon={copied ? <Check size={14} /> : <Copy size={14} />}
        label={copied ? "Copied!" : "Copy"}
        active={copied}
        activeColor="text-green-400"
      />

      {/* Assistant-only actions */}
      {isAssistant && (
        <>
          {/* Regenerate */}
          {onRegenerate && (
            <ActionButton
              onClick={onRegenerate}
              icon={<RefreshCw size={14} />}
              label="Regenerate"
            />
          )}

          {/* Feedback buttons */}
          {onFeedback && (
            <>
              <ActionButton
                onClick={() => handleFeedback("positive")}
                icon={<ThumbsUp size={14} />}
                label="Good response"
                active={feedback === "positive"}
                activeColor="text-green-400"
              />
              <ActionButton
                onClick={() => handleFeedback("negative")}
                icon={<ThumbsDown size={14} />}
                label="Poor response"
                active={feedback === "negative"}
                activeColor="text-red-400"
              />
            </>
          )}
        </>
      )}

      {/* More options */}
      <div className="relative">
        <ActionButton
          onClick={() => setShowMore(!showMore)}
          icon={<MoreHorizontal size={14} />}
          label="More"
        />

        <AnimatePresence>
          {showMore && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMore(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                className="absolute right-0 bottom-full mb-1 z-50 py-1 rounded-lg min-w-[120px]"
                style={{
                  background: "rgba(30, 30, 35, 0.98)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.5)"
                }}
              >
                <MoreMenuItem
                  onClick={() => {
                    // Share functionality placeholder
                    setShowMore(false)
                  }}
                  label="Share message"
                />
                <MoreMenuItem
                  onClick={() => {
                    // Copy as markdown
                    navigator.clipboard.writeText(`\`\`\`\n${content}\n\`\`\``)
                    setShowMore(false)
                  }}
                  label="Copy as code block"
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function ActionButton({
  onClick,
  icon,
  label,
  active = false,
  activeColor = "text-indigo-400"
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  active?: boolean
  activeColor?: string
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? `${activeColor} bg-white/10`
          : "text-white/40 hover:text-white/70 hover:bg-white/5"
      }`}
      title={label}
    >
      {icon}
    </motion.button>
  )
}

function MoreMenuItem({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-2 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
    >
      {label}
    </button>
  )
}

// Inline copy button for code blocks
export function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  return (
    <motion.button
      onClick={handleCopy}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all
        ${copied
          ? "bg-green-500/20 text-green-400"
          : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
        }`}
    >
      {copied ? (
        <>
          <Check size={12} />
          Copied!
        </>
      ) : (
        <>
          <Copy size={12} />
          Copy
        </>
      )}
    </motion.button>
  )
}
