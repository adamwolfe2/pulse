import { useEffect, useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, Send, Camera, Settings, Sparkles, MessageSquare, X } from "lucide-react"
import { usePulseStore, initializeApiKey } from "./stores/pulseStore"
import { streamChat, analyzeScreenWithVision } from "./lib/claude"
import { MarkdownRenderer } from "./components/MarkdownRenderer"
import { OnboardingFlow } from "./components/Onboarding"
import { SettingsWindow } from "./components/Settings"
import { Logo } from "./components/Logo"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  screenshot?: string
}

type WidgetView = "suggestions" | "chat" | "voice"

export function WidgetApp() {
  const [isVisible, setIsVisible] = useState(false)
  const [view, setView] = useState<WidgetView>("suggestions")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [proactiveSuggestion, setProactiveSuggestion] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const { settings, updateSettings } = usePulseStore()

  // Initialize
  useEffect(() => {
    async function initialize() {
      const apiKey = await initializeApiKey()
      if (apiKey) {
        updateSettings({ apiKey })
      }

      const onboardingComplete = localStorage.getItem("pulse_onboarding_complete")
      if (!onboardingComplete && !apiKey) {
        setShowOnboarding(true)
      }

      setIsInitialized(true)
    }

    initialize()
  }, [])

  // Widget events
  useEffect(() => {
    window.pulse?.onWidgetShow?.((data) => {
      setIsVisible(true)
      if (data.mode === "voice") {
        setView("voice")
        startListening()
      } else {
        setView(messages.length > 0 ? "chat" : "suggestions")
      }
      setTimeout(() => inputRef.current?.focus(), 100)
    })

    window.pulse?.onWidgetHide?.(() => {
      setIsVisible(false)
      stopListening()
    })

    window.pulse?.onOpenSettings?.(() => {
      setShowSettings(true)
    })

    window.pulse?.onScreenshotReady?.((data) => {
      setCurrentScreenshot(data.screenshot)
      setView("chat")
    })

    window.pulse?.onProactiveTrigger?.(async (data) => {
      if (settings.apiKey) {
        setIsLoading(true)
        try {
          const response = await analyzeScreenWithVision(
            settings.apiKey,
            data.screenshot,
            "Look at what the user is doing and provide a brief, helpful suggestion or insight. Be concise (1-2 sentences)."
          )
          setProactiveSuggestion(response)
          setCurrentScreenshot(data.screenshot)
        } catch (error) {
          console.error("Proactive suggestion failed:", error)
        } finally {
          setIsLoading(false)
        }
      }
    })

    return () => {
      window.pulse?.removeAllListeners?.()
    }
  }, [settings.apiKey, messages.length])

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

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

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
    setProactiveSuggestion(null)

    try {
      if (!settings.apiKey) {
        const assistantMessage: Message = {
          id: `msg-${Date.now()}-resp`,
          role: "assistant",
          content: "Please set your API key in settings to use Pulse."
        }
        setMessages((prev) => [...prev, assistantMessage])
        setIsLoading(false)
        return
      }

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

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-resp`,
        role: "assistant",
        content: fullResponse
      }

      setMessages((prev) => [...prev, assistantMessage])
      setStreamingContent("")
      setCurrentScreenshot(null)
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: `msg-${Date.now()}-err`,
        role: "assistant",
        content: "Something went wrong. Please try again."
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCapture = async () => {
    const screenshot = await window.pulse?.captureScreen?.()
    if (screenshot) {
      setCurrentScreenshot(screenshot)
      setView("chat")
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    setView("chat")
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleClose = () => {
    window.pulse?.hideWidget?.()
  }

  if (!isInitialized) return null

  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
  }

  return (
    <div className="w-full h-full">
      <AnimatePresence>
        {showSettings && (
          <SettingsWindow isOpen={showSettings} onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        className="w-full h-full rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "rgba(20, 20, 25, 0.92)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)"
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span className="text-white/80 font-medium text-sm">Pulse</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {view === "suggestions" && (
              <SuggestionsView
                key="suggestions"
                proactiveSuggestion={proactiveSuggestion}
                screenshot={currentScreenshot}
                isLoading={isLoading}
                onSuggestionClick={handleSuggestionClick}
                onStartChat={() => setView("chat")}
              />
            )}

            {view === "chat" && (
              <ChatView
                key="chat"
                messages={messages}
                streamingContent={streamingContent}
                isLoading={isLoading}
                screenshot={currentScreenshot}
              />
            )}

            {view === "voice" && (
              <VoiceView
                key="voice"
                isListening={isListening}
                transcript={inputValue}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCapture}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-colors"
              title="Screenshot"
            >
              <Camera size={18} />
            </button>
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-2 rounded-lg transition-colors ${
                isListening
                  ? "bg-red-500/20 text-red-400"
                  : "bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70"
              }`}
              title="Voice"
            >
              <Mic size={18} />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isListening ? "Listening..." : "Ask anything..."}
              className="flex-1 bg-white/5 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-1 focus:ring-white/20"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className={`p-2 rounded-lg transition-colors ${
                inputValue.trim() && !isLoading
                  ? "bg-indigo-500 text-white hover:bg-indigo-600"
                  : "bg-white/5 text-white/30"
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function SuggestionsView({
  proactiveSuggestion,
  screenshot,
  isLoading,
  onSuggestionClick,
  onStartChat
}: {
  proactiveSuggestion: string | null
  screenshot: string | null
  isLoading: boolean
  onSuggestionClick: (s: string) => void
  onStartChat: () => void
}) {
  const quickActions = [
    { label: "Summarize this page", icon: "📝" },
    { label: "Help me write...", icon: "✍️" },
    { label: "Explain this code", icon: "💻" },
    { label: "What should I do next?", icon: "🤔" }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full p-4 overflow-y-auto"
    >
      {/* Proactive suggestion */}
      {(proactiveSuggestion || isLoading) && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-indigo-400" />
            <span className="text-xs text-white/50 uppercase tracking-wider">Suggestion</span>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
            {isLoading ? (
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full"
                />
                Analyzing your screen...
              </div>
            ) : (
              <>
                {screenshot && (
                  <img
                    src={screenshot}
                    alt="Context"
                    className="w-full h-16 object-cover rounded-lg mb-2 opacity-50"
                  />
                )}
                <p className="text-white/80 text-sm">{proactiveSuggestion}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="space-y-2">
        <span className="text-xs text-white/40 uppercase tracking-wider">Quick Actions</span>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => onSuggestionClick(action.label)}
              className="flex items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10
                       text-white/70 hover:text-white text-sm text-left transition-colors"
            >
              <span>{action.icon}</span>
              <span className="truncate">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Start chat prompt */}
      <button
        onClick={onStartChat}
        className="w-full mt-4 p-3 rounded-xl border border-dashed border-white/10
                 text-white/40 hover:text-white/60 hover:border-white/20 text-sm transition-colors
                 flex items-center justify-center gap-2"
      >
        <MessageSquare size={16} />
        Start a conversation
      </button>
    </motion.div>
  )
}

function ChatView({
  messages,
  streamingContent,
  isLoading,
  screenshot
}: {
  messages: Message[]
  streamingContent: string
  isLoading: boolean
  screenshot: string | null
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto p-3 space-y-3"
    >
      {/* Screenshot preview if attached */}
      {screenshot && messages.length === 0 && (
        <div className="flex justify-center">
          <img
            src={screenshot}
            alt="Screenshot"
            className="max-h-20 rounded-lg opacity-70"
          />
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-indigo-500/30 text-white"
                : "bg-white/5 text-white/90"
            }`}
          >
            {msg.screenshot && (
              <img
                src={msg.screenshot}
                alt="Context"
                className="max-h-16 rounded-lg mb-2 opacity-70"
              />
            )}
            {msg.role === "assistant" ? (
              <MarkdownRenderer content={msg.content} />
            ) : (
              <p>{msg.content}</p>
            )}
          </div>
        </div>
      ))}

      {streamingContent && (
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-white/5 text-white/90">
            <MarkdownRenderer content={streamingContent} />
            <span className="inline-block w-1.5 h-3 bg-white/50 animate-pulse ml-0.5" />
          </div>
        </div>
      )}

      {isLoading && !streamingContent && (
        <div className="flex justify-start">
          <div className="rounded-xl px-3 py-2 bg-white/5">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-white/50"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </motion.div>
  )
}

function VoiceView({
  isListening,
  transcript
}: {
  isListening: boolean
  transcript: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center p-6"
    >
      {/* Animated mic icon */}
      <div className="relative mb-6">
        <motion.div
          className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center"
          animate={
            isListening
              ? {
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    "0 0 0 0 rgba(99, 102, 241, 0.4)",
                    "0 0 0 20px rgba(99, 102, 241, 0)",
                    "0 0 0 0 rgba(99, 102, 241, 0)"
                  ]
                }
              : {}
          }
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Mic size={32} className="text-white" />
        </motion.div>
      </div>

      <p className="text-white/50 text-sm mb-4">
        {isListening ? "Listening..." : "Press the mic button to speak"}
      </p>

      {transcript && (
        <div className="w-full p-3 rounded-xl bg-white/5 text-white/80 text-sm text-center">
          "{transcript}"
        </div>
      )}
    </motion.div>
  )
}

// Speech recognition type
declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}
