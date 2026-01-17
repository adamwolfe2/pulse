import { motion } from "framer-motion"
import { useGhostStore } from "~/stores/ghostStore"
import { useDarkMode } from "~/hooks/useDarkMode"
import { Button } from "~/components/shared/Button"

export function CompletionStep() {
  const { completeOnboarding, settings } = useGhostStore()
  const isDark = useDarkMode()

  return (
    <div className="p-6 text-center">
      <motion.div
        className="text-5xl mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: [0, 360] }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
      >
        🎉
      </motion.div>

      <h2
        className={`
          text-xl font-bold mb-2
          ${isDark ? "text-white" : "text-ghost-900"}
        `}
      >
        You're All Set!
      </h2>

      <p
        className={`
          text-sm mb-6
          ${isDark ? "text-white/60" : "text-ghost-500"}
        `}
      >
        GhostBar is ready to help you browse smarter.
        {settings.personalization.name && (
          <span className="block mt-1">
            Welcome aboard, {settings.personalization.name}! 👻
          </span>
        )}
      </p>

      <div
        className={`
          text-left text-sm mb-6 p-4 rounded-xl
          ${isDark ? "bg-white/5" : "bg-ghost-50"}
        `}
      >
        <p
          className={`
            font-medium mb-2
            ${isDark ? "text-white/80" : "text-ghost-700"}
          `}
        >
          Quick Tips:
        </p>
        <ul
          className={`
            space-y-1
            ${isDark ? "text-white/60" : "text-ghost-500"}
          `}
        >
          <li>
            • Press{" "}
            <kbd
              className={`
                px-1 py-0.5 rounded text-xs
                ${isDark ? "bg-white/10" : "bg-ghost-200"}
              `}
            >
              {settings.shortcuts.toggle}
            </kbd>{" "}
            to toggle visibility
          </li>
          <li>• Click the floating bar to see suggestions</li>
          <li>
            • Press{" "}
            <kbd
              className={`
                px-1 py-0.5 rounded text-xs
                ${isDark ? "bg-white/10" : "bg-ghost-200"}
              `}
            >
              Esc
            </kbd>{" "}
            to dismiss
          </li>
        </ul>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={completeOnboarding}
        className="w-full"
      >
        Start Browsing
      </Button>
    </div>
  )
}
