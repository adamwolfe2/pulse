import { motion } from "framer-motion"
import { useGhostStore } from "~/stores/ghostStore"
import { useDarkMode } from "~/hooks/useDarkMode"
import { Button } from "~/components/shared/Button"

export function WelcomeStep() {
  const { setOnboardingStep } = useGhostStore()
  const isDark = useDarkMode()

  return (
    <div className="p-6 text-center">
      <motion.div
        className="text-5xl mb-4"
        animate={{
          y: [0, -8, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        👻
      </motion.div>

      <h1
        className={`
          text-2xl font-bold mb-2
          ${isDark ? "text-white" : "text-ghost-900"}
        `}
      >
        Welcome to GhostBar
      </h1>

      <p
        className={`
          text-sm mb-6
          ${isDark ? "text-white/70" : "text-ghost-600"}
        `}
      >
        Your intelligent AI browser companion. Get helpful suggestions as you
        browse, powered by Claude AI.
      </p>

      <div
        className={`
          text-left text-sm mb-6 space-y-2
          ${isDark ? "text-white/60" : "text-ghost-500"}
        `}
      >
        <div className="flex items-center gap-2">
          <span>✨</span>
          <span>Smart page analysis & suggestions</span>
        </div>
        <div className="flex items-center gap-2">
          <span>📋</span>
          <span>Clipboard code explanation</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🎯</span>
          <span>Context-aware actions</span>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={() => setOnboardingStep(1)}
        className="w-full"
      >
        Get Started
      </Button>
    </div>
  )
}
