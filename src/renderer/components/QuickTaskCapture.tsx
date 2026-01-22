/**
 * Quick Task Capture - Minimal overlay for instant task entry
 * Can be triggered via hotkey (⌘⇧T) from anywhere
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Mic, X, Sparkles } from 'lucide-react'
import { useTaskStore } from '../stores/taskStore'
import { parseVoiceForTask } from '../lib/tasks'

const springSmooth = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 1
}

interface QuickTaskCaptureProps {
  isOpen: boolean
  onClose: () => void
  initialValue?: string
  context?: {
    application?: string
    windowTitle?: string
  }
}

export function QuickTaskCapture({
  isOpen,
  onClose,
  initialValue = '',
  context
}: QuickTaskCaptureProps) {
  const [value, setValue] = useState(initialValue)
  const [isListening, setIsListening] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const { addTask } = useTaskStore()

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setValue(initialValue)
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      stopListening()
    }
  }, [isOpen, initialValue])

  // Update value from initial
  useEffect(() => {
    if (initialValue) {
      setValue(initialValue)
    }
  }, [initialValue])

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn('Speech recognition not supported')
      return
    }

    const recognition = new window.webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('')
      setVoiceTranscript(transcript)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (voiceTranscript) {
        const { isTask, content } = parseVoiceForTask(voiceTranscript)
        setValue(isTask ? content : voiceTranscript)
        setVoiceTranscript('')
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
      setVoiceTranscript('')
    }

    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }

  const handleSubmit = () => {
    const taskContent = value.trim()
    if (!taskContent) return

    addTask(taskContent, isListening ? 'voice' : 'keyboard', context)
    setValue('')
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      handleSubmit()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          />

          {/* Capture input */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={springSmooth}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[101] w-full max-w-md px-4"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(25,25,30,0.98) 0%, rgba(15,15,20,0.99) 100%)',
                backdropFilter: 'blur(40px) saturate(180%)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <Plus size={18} className="text-indigo-400" />
                <span className="text-white/80 text-sm font-medium">Quick Task</span>
                {context?.application && (
                  <span className="ml-auto text-white/30 text-xs">
                    from {context.application}
                  </span>
                )}
              </div>

              {/* Input area */}
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    value={isListening ? voiceTranscript || 'Listening...' : value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    readOnly={isListening}
                    placeholder="What needs to be done?"
                    className={`flex-1 bg-transparent text-white placeholder-white/30
                             text-base py-2 px-1 focus:outline-none ${
                               isListening ? 'text-indigo-400' : ''
                             }`}
                  />

                  {/* Voice button */}
                  <motion.button
                    onClick={isListening ? stopListening : startListening}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2.5 rounded-xl transition-all ${
                      isListening
                        ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/30'
                        : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                    }`}
                    title={isListening ? 'Stop listening' : 'Voice input'}
                  >
                    <Mic size={18} />
                  </motion.button>
                </div>

                {/* Voice waveform indicator */}
                <AnimatePresence>
                  {isListening && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 flex items-center justify-center gap-1"
                    >
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-indigo-500 rounded-full"
                          animate={{
                            height: [8, 20, 8],
                          }}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            delay: i * 0.1,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3 text-white/30 text-xs">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10">↵</kbd>
                    save
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10">esc</kbd>
                    cancel
                  </span>
                </div>

                <motion.button
                  onClick={handleSubmit}
                  disabled={!value.trim() && !voiceTranscript.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-1.5 rounded-lg bg-indigo-500 text-white text-sm font-medium
                           disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                >
                  Add Task
                </motion.button>
              </div>
            </div>

            {/* Hints */}
            <div className="mt-3 text-center text-white/20 text-xs">
              <p>
                <span className="text-white/30">Tip:</span> Use{' '}
                <span className="text-indigo-400">!!!</span> for high priority,{' '}
                <span className="text-indigo-400">#tag</span> to categorize
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Inline quick task input for embedding in main widget
export function InlineTaskInput({
  onSubmit,
  placeholder = "Add a task...",
  compact = false
}: {
  onSubmit?: (content: string) => void
  placeholder?: string
  compact?: boolean
}) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const { addTask } = useTaskStore()

  const handleSubmit = () => {
    const content = value.trim()
    if (!content) return

    if (onSubmit) {
      onSubmit(content)
    } else {
      addTask(content, 'keyboard')
    }
    setValue('')
  }

  return (
    <motion.div
      className={`flex items-center gap-2 rounded-xl transition-all ${
        compact ? 'bg-white/[0.03]' : 'bg-white/[0.04] border border-white/[0.06]'
      } ${isFocused ? 'ring-2 ring-indigo-500/30' : ''}`}
    >
      <Plus size={compact ? 14 : 16} className="ml-3 text-white/30" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
        }}
        placeholder={placeholder}
        className={`flex-1 bg-transparent text-white placeholder-white/30
                 focus:outline-none ${compact ? 'py-1.5 text-xs' : 'py-2 text-sm'}`}
      />
      <AnimatePresence>
        {value.trim() && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleSubmit}
            className="mr-2 p-1 rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
          >
            <Plus size={compact ? 12 : 14} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}
