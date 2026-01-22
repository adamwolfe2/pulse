import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Key, Shield, Sparkles, MessageSquare, Camera, Mic, ArrowRight, Check, ExternalLink, ListTodo, Zap } from "lucide-react"
import { Logo } from "../Logo"
import { usePulseStore } from "../../stores/pulseStore"

interface OnboardingFlowProps {
  onComplete: () => void
}

type OnboardingStep = "welcome" | "apiKey" | "features" | "permissions" | "complete"

const STEPS: OnboardingStep[] = ["welcome", "apiKey", "features", "permissions", "complete"]

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome")
  const [apiKey, setApiKey] = useState("")
  const [apiKeyError, setApiKeyError] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [isVaultSecure, setIsVaultSecure] = useState(true)
  const { updateSettings } = usePulseStore()

  useEffect(() => {
    // Check if vault is using secure encryption
    window.pulse?.vault?.isSecure?.().then(secure => {
      setIsVaultSecure(secure)
    })
  }, [])

  const currentStepIndex = STEPS.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100

  const goToStep = (step: OnboardingStep) => {
    setCurrentStep(step)
  }

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex])
    }
  }

  const validateApiKey = async () => {
    if (!apiKey.trim()) {
      setApiKeyError("Please enter your API key")
      return false
    }

    if (!apiKey.startsWith("sk-ant-")) {
      setApiKeyError("Invalid API key format. Claude API keys start with 'sk-ant-'")
      return false
    }

    setIsValidating(true)
    setApiKeyError("")

    try {
      // Test the API key with a minimal request
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }]
        })
      })

      if (response.ok || response.status === 200) {
        // Store in secure vault
        await window.pulse?.vault?.set("anthropic_api_key", apiKey)
        updateSettings({ apiKey })
        setIsValidating(false)
        return true
      } else if (response.status === 401) {
        setApiKeyError("Invalid API key. Please check and try again.")
      } else if (response.status === 429) {
        // Rate limited but key is valid
        await window.pulse?.vault?.set("anthropic_api_key", apiKey)
        updateSettings({ apiKey })
        setIsValidating(false)
        return true
      } else {
        setApiKeyError("Failed to validate API key. Please try again.")
      }
    } catch (error) {
      console.error("API key validation error:", error)
      // On network error, still save the key (user can test later)
      await window.pulse?.vault?.set("anthropic_api_key", apiKey)
      updateSettings({ apiKey })
      setIsValidating(false)
      return true
    }

    setIsValidating(false)
    return false
  }

  const handleApiKeySubmit = async () => {
    const isValid = await validateApiKey()
    if (isValid) {
      nextStep()
    }
  }

  const handleComplete = () => {
    // Mark onboarding as complete
    localStorage.setItem("pulse_onboarding_complete", "true")
    onComplete()
  }

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return <WelcomeStep onNext={nextStep} />
      case "apiKey":
        return (
          <ApiKeyStep
            apiKey={apiKey}
            setApiKey={setApiKey}
            error={apiKeyError}
            isValidating={isValidating}
            isVaultSecure={isVaultSecure}
            onSubmit={handleApiKeySubmit}
            onSkip={nextStep}
          />
        )
      case "features":
        return <FeaturesStep onNext={nextStep} />
      case "permissions":
        return <PermissionsStep onNext={nextStep} />
      case "complete":
        return <CompleteStep onFinish={handleComplete} />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-[560px] rounded-2xl overflow-hidden"
        style={{
          background: "rgba(30, 30, 30, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
        }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step indicators */}
        <div className="px-8 pb-6 flex justify-center gap-2">
          {STEPS.map((step, index) => (
            <button
              key={step}
              onClick={() => index <= currentStepIndex && goToStep(step)}
              disabled={index > currentStepIndex}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStepIndex
                  ? "w-6 bg-white"
                  : index < currentStepIndex
                  ? "bg-white/50 hover:bg-white/70"
                  : "bg-white/20"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center mb-6"
      >
        <div
          className="p-4 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            boxShadow: "0 8px 32px -4px rgba(99, 102, 241, 0.4)",
          }}
        >
          <Logo size={64} />
        </div>
      </motion.div>

      <motion.h1
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-white mb-3"
      >
        Welcome to Pulse
      </motion.h1>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-white/60 mb-8 max-w-sm mx-auto"
      >
        Your AI-powered desktop companion. Let's get you set up in just a few steps.
      </motion.p>

      <motion.button
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={onNext}
        className="px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 mx-auto"
        style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Get Started
        <ArrowRight size={18} />
      </motion.button>
    </div>
  )
}

function ApiKeyStep({
  apiKey,
  setApiKey,
  error,
  isValidating,
  isVaultSecure,
  onSubmit,
  onSkip
}: {
  apiKey: string
  setApiKey: (key: string) => void
  error: string
  isValidating: boolean
  isVaultSecure: boolean
  onSubmit: () => void
  onSkip: () => void
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-indigo-500/20">
          <Key size={20} className="text-indigo-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">Connect Claude API</h2>
      </div>

      <p className="text-white/60 mb-6">
        Enter your Anthropic API key to power Pulse's AI features. Your key is stored securely using system-level encryption.
      </p>

      {/* Security badge */}
      <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
        <Shield size={16} className="text-green-400" />
        <span className="text-green-400 text-sm">
          {isVaultSecure
            ? "Secured with OS keychain encryption"
            : "Stored with application-level encryption"}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-white/70 text-sm mb-2">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-white/30
              focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all
              ${error ? "border-red-500/50" : "border-white/10"}`}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          />
          {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
        </div>

        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
        >
          Get your API key from Anthropic Console
          <ExternalLink size={14} />
        </a>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onSkip}
            className="flex-1 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={onSubmit}
            disabled={isValidating}
            className="flex-1 px-4 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            }}
          >
            {isValidating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                Validating...
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function FeaturesStep({ onNext }: { onNext: () => void }) {
  const features = [
    {
      icon: <MessageSquare size={20} />,
      title: "Smart Chat",
      description: "Ask questions, get help with code, brainstorm ideas",
      shortcut: "⌘⇧G"
    },
    {
      icon: <Camera size={20} />,
      title: "Screen Capture",
      description: "Share your screen for context-aware assistance",
      shortcut: "⌘⇧S"
    },
    {
      icon: <Mic size={20} />,
      title: "Voice Mode",
      description: "Speak naturally and get instant responses",
      shortcut: "⌘⇧V"
    },
    {
      icon: <ListTodo size={20} />,
      title: "Quick Tasks",
      description: "Capture tasks instantly from anywhere",
      shortcut: "⌘⇧T"
    },
    {
      icon: <Zap size={20} />,
      title: "Focus Sprints",
      description: "Group tasks into timed work sessions",
      shortcut: "/sprint"
    },
    {
      icon: <Sparkles size={20} />,
      title: "Proactive Help",
      description: "Get suggestions based on what you're working on",
      shortcut: "Menu"
    }
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-purple-500/20">
          <Sparkles size={20} className="text-purple-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">What Pulse Can Do</h2>
      </div>

      <p className="text-white/60 mb-6">
        Access powerful AI assistance with these keyboard shortcuts:
      </p>

      <div className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5"
          >
            <div className="p-2 rounded-lg bg-white/10 text-white/70">
              {feature.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium text-sm">{feature.title}</h3>
              <p className="text-white/50 text-xs">{feature.description}</p>
            </div>
            <kbd className="px-2 py-1 rounded bg-white/10 text-white/60 text-xs font-mono">
              {feature.shortcut}
            </kbd>
          </motion.div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="w-full px-4 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2"
        style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        }}
      >
        Continue
        <ArrowRight size={18} />
      </button>
    </div>
  )
}

function PermissionsStep({ onNext }: { onNext: () => void }) {
  const [screenStatus, setScreenStatus] = useState<string>("unknown")
  const [micStatus, setMicStatus] = useState<string>("unknown")

  useEffect(() => {
    checkPermissions()
  }, [])

  const checkPermissions = async () => {
    const screen = await window.pulse?.checkScreenPermission?.()
    const mic = await window.pulse?.getMicPermission?.()
    setScreenStatus(screen || "unknown")
    setMicStatus(mic || "unknown")
  }

  const requestScreenPermission = async () => {
    // This will trigger the permission dialog
    await window.pulse?.captureScreen?.()
    setTimeout(checkPermissions, 500)
  }

  const requestMicPermission = async () => {
    const status = await window.pulse?.getMicPermission?.()
    setMicStatus(status || "unknown")
  }

  const permissions = [
    {
      icon: <Camera size={20} />,
      title: "Screen Recording",
      description: "Required for screenshot analysis",
      status: screenStatus,
      onRequest: requestScreenPermission
    },
    {
      icon: <Mic size={20} />,
      title: "Microphone",
      description: "Required for voice mode",
      status: micStatus,
      onRequest: requestMicPermission
    }
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-amber-500/20">
          <Shield size={20} className="text-amber-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">Permissions</h2>
      </div>

      <p className="text-white/60 mb-6">
        Pulse needs a few permissions to work its magic. You can skip this and grant them later.
      </p>

      <div className="space-y-3 mb-6">
        {permissions.map((perm) => (
          <div
            key={perm.title}
            className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5"
          >
            <div className="p-2 rounded-lg bg-white/10 text-white/70">
              {perm.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium text-sm">{perm.title}</h3>
              <p className="text-white/50 text-xs">{perm.description}</p>
            </div>
            {perm.status === "granted" ? (
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <Check size={16} />
                Granted
              </div>
            ) : (
              <button
                onClick={perm.onRequest}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-sm transition-colors"
              >
                Grant
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="w-full px-4 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2"
        style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        }}
      >
        Continue
        <ArrowRight size={18} />
      </button>
    </div>
  )
}

function CompleteStep({ onFinish }: { onFinish: () => void }) {
  const shortcuts = [
    { keys: "⌘⇧G", desc: "Open Pulse" },
    { keys: "⌘⇧T", desc: "Quick task" },
    { keys: "⌘⇧S", desc: "Screenshot" },
  ]

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 300 }}
        className="flex justify-center mb-6"
      >
        <div
          className="p-4 rounded-full"
          style={{
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            boxShadow: "0 8px 32px -4px rgba(34, 197, 94, 0.4)",
          }}
        >
          <Check size={40} className="text-white" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-white mb-3"
      >
        You're All Set!
      </motion.h1>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-white/60 mb-5 max-w-sm mx-auto"
      >
        Pulse is ready to help you work smarter. Here are some quick shortcuts to get started:
      </motion.p>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex justify-center gap-3 mb-5"
      >
        {shortcuts.map((s, i) => (
          <div
            key={s.keys}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-center"
          >
            <kbd className="block text-white/90 font-mono text-sm mb-1">{s.keys}</kbd>
            <span className="text-white/40 text-xs">{s.desc}</span>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6"
      >
        <p className="text-white/70 text-sm">
          Pulse lives in your menu bar. Hover near the top of your screen for quick access, or right-click the icon for settings.
        </p>
      </motion.div>

      <motion.button
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={onFinish}
        className="px-8 py-3 rounded-xl text-white font-medium"
        style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Start Using Pulse
      </motion.button>
    </div>
  )
}
