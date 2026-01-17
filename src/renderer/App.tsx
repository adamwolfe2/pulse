import { useEffect, useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassPanel } from "./components/GlassPanel"
import { SettingsWindow } from "./components/Settings"
import { Logo } from "./components/Logo"
import { useGhostStore } from "./stores/ghostStore"
import { analyzeScreenWithVision, streamChat } from "./lib/claude"
import { Settings } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  screenshot?: string
  timestamp: number
}

export function App() {
  const [isVisible, setIsVisible] = useState(false)
  const [mode, setMode] = useState<"chat" | "voice">("chat")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState("")
  const [showSettings, setShowSettings] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const { settings } = useGhostStore()

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  // Focus input when visible
  useEffect(() => {
    if (isVisible && mode === "chat" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isVisible, mode])

  // Set up event listeners
  useEffect(() => {
    window.ghostbar?.onOverlayShow(({ mode: newMode }) => {
      setIsVisible(true)
      setMode(newMode)
      if (newMode === "voice") {
        startListening()
      }
    })

    window.ghostbar?.onOverlayHide(() => {
      setIsVisible(false)
      stopListening()
    })

    window.ghostbar?.onActivateVoice(() => {
      setMode("voice")
      startListening()
    })

    window.ghostbar?.onScreenshotReady(({ screenshot }) => {
      setCurrentScreenshot(screenshot)
      setIsVisible(true)
      setMode("chat")
      // Add system message about screenshot
      addMessage({
        role: "assistant",
        content: "I can see your screen now. What would you like to know about it?"
      })
    })

    window.ghostbar?.onProactiveTrigger(async ({ screenshot }) => {
      // Analyze screenshot proactively
      if (settings.apiKey) {
        try {
          const analysis = await analyzeScreenWithVision(settings.apiKey, screenshot,
            "Briefly analyze what's on this screen. If you notice something the user might want help with, mention it. Keep it very short (1-2 sentences). If nothing notable, respond with just 'null'."
          )
          if (analysis && analysis.toLowerCase() !== "null") {
            setCurrentScreenshot(screenshot)
            setIsVisible(true)
            addMessage({ role: "assistant", content: analysis })
            window.ghostbar?.enableInteraction()
          }
        } catch (error) {
          console.error("Proactive analysis failed:", error)
        }
      }
    })

    return () => {
      window.ghostbar?.removeAllListeners()
    }
  }, [settings.apiKey])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          setInputValue(prev => prev + finalTranscript)
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  const startListening = useCallback(async () => {
    const permission = await window.ghostbar?.getMicPermission()
    if (permission !== "granted") {
      addMessage({ role: "assistant", content: "Microphone permission is needed for voice mode. Please grant access in System Preferences." })
      return
    }

    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (error) {
        console.error("Failed to start speech recognition:", error)
      }
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [isListening])

  const addMessage = useCallback((msg: Omit<Message, "id" | "timestamp">) => {
    const newMessage: Message = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, newMessage])
  }, [])

  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text || isLoading) return

    // Stop listening if in voice mode
    if (isListening) {
      stopListening()
    }

    // Add user message
    addMessage({ role: "user", content: text, screenshot: currentScreenshot || undefined })
    setInputValue("")
    setIsLoading(true)
    setStreamingContent("")

    try {
      if (!settings.apiKey) {
        addMessage({ role: "assistant", content: "Please set your Claude API key in the settings to use Pulse." })
        setIsLoading(false)
        return
      }

      // Build messages for API
      const apiMessages = messages.slice(-10).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
      }))
      apiMessages.push({ role: "user", content: text })

      // Stream response
      let fullResponse = ""
      await streamChat(
        settings.apiKey,
        apiMessages,
        currentScreenshot,
        (chunk) => {
          fullResponse += chunk
          setStreamingContent(fullResponse)
        }
      )

      // Add final message
      addMessage({ role: "assistant", content: fullResponse })
      setStreamingContent("")
      setCurrentScreenshot(null) // Clear screenshot after using

    } catch (error) {
      console.error("Chat error:", error)
      addMessage({ role: "assistant", content: "Sorry, something went wrong. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCaptureScreen = async () => {
    const screenshot = await window.ghostbar?.captureScreen()
    if (screenshot) {
      setCurrentScreenshot(screenshot)
      addMessage({ role: "assistant", content: "Got it! I can see your screen now. What would you like to know?" })
    }
  }

  const handleClose = () => {
    window.ghostbar?.hideOverlay()
  }

  if (!isVisible && !showSettings) return null

  return (
    <>
      {/* Settings Window - can be shown independently */}
      <SettingsWindow isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Main overlay */}
      {isVisible && (
    <div className="fixed inset-0 flex items-center justify-center p-8">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      />

      {/* Main Chat Panel */}
      <motion.div
        className="relative z-10 w-full max-w-2xl h-[70vh] flex flex-col"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <GlassPanel intensity="heavy" className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Logo size={36} />
              <div>
                <h1 className="text-white font-semibold">Pulse</h1>
                <p className="text-white/50 text-xs">
                  {isListening ? "🎤 Listening..." : mode === "voice" ? "Voice Mode" : "Chat Mode"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Screenshot button */}
              <button
                onClick={handleCaptureScreen}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Capture Screen (⌘⇧S)"
              >
                <span className="text-lg">📸</span>
              </button>
              {/* Voice toggle */}
              <button
                onClick={isListening ? stopListening : startListening}
                className={`p-2 rounded-lg transition-colors ${
                  isListening ? "bg-red-500/50 hover:bg-red-500/70" : "bg-white/10 hover:bg-white/20"
                }`}
                title="Voice Mode (⌘⇧V)"
              >
                <span className="text-lg">{isListening ? "🔴" : "🎤"}</span>
              </button>
              {/* Settings button */}
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Settings"
              >
                <Settings size={18} className="text-white/70" />
              </button>
              {/* Close button */}
              <button
                onClick={handleClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <span className="text-lg">✕</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-white/40 py-12">
                <div className="flex justify-center mb-4">
                  <Logo size={64} />
                </div>
                <p className="text-lg mb-2">Hey! I'm Pulse</p>
                <p className="text-sm">
                  Ask me anything, capture your screen, or use voice mode.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <button
                    onClick={handleCaptureScreen}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-sm"
                  >
                    📸 Capture Screen
                  </button>
                  <button
                    onClick={startListening}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-sm"
                  >
                    🎤 Voice Mode
                  </button>
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-blue-500/30 text-white"
                        : "bg-white/10 text-white/90"
                    }`}
                  >
                    {message.screenshot && (
                      <img
                        src={message.screenshot}
                        alt="Screenshot"
                        className="rounded-lg mb-2 max-h-32 object-contain"
                      />
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Streaming response */}
            {streamingContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white/10 text-white/90">
                  <p className="whitespace-pre-wrap">{streamingContent}</p>
                  <span className="inline-block w-2 h-4 bg-white/50 animate-pulse ml-1" />
                </div>
              </motion.div>
            )}

            {/* Loading indicator */}
            {isLoading && !streamingContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="rounded-2xl px-4 py-3 bg-white/10">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Screenshot preview */}
          {currentScreenshot && (
            <div className="px-4 py-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <img
                  src={currentScreenshot}
                  alt="Current screenshot"
                  className="h-12 rounded object-contain"
                />
                <span className="text-white/50 text-sm">Screenshot attached</span>
                <button
                  onClick={() => setCurrentScreenshot(null)}
                  className="ml-auto text-white/50 hover:text-white/80"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : "Ask me anything..."}
                className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3
                         resize-none focus:outline-none focus:ring-2 focus:ring-white/20
                         min-h-[48px] max-h-32"
                rows={1}
              />
              <motion.button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className={`p-3 rounded-xl transition-colors ${
                  inputValue.trim() && !isLoading
                    ? "bg-white/20 hover:bg-white/30 text-white"
                    : "bg-white/5 text-white/30"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </motion.button>
            </div>
            <p className="text-white/30 text-xs mt-2 text-center">
              Press Enter to send • ⌘⇧G to toggle • ⌘⇧V for voice • ESC to close
            </p>
          </div>
        </GlassPanel>
      </motion.div>
    </div>
      )}
    </>
  )
}

// Add webkitSpeechRecognition type
declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}
