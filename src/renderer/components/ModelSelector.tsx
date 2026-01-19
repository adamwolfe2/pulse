import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Zap, Brain, Sparkles, Check } from "lucide-react"
import {
  AVAILABLE_MODELS,
  getModelById,
  getCostTierLabel,
  getSpeedLabel,
  type AIModel
} from "../lib/models"

interface ModelSelectorProps {
  selectedModelId: string
  onSelectModel: (modelId: string) => void
  compact?: boolean
}

export function ModelSelector({ selectedModelId, onSelectModel, compact = false }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedModel = getModelById(selectedModelId) || AVAILABLE_MODELS[0]

  const getModelIcon = (model: AIModel) => {
    if (model.name.includes("Opus")) return <Brain size={16} />
    if (model.name.includes("Haiku")) return <Zap size={16} />
    return <Sparkles size={16} />
  }

  const getModelColor = (model: AIModel) => {
    if (model.name.includes("Opus")) return "text-purple-400"
    if (model.name.includes("Haiku")) return "text-green-400"
    return "text-indigo-400"
  }

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10
                   text-white/60 hover:text-white text-xs transition-colors"
        >
          <span className={getModelColor(selectedModel)}>
            {getModelIcon(selectedModel)}
          </span>
          <span className="max-w-[80px] truncate">{selectedModel.name.split(" ").pop()}</span>
          <ChevronDown size={12} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1 z-50 py-1 rounded-xl min-w-[220px]"
                style={{
                  background: "rgba(25, 25, 30, 0.98)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.5)"
                }}
              >
                {AVAILABLE_MODELS.map(model => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelectModel(model.id)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors
                      ${model.id === selectedModelId
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:bg-white/5"
                      }`}
                  >
                    <span className={getModelColor(model)}>
                      {getModelIcon(model)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{model.name}</div>
                      <div className="text-xs text-white/40 flex items-center gap-2">
                        <span>{getSpeedLabel(model.speed)}</span>
                        <span>·</span>
                        <span>{getCostTierLabel(model.costTier)}</span>
                      </div>
                    </div>
                    {model.id === selectedModelId && (
                      <Check size={14} className="text-indigo-400" />
                    )}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Full size version
  return (
    <div className="space-y-2">
      <label className="block text-sm text-white/60 font-medium">AI Model</label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10
                   border border-white/10 text-left transition-colors"
        >
          <span className={getModelColor(selectedModel)}>
            {getModelIcon(selectedModel)}
          </span>
          <div className="flex-1">
            <div className="text-white font-medium">{selectedModel.name}</div>
            <div className="text-xs text-white/40">{selectedModel.description}</div>
          </div>
          <ChevronDown
            size={16}
            className={`text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-2 z-50 py-2 rounded-xl overflow-hidden"
                style={{
                  background: "rgba(25, 25, 30, 0.98)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.5)"
                }}
              >
                {AVAILABLE_MODELS.map(model => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelectModel(model.id)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                      ${model.id === selectedModelId
                        ? "bg-white/10"
                        : "hover:bg-white/5"
                      }`}
                  >
                    <span className={getModelColor(model)}>
                      {getModelIcon(model)}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{model.name}</span>
                        {model.default && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-400">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">{model.description}</div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-white/30 flex items-center gap-1">
                          <Zap size={10} /> {getSpeedLabel(model.speed)}
                        </span>
                        <span className="text-xs text-white/30">
                          Cost: {getCostTierLabel(model.costTier)}
                        </span>
                        <span className="text-xs text-white/30">
                          {(model.contextWindow / 1000).toFixed(0)}K context
                        </span>
                      </div>
                    </div>
                    {model.id === selectedModelId && (
                      <Check size={16} className="text-indigo-400" />
                    )}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
