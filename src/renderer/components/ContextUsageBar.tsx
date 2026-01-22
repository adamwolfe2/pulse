import React from "react"
import { motion } from "framer-motion"
import { AlertCircle } from "lucide-react"
import { getContextUsage } from "../lib/contextWindow"

interface ContextUsageBarProps {
  messages: Array<{ role: string; content: string }>
  modelId: string
  systemPrompt: string
  className?: string
}

export function ContextUsageBar({
  messages,
  modelId,
  systemPrompt,
  className = ""
}: ContextUsageBarProps) {
  const usage = getContextUsage(
    messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    modelId,
    systemPrompt
  )

  // Only show when usage is above 50%
  if (usage.percentage < 50) return null

  const getBarColor = () => {
    if (usage.percentage >= 90) return "bg-red-500"
    if (usage.percentage >= 75) return "bg-orange-500"
    if (usage.percentage >= 50) return "bg-yellow-500"
    return "bg-green-500"
  }

  const isWarning = usage.percentage >= 75

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={`px-3 py-1.5 ${className}`}
    >
      <div className="flex items-center gap-2">
        {isWarning && (
          <AlertCircle size={12} className="text-orange-400 flex-shrink-0" />
        )}
        <div className="flex-1">
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className={`h-full ${getBarColor()}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(usage.percentage, 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
        <span className="text-[10px] text-white/40 flex-shrink-0">
          {usage.percentage}% context
        </span>
      </div>
      {isWarning && (
        <p className="text-[9px] text-white/30 mt-0.5">
          {usage.percentage >= 90
            ? "Context nearly full - older messages will be trimmed"
            : "Context filling up"
          }
        </p>
      )}
    </motion.div>
  )
}

// Compact version for header/footer
export function ContextUsageIndicator({
  messages,
  modelId,
  systemPrompt
}: Omit<ContextUsageBarProps, "className">) {
  const usage = getContextUsage(
    messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    modelId,
    systemPrompt
  )

  // Only show when usage is above 40%
  if (usage.percentage < 40) return null

  const getColor = () => {
    if (usage.percentage >= 90) return "text-red-400"
    if (usage.percentage >= 75) return "text-orange-400"
    if (usage.percentage >= 50) return "text-yellow-400"
    return "text-white/40"
  }

  return (
    <span
      className={`text-[10px] ${getColor()}`}
      title={`Context usage: ${usage.used.toLocaleString()} / ${usage.available.toLocaleString()} tokens`}
    >
      {usage.percentage}%
    </span>
  )
}
