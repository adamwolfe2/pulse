/**
 * Pulse Widget - Glass Morphism Design
 * Minimal, fast, smooth AI assistant
 */

import { useEffect, useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, Send, Camera, X, Sparkles, ListTodo, Settings, MoreHorizontal } from "lucide-react"
import { usePulseStore, initializeApiKey } from "./stores/pulseStore"
import { streamChat } from "./lib/claude"
import { MarkdownRenderer } from "./components/MarkdownRenderer"
import { SettingsWindow } from "./components/Settings/SettingsWindow"
import { OnboardingFlow } from "./components/Onboarding/OnboardingFlow"
import { useTaskStore } from "./stores/taskStore"
import { useToast } from "./components/Toast"
import "./styles/glass.css"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp?: number
}

// Smooth, snappy animations
const spring = {
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

export function WidgetApp() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [isInitialized, setIsInitialized] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showInput, setShowInput] = useState(true)

  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { settings, updateSettings } = usePulseStore()
  const { toggleTaskList } = useTaskStore()
  const toast = useToast()

  // Initialize
  useEffect(() => {
    async function init() {
      try {
        const apiKey = await initializeApiKey()
        if (apiKey) updateSettings({ apiKey })

        const onboardingComplete = localStorage.getItem("pulse_onboarding_complete")
        if (!onboardingComplete) setShowOnboarding(true)
      } catch (e) {
        console.error("Init error:", e)
      }
      setIsInitialized(true)
    }
    init()
  }, [])

  // IPC Events
  useEffect(() => {
    window.pulse?.onWidgetShow?.(() => {
      setTimeout(() => inputRef.current?.focus(), 50)
    })

    window.pulse?.onScreenshotReady?.((data) => {
      handleScreenshotChat(data.screenshot)
    })

    window.pulse?.onOpenSettings?.(() => setShowSettings(true))

    return () => {
      window.pulse?.removeAllListeners?.()
    }
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  const handleClose = () => {
    window.pulse?.hideWidget?.()
  }

  const handleCapture = async () => {
    const screenshot = await window.pulse?.captureScreen?.()
    if (screenshot) {
      handleScreenshotChat(screenshot)
    }
  }

  const handleScreenshotChat = async (screenshot: string) => {
    if (!settings.apiKey) {
      toast.error("API Key Required", "Add your Claude API key in settings")
      setShowSettings(true)
      return
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: "What do you see on my screen?",
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    setStreamingContent("")

    try {
      let fullResponse = ""
      await streamChat(
        settings.apiKey,
        [{ role: "user", content: "Analyze this screenshot and tell me what you see. Be concise and helpful." }],
        screenshot,
        (chunk) => {
          fullResponse += chunk
          setStreamingContent(fullResponse)
        },
        "You are a helpful AI assistant. Be concise and direct.",
        0.7
      )

      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-resp`,
        role: "assistant",
        content: fullResponse,
        timestamp: Date.now()
      }])
      setStreamingContent("")
    } catch (error) {
      toast.error("Failed", "Could not analyze screenshot")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text || isLoading) return

    if (!settings.apiKey) {
      toast.error("API Key Required", "Add your Claude API key in settings")
      setShowSettings(true)
      return
    }

    stopListening()

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now()
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInputValue("")
    setIsLoading(true)
    setStreamingContent("")

    try {
      const apiMessages = newMessages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
      }))

      let fullResponse = ""
      await streamChat(
        settings.apiKey,
        apiMessages,
        undefined,
        (chunk) => {
          fullResponse += chunk
          setStreamingContent(fullResponse)
        },
        "You are Pulse, a fast and helpful AI assistant. Be concise, direct, and useful.",
        0.7
      )

      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-resp`,
        role: "assistant",
        content: fullResponse,
        timestamp: Date.now()
      }])
      setStreamingContent("")
    } catch (error) {
      console.error("Chat error:", error)
      toast.error("Error", "Failed to get response")
    } finally {
      setIsLoading(false)
    }
  }

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window)) return

    const recognition = new window.webkitSpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("")
      setInputValue(transcript)
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  const clearChat = () => {
    setMessages([])
    setStreamingContent("")
  }

  if (!isInitialized) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
        <div className="loading-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    )
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
  }

  const hasMessages = messages.length > 0 || streamingContent

  return (
    <>
      <SettingsWindow isOpen={showSettings} onClose={() => setShowSettings(false)} />

      <motion.div
        className="w-full h-full flex flex-col glass-container"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={spring}
        style={{ background: "rgba(0, 0, 0, 0.7)", borderRadius: 16 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 drag-region">
          <div className="flex items-center gap-2 no-drag">
            <div className="status-dot" />
            <span className="text-white/90 text-sm font-medium">Pulse</span>
          </div>

          <div className="flex items-center gap-1 no-drag">
            {/* Tasks */}
            <motion.button
              onClick={toggleTaskList}
              className="glass-icon-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Tasks (⌘⇧L)"
            >
              <ListTodo size={16} />
            </motion.button>

            {/* Settings */}
            <motion.button
              onClick={() => setShowSettings(true)}
              className="glass-icon-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Settings"
            >
              <Settings size={16} />
            </motion.button>

            {/* Close */}
            <motion.button
              onClick={handleClose}
              className="glass-icon-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={16} />
            </motion.button>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-white/10" />

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 glass-scrollbar">
          {!hasMessages ? (
            <motion.div
              className="h-full flex flex-col items-center justify-center text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Sparkles size={32} className="text-white/30 mb-3" />
              <p className="text-white/50 text-sm mb-1">Ask anything</p>
              <p className="text-white/30 text-xs">or capture your screen with ⌘⇧S</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={spring}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-white/15 text-white"
                        : "bg-white/5 text-white/90"
                    }`}
                    style={{ outline: "0.5px solid rgba(255,255,255,0.1)", outlineOffset: "-1px" }}
                  >
                    {msg.role === "assistant" ? (
                      <MarkdownRenderer content={msg.content} />
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Streaming */}
              {streamingContent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div
                    className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-white/5 text-white/90"
                    style={{ outline: "0.5px solid rgba(255,255,255,0.1)", outlineOffset: "-1px" }}
                  >
                    <MarkdownRenderer content={streamingContent} />
                    <motion.span
                      className="inline-block w-1.5 h-4 bg-white/60 rounded-sm ml-0.5"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Loading */}
              {isLoading && !streamingContent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="rounded-xl px-4 py-3 bg-white/5">
                    <div className="loading-dots">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="px-3 pb-3 pt-2">
          <div className="flex items-center gap-2">
            {/* Screenshot */}
            <motion.button
              onClick={handleCapture}
              className="glass-icon-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Screenshot (⌘⇧S)"
            >
              <Camera size={18} />
            </motion.button>

            {/* Voice */}
            <motion.button
              onClick={isListening ? stopListening : startListening}
              className={`glass-icon-button ${isListening ? "!bg-red-500/30 !text-red-400" : ""}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Voice (⌘⇧V)"
            >
              <Mic size={18} />
            </motion.button>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={isListening ? "Listening..." : "Ask anything..."}
              className="glass-input"
            />

            {/* Send */}
            <motion.button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className={`glass-button ${
                inputValue.trim() && !isLoading
                  ? "!bg-white/20"
                  : "!bg-white/5 !text-white/30"
              }`}
              whileHover={inputValue.trim() && !isLoading ? { scale: 1.05 } : {}}
              whileTap={inputValue.trim() && !isLoading ? { scale: 0.95 } : {}}
              style={{ padding: "0 12px", height: 36 }}
            >
              <Send size={16} />
            </motion.button>
          </div>

          {/* Shortcuts hint */}
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-white/25 text-[10px]">⌘⇧G toggle</span>
            <span className="text-white/25 text-[10px]">⌘⇧S screenshot</span>
            <span className="text-white/25 text-[10px]">⌘⇧T task</span>
          </div>
        </div>
      </motion.div>
    </>
  )
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}
