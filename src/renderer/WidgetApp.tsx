import { useEffect, useState, useRef, useCallback } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion"
import { Mic, Send, Camera, Settings, Sparkles, MessageSquare, X, Zap } from "lucide-react"
import { usePulseStore, initializeApiKey } from "./stores/pulseStore"
import { streamChat } from "./lib/claude"
import { MarkdownRenderer } from "./components/MarkdownRenderer"
import { Logo } from "./components/Logo"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  screenshot?: string
}

type WidgetView = "home" | "chat" | "voice"

export function WidgetApp() {
  const [view, setView] = useState<WidgetView>("home")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState("")
  const [isInitialized, setIsInitialized] = useState(false)
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState("")

  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const { settings, updateSettings } = usePulseStore()

  // Mouse position for magnetic effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 25, stiffness: 200 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)

  // Initialize
  useEffect(() => {
    async function initialize() {
      try {
        const apiKey = await initializeApiKey()
        if (apiKey) {
          updateSettings({ apiKey })
        }
      } catch (e) {
        console.log("API key init skipped")
      }
      setIsInitialized(true)
    }
    initialize()
  }, [])

  // Mouse tracking for magnetic effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = document.body.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const deltaX = (e.clientX - centerX) / 50
      const deltaY = (e.clientY - centerY) / 50
      mouseX.set(deltaX)
      mouseY.set(deltaY)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Widget events
  useEffect(() => {
    window.pulse?.onWidgetShow?.((data) => {
      if (data.mode === "voice") {
        setView("voice")
        startListening()
      }
      setTimeout(() => inputRef.current?.focus(), 100)
    })

    window.pulse?.onWidgetHide?.(() => {
      stopListening()
    })

    window.pulse?.onScreenshotReady?.((data) => {
      setCurrentScreenshot(data.screenshot)
      setView("chat")
    })

    return () => {
      window.pulse?.removeAllListeners?.()
    }
  }, [])

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
    setView("voice")
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text || isLoading) return

    stopListening()
    setView("chat")

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
      screenshot: currentScreenshot || undefined
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)
    setStreamingContent("")

    if (!settings.apiKey) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-resp`,
          role: "assistant",
          content: "Please add your Claude API key to start chatting."
        }
      ])
      setIsLoading(false)
      setShowApiKeyInput(true)
      return
    }

    try {
      const chatMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content
      }))
      chatMessages.push({ role: "user", content: text })

      let fullResponse = ""

      await streamChat(
        settings.apiKey,
        chatMessages,
        currentScreenshot || undefined,
        (chunk) => {
          fullResponse += chunk
          setStreamingContent(fullResponse)
        }
      )

      setMessages((prev) => [
        ...prev,
        { id: `msg-${Date.now()}-resp`, role: "assistant", content: fullResponse }
      ])
      setStreamingContent("")
      setCurrentScreenshot(null)
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) => [
        ...prev,
        { id: `msg-${Date.now()}-err`, role: "assistant", content: "Something went wrong. Please try again." }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      updateSettings({ apiKey: apiKeyInput.trim() })
      window.pulse?.vault?.set?.("anthropic_api_key", apiKeyInput.trim())
      setShowApiKeyInput(false)
      setApiKeyInput("")
    }
  }

  const handleCapture = async () => {
    const screenshot = await window.pulse?.captureScreen?.()
    if (screenshot) {
      setCurrentScreenshot(screenshot)
      setView("chat")
      inputRef.current?.focus()
    }
  }

  const handleClose = () => {
    window.pulse?.hideWidget?.()
  }

  const quickActions = [
    { label: "What's on my screen?", icon: "👀", action: () => handleCapture() },
    { label: "Help me write something", icon: "✍️", action: () => { setInputValue("Help me write "); setView("chat"); } },
    { label: "Explain this to me", icon: "💡", action: () => { setInputValue("Explain "); setView("chat"); } },
    { label: "Voice mode", icon: "🎤", action: startListening }
  ]

  if (!isInitialized) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full"
        />
      </div>
    )
  }

  return (
    <motion.div
      style={{ x, y }}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="w-full h-full rounded-2xl overflow-hidden flex flex-col"
    >
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(20, 20, 30, 0.95) 0%, rgba(30, 25, 40, 0.95) 100%)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05) inset"
        }}
      />

      {/* Pulsing glow effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{
          boxShadow: [
            "0 0 20px 0px rgba(99, 102, 241, 0.0)",
            "0 0 30px 5px rgba(99, 102, 241, 0.15)",
            "0 0 20px 0px rgba(99, 102, 241, 0.0)"
          ]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <motion.div
            className="flex items-center gap-2"
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Logo size={22} />
            </motion.div>
            <span className="text-white/90 font-semibold text-sm">Pulse</span>
            <motion.div
              className="w-2 h-2 rounded-full bg-green-400"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <motion.button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={16} />
          </motion.button>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {view === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full p-4 flex flex-col"
              >
                {/* Greeting */}
                <motion.div
                  className="text-center mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-white/90 text-lg font-medium mb-1">
                    How can I help?
                  </h2>
                  <p className="text-white/50 text-sm">
                    Ask me anything or try a quick action
                  </p>
                </motion.div>

                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-2 flex-1">
                  {quickActions.map((action, i) => (
                    <motion.button
                      key={action.label}
                      onClick={action.action}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * (i + 1) }}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }}
                      whileTap={{ scale: 0.98 }}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl
                               bg-white/5 border border-white/5 text-white/80 hover:text-white
                               transition-colors"
                    >
                      <span className="text-2xl">{action.icon}</span>
                      <span className="text-xs text-center leading-tight">{action.label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* API Key prompt if needed */}
                {showApiKeyInput && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
                  >
                    <p className="text-white/70 text-xs mb-2">Enter your Claude API key:</p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="sk-ant-..."
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm
                                 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      />
                      <button
                        onClick={handleSaveApiKey}
                        className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-sm font-medium"
                      >
                        Save
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {view === "chat" && (
              <ChatView
                messages={messages}
                streamingContent={streamingContent}
                isLoading={isLoading}
                screenshot={currentScreenshot}
                onClearScreenshot={() => setCurrentScreenshot(null)}
              />
            )}

            {view === "voice" && (
              <VoiceView isListening={isListening} transcript={inputValue} />
            )}
          </AnimatePresence>
        </div>

        {/* Input area */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleCapture}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
              title="Screenshot"
            >
              <Camera size={18} />
            </motion.button>
            <motion.button
              onClick={isListening ? stopListening : startListening}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-2 rounded-lg transition-colors ${
                isListening
                  ? "bg-red-500/20 text-red-400"
                  : "bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80"
              }`}
              title="Voice"
            >
              <Mic size={18} />
            </motion.button>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              onFocus={() => view === "home" && setView("chat")}
              placeholder={isListening ? "Listening..." : "Ask anything..."}
              className="flex-1 bg-white/5 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:bg-white/10 transition-all"
            />
            <motion.button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-2 rounded-lg transition-all ${
                inputValue.trim() && !isLoading
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-white/5 text-white/30"
              }`}
            >
              <Send size={18} />
            </motion.button>
          </div>
          <p className="text-white/30 text-[10px] mt-2 text-center">
            ⌘⇧G toggle • ⌘⇧V voice • ⌘⇧S screenshot • ESC close
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function ChatView({
  messages,
  streamingContent,
  isLoading,
  screenshot,
  onClearScreenshot
}: {
  messages: Message[]
  streamingContent: string
  isLoading: boolean
  screenshot: string | null
  onClearScreenshot: () => void
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  return (
    <motion.div
      key="chat"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      {/* Screenshot preview */}
      {screenshot && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-3 py-2 border-b border-white/5"
        >
          <div className="flex items-center gap-2">
            <img src={screenshot} alt="Screenshot" className="h-10 rounded opacity-70" />
            <span className="text-white/50 text-xs flex-1">Screenshot attached</span>
            <button onClick={onClearScreenshot} className="text-white/40 hover:text-white/70">
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && !streamingContent && (
          <div className="text-center text-white/40 py-8">
            <Sparkles size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start a conversation</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-indigo-500/40 to-purple-500/40 text-white"
                  : "bg-white/5 text-white/90"
              }`}
            >
              {msg.role === "assistant" ? (
                <MarkdownRenderer content={msg.content} />
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </motion.div>
        ))}

        {/* Streaming response */}
        {streamingContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-white/5 text-white/90">
              <MarkdownRenderer content={streamingContent} />
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-2 h-4 bg-indigo-400 ml-1"
              />
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
            <div className="rounded-2xl px-4 py-3 bg-white/5">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-indigo-400"
                    animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </motion.div>
  )
}

function VoiceView({ isListening, transcript }: { isListening: boolean; transcript: string }) {
  return (
    <motion.div
      key="voice"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center p-6"
    >
      {/* Animated rings */}
      <div className="relative mb-6">
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute inset-0 rounded-full border-2 border-indigo-500/30"
            style={{ margin: -ring * 15 }}
            animate={isListening ? {
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3]
            } : {}}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: ring * 0.2
            }}
          />
        ))}
        <motion.div
          className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                     flex items-center justify-center shadow-lg shadow-indigo-500/30"
          animate={isListening ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <Mic size={32} className="text-white" />
        </motion.div>
      </div>

      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-white/60 text-sm mb-4"
      >
        {isListening ? "Listening..." : "Click the mic to speak"}
      </motion.p>

      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full p-3 rounded-xl bg-white/5 text-white/80 text-sm text-center"
        >
          "{transcript}"
        </motion.div>
      )}
    </motion.div>
  )
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}
