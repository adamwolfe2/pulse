import { useState } from "react"
import { motion } from "framer-motion"
import { useGhostStore } from "~/stores/ghostStore"
import { useDarkMode } from "~/hooks/useDarkMode"
import { Button } from "~/components/shared/Button"

const INTEREST_OPTIONS = [
  { id: "development", icon: "💻", label: "Development" },
  { id: "design", icon: "🎨", label: "Design" },
  { id: "research", icon: "🔬", label: "Research" },
  { id: "shopping", icon: "🛒", label: "Shopping" },
  { id: "news", icon: "📰", label: "News" },
  { id: "entertainment", icon: "🎬", label: "Entertainment" }
]

export function PersonalizationStep() {
  const { settings, updateSettings, setOnboardingStep } = useGhostStore()
  const isDark = useDarkMode()

  const [name, setName] = useState(settings.personalization.name || "")
  const [interests, setInterests] = useState<string[]>(
    settings.personalization.interests || []
  )
  const [apiKey, setApiKey] = useState(settings.apiKey || "")

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleContinue = () => {
    updateSettings({
      apiKey,
      personalization: {
        ...settings.personalization,
        name: name || undefined,
        interests
      }
    })
    setOnboardingStep(3)
  }

  return (
    <div className="p-6">
      <h2
        className={`
          text-xl font-bold mb-2 text-center
          ${isDark ? "text-white" : "text-ghost-900"}
        `}
      >
        Personalize GhostBar
      </h2>

      <p
        className={`
          text-sm mb-6 text-center
          ${isDark ? "text-white/60" : "text-ghost-500"}
        `}
      >
        Help us tailor suggestions to your needs.
      </p>

      {/* API Key */}
      <div className="mb-4">
        <label
          className={`
            block text-sm font-medium mb-1
            ${isDark ? "text-white/80" : "text-ghost-700"}
          `}
        >
          Claude API Key <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          className={`
            w-full px-3 py-2 rounded-lg text-sm
            ${
              isDark
                ? "bg-white/10 text-white placeholder-white/40 border-white/20"
                : "bg-ghost-50 text-ghost-900 placeholder-ghost-400 border-ghost-200"
            }
            border focus:outline-none focus:ring-2 focus:ring-blue-500/50
          `}
        />
        <p
          className={`
            text-xs mt-1
            ${isDark ? "text-white/40" : "text-ghost-400"}
          `}
        >
          Get your key at console.anthropic.com
        </p>
      </div>

      {/* Name (Optional) */}
      <div className="mb-4">
        <label
          className={`
            block text-sm font-medium mb-1
            ${isDark ? "text-white/80" : "text-ghost-700"}
          `}
        >
          Your Name (optional)
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="How should I address you?"
          className={`
            w-full px-3 py-2 rounded-lg text-sm
            ${
              isDark
                ? "bg-white/10 text-white placeholder-white/40 border-white/20"
                : "bg-ghost-50 text-ghost-900 placeholder-ghost-400 border-ghost-200"
            }
            border focus:outline-none focus:ring-2 focus:ring-blue-500/50
          `}
        />
      </div>

      {/* Interests */}
      <div className="mb-6">
        <label
          className={`
            block text-sm font-medium mb-2
            ${isDark ? "text-white/80" : "text-ghost-700"}
          `}
        >
          Interests (select all that apply)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {INTEREST_OPTIONS.map((option) => (
            <motion.button
              key={option.id}
              className={`
                p-2 rounded-lg text-center text-xs
                ${
                  interests.includes(option.id)
                    ? isDark
                      ? "bg-white/20 text-white"
                      : "bg-ghost-900 text-white"
                    : isDark
                      ? "bg-white/5 text-white/60 hover:bg-white/10"
                      : "bg-ghost-50 text-ghost-600 hover:bg-ghost-100"
                }
                transition-colors duration-200
              `}
              onClick={() => toggleInterest(option.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
            >
              <span className="block text-lg mb-1">{option.icon}</span>
              {option.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={() => setOnboardingStep(1)}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleContinue}
          disabled={!apiKey}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
