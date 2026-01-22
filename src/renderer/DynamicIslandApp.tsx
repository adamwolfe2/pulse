/**
 * Dynamic Island - Hover-activated contextual AI assistant
 * Appears when hovering near the menu bar area
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Mic, Plus, Send, X, Loader2, CheckCircle2 } from 'lucide-react'
import { usePulseStore, initializeApiKey } from './stores/pulseStore'
import { streamChat } from './lib/claude'
import { useTaskStore } from './stores/taskStore'
import { MarkdownRenderer } from './components/MarkdownRenderer'

// Animation configs
const springLiquid = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
  mass: 0.8
}

const springBouncy = {
  type: "spring" as const,
  stiffness: 500,
  damping: 25,
  mass: 0.8
}

type IslandState = 'pill' | 'expanded'
type IslandMode = 'suggestion' | 'task-capture' | 'streaming' | 'quick-actions'

interface IslandContext {
  screenshot?: string
  analysis?: string
}

export function DynamicIslandApp() {
  const [state, setState] = useState<IslandState>('pill')
  const [mode, setMode] = useState<IslandMode>('suggestion')
  const [context, setContext] = useState<IslandContext | null>(null)
  const [streamingText, setStreamingText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [taskInput, setTaskInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const { settings } = usePulseStore()
  const { addTask } = useTaskStore()

  // Initialize API key
  useEffect(() => {
    initializeApiKey()
  }, [])

  // Listen for state changes from main process
  useEffect(() => {
    window.pulse?.onIslandState?.((data) => {
      setState(data.state as IslandState)
      if (data.context) {
        setContext(data.context)
        // Auto-generate contextual suggestion when expanded
        if (data.state === 'expanded' && data.context.screenshot) {
          generateContextualSuggestion(data.context.screenshot)
        }
      }
    })

    window.pulse?.onIslandMode?.((newMode) => {
      setMode(newMode as IslandMode)
      if (newMode === 'task-capture') {
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    })

    return () => {
      window.pulse?.removeAllListeners?.()
    }
  }, [])

  const generateContextualSuggestion = async (screenshot: string) => {
    if (!settings.apiKey) return

    setIsLoading(true)
    setMode('streaming')
    setStreamingText('')

    try {
      const systemPrompt = `You are a proactive AI assistant that analyzes the user's screen and provides helpful, contextual suggestions.

Based on the screenshot, provide ONE brief, actionable suggestion (2-3 sentences max) that could help the user with what they're currently doing.

Focus on:
- Explaining something they might be stuck on
- Offering to help with a task they're working on
- Suggesting a useful next step
- Answering a question they might have

Be concise, friendly, and directly helpful. Don't be generic - reference specific things you see on screen.`

      await streamChat(
        settings.apiKey,
        [{ role: 'user', content: 'What can you help me with based on what you see?' }],
        screenshot,
        (chunk) => {
          setStreamingText(prev => prev + chunk)
        },
        systemPrompt,
        0.7
      )
    } catch (error) {
      console.error('Failed to generate suggestion:', error)
      setStreamingText("I'm here to help! What would you like assistance with?")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTask = () => {
    const content = taskInput.trim()
    if (!content) return

    addTask(content, isListening ? 'voice' : 'keyboard')
    setTaskInput('')
    setShowSuccess(true)

    // Show success briefly then collapse
    setTimeout(() => {
      setShowSuccess(false)
      window.pulse?.island?.collapse?.()
    }, 1500)
  }

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) return

    const recognition = new window.webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('')
      setTaskInput(transcript)
    }

    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsListening(false)
  }

  const handleClose = () => {
    window.pulse?.island?.hide?.()
  }

  return (
    <motion.div
      className="w-full h-full overflow-hidden"
      style={{
        background: state === 'pill'
          ? 'linear-gradient(180deg, rgba(25,25,30,0.95) 0%, rgba(20,20,25,0.95) 100%)'
          : 'linear-gradient(180deg, rgba(20,20,25,0.98) 0%, rgba(15,15,20,0.99) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        borderRadius: state === 'pill' ? 18 : 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}
      layout
      transition={springLiquid}
    >
      <AnimatePresence mode="wait">
        {/* Pill State */}
        {state === 'pill' && (
          <motion.div
            key="pill"
            className="flex items-center justify-center h-full px-4 gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-green-400"
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-white/70 text-xs font-medium">Pulse</span>
          </motion.div>
        )}

        {/* Expanded State */}
        {state === 'expanded' && (
          <motion.div
            key="expanded"
            className="h-full flex flex-col"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: 0.05 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-400" />
                <span className="text-white/80 text-sm font-medium">
                  {mode === 'task-capture' ? 'Quick Task' : 'Pulse'}
                </span>
              </div>
              <motion.button
                onClick={handleClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={14} />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Task Capture Mode */}
              {mode === 'task-capture' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {showSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-8"
                    >
                      <CheckCircle2 size={48} className="text-green-400 mb-3" />
                      <p className="text-white font-medium">Task added!</p>
                    </motion.div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <input
                          ref={inputRef}
                          value={taskInput}
                          onChange={(e) => setTaskInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTask()
                            if (e.key === 'Escape') handleClose()
                          }}
                          placeholder="What needs to be done?"
                          className="flex-1 bg-white/5 text-white placeholder-white/30 rounded-xl
                                   px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30
                                   border border-white/10"
                        />
                        <motion.button
                          onClick={isListening ? stopListening : startListening}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`p-3 rounded-xl transition-all ${
                            isListening
                              ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/30'
                              : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Mic size={18} />
                        </motion.button>
                      </div>

                      {/* Voice waveform */}
                      {isListening && (
                        <div className="flex items-center justify-center gap-1 py-2">
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-1 bg-indigo-500 rounded-full"
                              animate={{ height: [8, 20, 8] }}
                              transition={{
                                duration: 0.5,
                                repeat: Infinity,
                                delay: i * 0.1,
                                ease: "easeInOut"
                              }}
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex justify-end">
                        <motion.button
                          onClick={handleAddTask}
                          disabled={!taskInput.trim()}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium
                                   disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Plus size={16} />
                          Add Task
                        </motion.button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Streaming/Suggestion Mode */}
              {(mode === 'streaming' || mode === 'suggestion') && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {isLoading && !streamingText ? (
                    <div className="flex items-center justify-center py-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 size={24} className="text-indigo-400" />
                      </motion.div>
                    </div>
                  ) : streamingText ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <MarkdownRenderer content={streamingText} />
                      {isLoading && (
                        <motion.span
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="inline-block w-2 h-4 bg-indigo-400 rounded-sm ml-1"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-white/40">
                      <Sparkles size={32} className="mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Analyzing your screen...</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Quick Actions Mode */}
              {mode === 'quick-actions' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  {[
                    { icon: '📝', label: 'Add a task', action: () => setMode('task-capture') },
                    { icon: '📸', label: 'Analyze screen', action: () => context?.screenshot && generateContextualSuggestion(context.screenshot) },
                    { icon: '💬', label: 'Open Pulse', action: () => window.pulse?.showWidget?.() },
                  ].map((action, i) => (
                    <motion.button
                      key={action.label}
                      onClick={action.action}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                               bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left"
                    >
                      <span className="text-lg">{action.icon}</span>
                      <span className="text-white/80 text-sm">{action.label}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Footer actions for suggestion mode */}
            {(mode === 'streaming' || mode === 'suggestion') && streamingText && !isLoading && (
              <div className="px-4 py-3 border-t border-white/5 flex items-center gap-2">
                <motion.button
                  onClick={() => setMode('task-capture')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-2 px-3 rounded-lg bg-white/5 text-white/70 text-xs hover:bg-white/10 transition-colors"
                >
                  Add as task
                </motion.button>
                <motion.button
                  onClick={() => window.pulse?.showWidget?.()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-2 px-3 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs hover:bg-indigo-500/30 transition-colors"
                >
                  Continue in Pulse
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liquid glass edge highlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 30%)',
          borderRadius: 'inherit'
        }}
      />
    </motion.div>
  )
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}
