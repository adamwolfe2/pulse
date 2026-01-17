import { useState } from "react"
import { motion } from "framer-motion"
import { useGhostStore } from "~/stores/ghostStore"
import { useDarkMode } from "~/hooks/useDarkMode"
import { useClipboard } from "~/hooks/useClipboard"
import { Button } from "~/components/shared/Button"

export function PermissionsStep() {
  const { onboarding, setOnboardingStep, setPermission } = useGhostStore()
  const { requestPermission: requestClipboard } = useClipboard()
  const isDark = useDarkMode()
  const [loading, setLoading] = useState<string | null>(null)

  const permissions = [
    {
      id: "storage" as const,
      icon: "💾",
      name: "Storage",
      description: "Save your preferences locally",
      required: true
    },
    {
      id: "activeTab" as const,
      icon: "🌐",
      name: "Active Tab",
      description: "Read current page content",
      required: true
    },
    {
      id: "clipboard" as const,
      icon: "📋",
      name: "Clipboard",
      description: "Analyze copied code & text",
      required: false
    }
  ]

  const handlePermission = async (id: "storage" | "activeTab" | "clipboard") => {
    setLoading(id)

    try {
      if (id === "clipboard") {
        const granted = await requestClipboard()
        setPermission(id, granted)
      } else {
        // Storage and activeTab are granted via manifest
        setPermission(id, true)
      }
    } catch {
      setPermission(id, false)
    }

    setLoading(null)
  }

  const canContinue =
    onboarding.permissions.storage && onboarding.permissions.activeTab

  return (
    <div className="p-6">
      <h2
        className={`
          text-xl font-bold mb-2 text-center
          ${isDark ? "text-white" : "text-ghost-900"}
        `}
      >
        Permissions
      </h2>

      <p
        className={`
          text-sm mb-6 text-center
          ${isDark ? "text-white/60" : "text-ghost-500"}
        `}
      >
        GhostBar needs a few permissions to work its magic.
      </p>

      <div className="space-y-3 mb-6">
        {permissions.map((perm) => (
          <motion.div
            key={perm.id}
            className={`
              flex items-center gap-3 p-3 rounded-xl
              ${isDark ? "bg-white/5" : "bg-ghost-50"}
            `}
            whileHover={{ scale: 1.01 }}
          >
            <span className="text-xl">{perm.icon}</span>
            <div className="flex-1">
              <p
                className={`
                  text-sm font-medium
                  ${isDark ? "text-white" : "text-ghost-900"}
                `}
              >
                {perm.name}
                {perm.required && (
                  <span className="text-xs text-red-500 ml-1">*</span>
                )}
              </p>
              <p
                className={`
                  text-xs
                  ${isDark ? "text-white/50" : "text-ghost-400"}
                `}
              >
                {perm.description}
              </p>
            </div>
            <Button
              variant={onboarding.permissions[perm.id] ? "primary" : "secondary"}
              size="sm"
              onClick={() => handlePermission(perm.id)}
              disabled={loading === perm.id || onboarding.permissions[perm.id]}
            >
              {loading === perm.id
                ? "..."
                : onboarding.permissions[perm.id]
                  ? "✓"
                  : "Grant"}
            </Button>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={() => setOnboardingStep(0)}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={() => setOnboardingStep(2)}
          disabled={!canContinue}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
