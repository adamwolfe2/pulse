import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, Send, Camera, X, Sparkles, History, Settings, Clipboard, ChevronDown, ChevronUp, Minimize2, Maximize2 } from "lucide-react"
import { usePulseStore, initializeApiKey } from "./stores/pulseStore"
import { streamChat } from "./lib/claude"
import { MarkdownRenderer } from "./components/MarkdownRenderer"
import { Logo } from "./components/Logo"
import { CommandPalette } from "./components/CommandPalette"
import { ModelSelector } from "./components/ModelSelector"
import { SettingsWindow } from "./components/Settings/SettingsWindow"
import { OnboardingFlow } from "./components/Onboarding/OnboardingFlow"
import { ConversationSidebar } from "./components/ConversationSidebar"
import { KeyboardShortcutsPanel } from "./components/KeyboardShortcutsPanel"
import { MessageActions } from "./components/MessageActions"
import { useToast } from "./components/Toast"
import { useGlobalShortcuts } from "./hooks/useKeyboardNavigation"
import {
  saveConversation,
  getConversations,
  createConversation,
  type Conversation
} from "./lib/persistence"
import { parseCommand, executeCommand, type Command } from "./lib/commands"
import { getTimeContext, getContextualQuickActions, trackInteraction } from "./lib/context"
import { readClipboard, formatClipboardForContext } from "./lib/clipboard"
import { getStoredModelId, setStoredModelId, getDefaultModel } from "./lib/models"
import { initializeTrial, getLicenseStatus, canPerformAction } from "./lib/licensing"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  screenshot?: string
  timestamp?: number
}

type WidgetView = "home" | "chat" | "voice"

// Atoll-style spring animations
// Based on: spring(response: 0.42, dampingFraction: 0.8) for open
// And: spring(response: 0.45, dampingFraction: 1.0) for close
const springOpen = {
  type: "spring" as const,
  stiffness: 224,
  damping: 24,
  mass: 1
}

const springClose = {
  type: "spring" as const,
  stiffness: 195,
  damping: 28,
  mass: 1
}

const springBouncy = {
  type: "spring" as const,
  stiffness: 400,
  damping: 17,
  mass: 1
}

const springSmooth = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 1
}

// View transition - scale 0.8 → 1.0 with opacity
const viewTransition = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.85 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }
}

export function WidgetApp() {
  // Debug logging
  console.log("[WidgetApp] Component rendering...")

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
  const [isHovered, setIsHovered] = useState(false)

  // New feature states
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [selectedModelId, setSelectedModelId] = useState(getStoredModelId())
  const [clipboardContent, setClipboardContent] = useState<string | null>(null)
  const [contextGreeting, setContextGreeting] = useState("")
  const [isCompactMode, setIsCompactMode] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const { settings, updateSettings } = usePulseStore()
  const toast = useToast()

  // Global keyboard shortcuts
  const shortcuts = useMemo(() => ({
    "cmd+shift+g": () => window.pulse?.hideWidget?.(),
    "cmd+shift+s": () => handleCapture(),
    "cmd+shift+v": () => startListening(),
    "cmd+n": () => handleNewConversation(),
    "cmd+,": () => setShowSettings(true),
    "cmd+k": () => setShowCommandPalette(true),
    "cmd+h": () => setShowHistory(true),
    "cmd+shift+?": () => setShowShortcuts(true),
  }), [])

  useGlobalShortcuts(shortcuts)

  console.log("[WidgetApp] Hooks initialized, isInitialized:", isInitialized)

  // Initialize
  useEffect(() => {
    async function initialize() {
      try {
        // Initialize licensing/trial
        initializeTrial()

        // Load API key
        const apiKey = await initializeApiKey()
        if (apiKey) {
          updateSettings({ apiKey })
        }

        // Check if onboarding is needed
        const onboardingComplete = localStorage.getItem("pulse_onboarding_complete")
        if (!onboardingComplete) {
          setShowOnboarding(true)
        }

        // Get context-aware greeting
        const context = getTimeContext()
        setContextGreeting(context.greeting)
      } catch (e) {
        console.log("Initialization error:", e)
      }
      setIsInitialized(true)
    }
    initialize()
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

    // Tray menu actions
    window.pulse?.onOpenSettings?.(() => {
      setShowSettings(true)
    })

    window.pulse?.onOpenHistory?.(() => {
      setShowHistory(true)
    })

    window.pulse?.onOpenShortcuts?.(() => {
      setShowShortcuts(true)
    })

    window.pulse?.onNewConversation?.(() => {
      handleNewConversation()
    })

    window.pulse?.onWidgetModeChanged?.((data) => {
      setIsCompactMode(data.mode === "compact")
    })

    return () => {
      window.pulse?.removeAllListeners?.()
    }
  }, [])

  // Toggle compact/expanded mode
  const toggleCompactMode = useCallback(() => {
    const newMode = isCompactMode ? "expanded" : "compact"
    window.pulse?.setWidgetMode?.(newMode)
    setIsCompactMode(!isCompactMode)
  }, [isCompactMode])

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

    // Check if it's a command
    const { command, args } = parseCommand(text)
    if (command) {
      handleCommand(command, args)
      return
    }

    // Check licensing limits
    const canSend = canPerformAction("send_message")
    if (!canSend.allowed) {
      setMessages((prev) => [
        ...prev,
        { id: `msg-${Date.now()}-limit`, role: "assistant", content: canSend.reason || "Message limit reached." }
      ])
      return
    }

    stopListening()
    setView("chat")
    trackInteraction()

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
      screenshot: currentScreenshot || undefined,
      timestamp: Date.now()
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputValue("")
    setIsLoading(true)
    setStreamingContent("")
    setShowCommandPalette(false)

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

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-resp`,
        role: "assistant",
        content: fullResponse,
        timestamp: Date.now()
      }

      const finalMessages = [...newMessages, assistantMessage]
      setMessages(finalMessages)
      setStreamingContent("")
      setCurrentScreenshot(null)

      // Save conversation
      const conv = currentConversation || createConversation([], selectedModelId)
      conv.messages = finalMessages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        screenshot: m.screenshot,
        timestamp: m.timestamp || Date.now()
      }))
      conv.updatedAt = Date.now()
      saveConversation(conv)
      setCurrentConversation(conv)
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setMessages((prev) => [
        ...prev,
        { id: `msg-${Date.now()}-err`, role: "assistant", content: "Something went wrong. Please try again." }
      ])
      toast.error("Failed to send message", errorMessage)
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
      toast.success("API key saved", "You can now start chatting")
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

  // Handle command execution
  const handleCommand = useCallback((command: Command, args: string) => {
    const result = executeCommand(command, args)
    setShowCommandPalette(false)

    switch (result.type) {
      case "action":
        switch (result.value) {
          case "CLEAR_CHAT":
            setMessages([])
            setCurrentConversation(null)
            break
          case "NEW_CONVERSATION":
            setMessages([])
            setCurrentConversation(null)
            setView("home")
            break
          case "SHOW_HISTORY":
            setShowHistory(true)
            break
          case "OPEN_SETTINGS":
            setShowSettings(true)
            break
          case "CAPTURE_SCREEN":
            handleCapture()
            break
          case "VOICE_MODE":
            startListening()
            break
          case "INCLUDE_CLIPBOARD":
            readClipboard().then(content => {
              const formatted = formatClipboardForContext(content)
              setClipboardContent(formatted)
              setInputValue(prev => prev + " " + formatted)
            })
            break
        }
        if (result.clearInput) setInputValue("")
        break
      case "prompt":
        setInputValue(result.value)
        setView("chat")
        inputRef.current?.focus()
        break
      case "insert":
        setInputValue(prev => prev + " " + result.value)
        break
    }
  }, [startListening])

  // Handle input change with command detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // Show command palette for /, @, or # prefixes
    if (value.startsWith("/") || value.startsWith("@") || value.startsWith("#")) {
      setShowCommandPalette(true)
    } else {
      setShowCommandPalette(false)
    }
  }

  // Handle model change
  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId)
    setStoredModelId(modelId)
  }

  // Handle clipboard paste
  const handlePasteClipboard = async () => {
    try {
      const content = await readClipboard()
      const formatted = formatClipboardForContext(content)
      setClipboardContent(formatted)
      if (content.type !== "empty") {
        setInputValue(prev => prev ? prev + "\n\n" + formatted : formatted)
        setView("chat")
        toast.info("Clipboard content added", `Added ${content.type} from clipboard`)
      } else {
        toast.warning("Clipboard empty", "No content to paste")
      }
    } catch (error) {
      toast.error("Clipboard access failed", "Please check permissions")
    }
  }

  // Get context-aware quick actions
  const quickActions = getContextualQuickActions().map(action => ({
    ...action,
    action: action.prompt
      ? () => { setInputValue(action.prompt); setView("chat"); }
      : action.label.includes("screen")
        ? () => handleCapture()
        : action.label.includes("Voice")
          ? startListening
          : () => {}
  }))

  // Handle conversation selection from history
  const handleSelectConversation = (convId: string) => {
    const conversations = getConversations()
    const conv = conversations.find(c => c.id === convId)
    if (conv) {
      setCurrentConversation(conv)
      setMessages(conv.messages.map(m => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        screenshot: m.screenshot,
        timestamp: m.timestamp
      })))
      setView("chat")
    }
  }

  // Handle new conversation
  const handleNewConversation = () => {
    setMessages([])
    setCurrentConversation(null)
    setView("home")
  }

  // Handle message regeneration
  const handleRegenerate = useCallback(async (messageId: string) => {
    // Find the message index
    const msgIndex = messages.findIndex(m => m.id === messageId)
    if (msgIndex === -1 || messages[msgIndex].role !== "assistant") return

    // Find the preceding user message
    let userMsgIndex = msgIndex - 1
    while (userMsgIndex >= 0 && messages[userMsgIndex].role !== "user") {
      userMsgIndex--
    }
    if (userMsgIndex < 0) return

    const userMessage = messages[userMsgIndex]

    // Remove the assistant message we're regenerating
    const newMessages = messages.slice(0, msgIndex)
    setMessages(newMessages)
    setIsLoading(true)
    setStreamingContent("")

    try {
      const chatMessages = newMessages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
      }))

      let fullResponse = ""
      await streamChat(
        settings.apiKey,
        chatMessages,
        undefined,
        (chunk) => {
          fullResponse += chunk
          setStreamingContent(fullResponse)
        }
      )

      const newAssistantMsg: Message = {
        id: `msg-${Date.now()}-regen`,
        role: "assistant",
        content: fullResponse,
        timestamp: Date.now()
      }

      setMessages([...newMessages, newAssistantMsg])
      setStreamingContent("")
      toast.success("Response regenerated")
    } catch (error) {
      console.error("Regenerate error:", error)
      toast.error("Failed to regenerate", "Please try again")
    } finally {
      setIsLoading(false)
    }
  }, [messages, settings.apiKey, toast])

  // Handle message feedback
  const handleFeedback = useCallback((messageId: string, type: "positive" | "negative") => {
    // Store feedback (could be sent to analytics or stored locally)
    console.log(`Feedback for message ${messageId}: ${type}`)

    // Show toast confirmation
    if (type === "positive") {
      toast.success("Thanks for your feedback!", "We appreciate your input")
    } else {
      toast.info("Feedback recorded", "We'll work on improving")
    }

    // Could also store in localStorage for analytics
    const feedbackData = JSON.parse(localStorage.getItem("pulse_feedback") || "[]")
    feedbackData.push({
      messageId,
      type,
      timestamp: Date.now()
    })
    localStorage.setItem("pulse_feedback", JSON.stringify(feedbackData))
  }, [toast])

  if (!isInitialized) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0f",
          borderRadius: 24
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{
            width: 32,
            height: 32,
            border: "2px solid rgba(255,255,255,0.2)",
            borderTopColor: "rgba(255,255,255,0.6)",
            borderRadius: "50%"
          }}
        />
      </div>
    )
  }

  // Show onboarding if needed
  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
  }

  return (
    <>
      {/* Settings Modal */}
      <SettingsWindow isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Keyboard Shortcuts Panel */}
      <KeyboardShortcutsPanel isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* Conversation History Sidebar */}
      <ConversationSidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        currentConversationId={currentConversation?.id || null}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
    <motion.div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        background: "#0a0a0f",
        borderRadius: 24
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: -30, scale: 0.92 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        borderRadius: isHovered ? 28 : 24
      }}
      transition={springOpen}
    >
      {/* Subtle gradient glow at top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 128,
          pointerEvents: "none",
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 100%)",
          borderRadius: "24px 24px 0 0"
        }}
      />

      {/* Content container */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header - minimal like notch closed state */}
        <motion.div
          className="flex items-center justify-between px-4 py-3"
          animate={{
            paddingTop: isHovered ? 14 : 12,
            paddingBottom: isHovered ? 14 : 12
          }}
          transition={springBouncy}
        >
          <motion.div
            className="flex items-center gap-2.5"
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ...springOpen, delay: 0.05 }}
          >
            <motion.div
              animate={{
                scale: isHovered ? 1.1 : 1,
                rotate: isHovered ? 3 : 0
              }}
              transition={springBouncy}
            >
              <Logo size={20} />
            </motion.div>
            <motion.span
              className="text-white font-semibold text-sm tracking-tight"
              animate={{ opacity: isHovered ? 1 : 0.9 }}
            >
              Pulse
            </motion.span>
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-green-400"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          <div className="flex items-center gap-1">
            {/* Model selector - compact (hidden in compact mode) */}
            {!isCompactMode && (
              <ModelSelector
                selectedModelId={selectedModelId}
                onSelectModel={handleModelChange}
                compact
              />
            )}

            {/* History button (hidden in compact mode) */}
            {!isCompactMode && (
              <motion.button
                onClick={() => setShowHistory(true)}
                className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                transition={springBouncy}
                title="Conversation History"
              >
                <History size={14} />
              </motion.button>
            )}

            {/* Settings button */}
            {!isCompactMode && (
              <motion.button
                onClick={() => setShowSettings(true)}
                className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                transition={springBouncy}
                title="Settings"
              >
                <Settings size={14} />
              </motion.button>
            )}

            {/* Compact/Expand toggle */}
            <motion.button
              onClick={toggleCompactMode}
              className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              transition={springBouncy}
              title={isCompactMode ? "Expand" : "Compact"}
            >
              {isCompactMode ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </motion.button>

            {/* Close button */}
            <motion.button
              onClick={handleClose}
              className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              transition={springBouncy}
            >
              <X size={14} />
            </motion.button>
          </div>
        </motion.div>

        {/* Separator line (hidden in compact mode) */}
        {!isCompactMode && (
          <motion.div
            className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ ...springOpen, delay: 0.1 }}
          />
        )}

        {/* Main content area with view transitions (hidden in compact mode) */}
        {!isCompactMode && <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {view === "home" && (
              <motion.div
                key="home"
                {...viewTransition}
                className="h-full p-4 flex flex-col"
              >
                {/* Greeting */}
                <motion.div
                  className="text-center mb-4"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springSmooth, delay: 0.1 }}
                >
                  <h2 className="text-white text-lg font-medium mb-1">
                    {contextGreeting || "How can I help?"}
                  </h2>
                  <p className="text-white/50 text-sm">
                    Type / for commands, @ for context, # for formatting
                  </p>
                </motion.div>

                {/* Quick actions - staggered animation */}
                <div className="grid grid-cols-2 gap-2.5 flex-1">
                  {quickActions.map((action, i) => (
                    <motion.button
                      key={action.label}
                      onClick={action.action}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ ...springOpen, delay: 0.15 + i * 0.05 }}
                      whileHover={{
                        scale: 1.03,
                        backgroundColor: "rgba(255,255,255,0.08)",
                        transition: springBouncy
                      }}
                      whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl
                               bg-white/[0.03] border border-white/[0.06] text-white/80 hover:text-white
                               transition-colors"
                    >
                      <motion.span
                        className="text-2xl"
                        whileHover={{ scale: 1.15, transition: springBouncy }}
                      >
                        {action.icon}
                      </motion.span>
                      <span className="text-xs text-center leading-tight font-medium">{action.label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* API Key prompt if needed */}
                <AnimatePresence>
                  {showApiKeyInput && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={springSmooth}
                      className="mt-3 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20"
                    >
                      <p className="text-white/70 text-xs mb-2 font-medium">Enter your Claude API key:</p>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder="sk-ant-..."
                          className="flex-1 px-3 py-2 rounded-xl bg-black/40 text-white text-sm
                                   placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/40
                                   border border-white/10"
                        />
                        <motion.button
                          onClick={handleSaveApiKey}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-semibold"
                        >
                          Save
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {view === "chat" && (
              <motion.div
                key="chat"
                {...viewTransition}
                className="h-full"
              >
                <ChatView
                  messages={messages}
                  streamingContent={streamingContent}
                  isLoading={isLoading}
                  screenshot={currentScreenshot}
                  onClearScreenshot={() => setCurrentScreenshot(null)}
                  onRegenerate={handleRegenerate}
                  onFeedback={handleFeedback}
                />
              </motion.div>
            )}

            {view === "voice" && (
              <motion.div
                key="voice"
                {...viewTransition}
                className="h-full"
              >
                <VoiceView isListening={isListening} transcript={inputValue} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>}

        {/* Input area */}
        <motion.div
          className={`relative ${isCompactMode ? "p-2" : "p-3 pt-2"}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springOpen, delay: 0.2 }}
        >
          {/* Command Palette */}
          {!isCompactMode && (
            <CommandPalette
              input={inputValue}
              isVisible={showCommandPalette}
              onSelect={handleCommand}
              onClose={() => setShowCommandPalette(false)}
            />
          )}

          {/* Separator (hidden in compact mode) */}
          {!isCompactMode && (
            <div className="mx-1 mb-2 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          )}

          <div className="flex items-center gap-2">
            {/* Screenshot button (hidden in compact mode) */}
            {!isCompactMode && (
              <motion.button
                onClick={handleCapture}
                whileHover={{ scale: 1.12, backgroundColor: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.92 }}
                transition={springBouncy}
                className="p-2.5 rounded-xl bg-white/[0.04] text-white/50 hover:text-white transition-colors"
                title="Screenshot"
              >
                <Camera size={17} />
              </motion.button>
            )}
            {/* Voice button (hidden in compact mode) */}
            {!isCompactMode && (
              <motion.button
                onClick={isListening ? stopListening : startListening}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                transition={springBouncy}
                className={`p-2.5 rounded-xl transition-all ${
                  isListening
                    ? "bg-red-500/20 text-red-400 ring-2 ring-red-500/30"
                    : "bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/10"
                }`}
                title="Voice"
              >
                <Mic size={17} />
              </motion.button>
            )}
            {/* Clipboard button (hidden in compact mode) */}
            {!isCompactMode && (
              <motion.button
                onClick={handlePasteClipboard}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                transition={springBouncy}
                className="p-2.5 rounded-xl bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Paste from Clipboard"
              >
                <Clipboard size={17} />
              </motion.button>
            )}
            <motion.div
              className="flex-1 relative"
              animate={{ scale: isHovered ? 1.01 : 1 }}
              transition={springSmooth}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !showCommandPalette) handleSend()
                  if (e.key === "Escape") setShowCommandPalette(false)
                }}
                onFocus={() => view === "home" && setView("chat")}
                placeholder={isListening ? "Listening..." : "Ask anything... (/ for commands)"}
                className="w-full bg-white/[0.04] text-white placeholder-white/30 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/[0.06]
                         transition-all border border-white/[0.06]"
              />
            </motion.div>
            <motion.button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              whileHover={{ scale: inputValue.trim() && !isLoading ? 1.08 : 1 }}
              whileTap={{ scale: inputValue.trim() && !isLoading ? 0.92 : 1 }}
              transition={springBouncy}
              className={`p-2.5 rounded-xl transition-all ${
                inputValue.trim() && !isLoading
                  ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-white/[0.04] text-white/25"
              }`}
            >
              <Send size={17} />
            </motion.button>
          </div>
          {/* Shortcut hints (hidden in compact mode) */}
          {!isCompactMode && (
            <motion.p
              className="text-white/25 text-[10px] mt-2 text-center font-medium tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              ⌘⇧G toggle • /help commands • ⌘⇧S screenshot
            </motion.p>
          )}
        </motion.div>
      </div>
    </motion.div>
    </>
  )
}

function ChatView({
  messages,
  streamingContent,
  isLoading,
  screenshot,
  onClearScreenshot,
  onRegenerate,
  onFeedback
}: {
  messages: Message[]
  streamingContent: string
  isLoading: boolean
  screenshot: string | null
  onClearScreenshot: () => void
  onRegenerate?: (messageId: string) => void
  onFeedback?: (messageId: string, type: "positive" | "negative") => void
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  return (
    <div className="h-full flex flex-col">
      {/* Screenshot preview */}
      <AnimatePresence>
        {screenshot && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={springSmooth}
            className="px-3 py-2 border-b border-white/5"
          >
            <div className="flex items-center gap-2">
              <img src={screenshot} alt="Screenshot" className="h-10 rounded-lg opacity-70" />
              <span className="text-white/50 text-xs flex-1">Screenshot attached</span>
              <motion.button
                onClick={onClearScreenshot}
                className="text-white/40 hover:text-white/70 p-1"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={14} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
        {messages.length === 0 && !streamingContent && (
          <motion.div
            className="text-center text-white/40 py-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springSmooth}
          >
            <Sparkles size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start a conversation</p>
          </motion.div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...springOpen, delay: Math.min(i * 0.03, 0.15) }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} group`}
            onMouseEnter={() => setHoveredMessageId(msg.id)}
            onMouseLeave={() => setHoveredMessageId(null)}
          >
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={springBouncy}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-white border border-indigo-500/20"
                    : "bg-white/[0.04] text-white/90 border border-white/[0.06]"
                }`}
              >
                {msg.role === "assistant" ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  <p>{msg.content}</p>
                )}
              </motion.div>

              {/* Message Actions - show on hover */}
              <AnimatePresence>
                {hoveredMessageId === msg.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className={`absolute -bottom-8 ${msg.role === "user" ? "right-0" : "left-0"}`}
                  >
                    <MessageActions
                      content={msg.content}
                      messageId={msg.id}
                      isAssistant={msg.role === "assistant"}
                      onRegenerate={msg.role === "assistant" ? () => onRegenerate?.(msg.id) : undefined}
                      onFeedback={msg.role === "assistant" ? (type) => onFeedback?.(msg.id, type) : undefined}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}

        {/* Streaming response */}
        <AnimatePresence>
          {streamingContent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={springSmooth}
              className="flex justify-start"
            >
              <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm bg-white/[0.04] text-white/90 border border-white/[0.06]">
                <MarkdownRenderer content={streamingContent} />
                <motion.span
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block w-1.5 h-4 bg-indigo-400 rounded-sm ml-0.5 -mb-0.5"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading indicator */}
        <AnimatePresence>
          {isLoading && !streamingContent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={springSmooth}
              className="flex justify-start"
            >
              <div className="rounded-2xl px-4 py-3 bg-white/[0.04] border border-white/[0.06]">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-indigo-400"
                      animate={{
                        y: [0, -8, 0],
                        opacity: [0.4, 1, 0.4]
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.12,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

function VoiceView({ isListening, transcript }: { isListening: boolean; transcript: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      {/* Animated rings */}
      <div className="relative mb-6">
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute rounded-full border-2 border-indigo-500/20"
            style={{
              inset: -ring * 18,
            }}
            animate={isListening ? {
              scale: [1, 1.15, 1],
              opacity: [0.25, 0.08, 0.25]
            } : { scale: 1, opacity: 0.15 }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay: ring * 0.25,
              ease: "easeInOut"
            }}
          />
        ))}
        <motion.div
          className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                     flex items-center justify-center shadow-xl shadow-indigo-500/30"
          animate={isListening ? {
            scale: [1, 1.08, 1],
            boxShadow: [
              "0 20px 25px -5px rgba(99, 102, 241, 0.3)",
              "0 25px 35px -5px rgba(99, 102, 241, 0.4)",
              "0 20px 25px -5px rgba(99, 102, 241, 0.3)"
            ]
          } : {}}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Mic size={32} className="text-white" />
        </motion.div>
      </div>

      <motion.p
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="text-white/60 text-sm mb-4 font-medium"
      >
        {isListening ? "Listening..." : "Click the mic to speak"}
      </motion.p>

      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={springSmooth}
            className="w-full p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06]
                     text-white/80 text-sm text-center italic"
          >
            "{transcript}"
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}
