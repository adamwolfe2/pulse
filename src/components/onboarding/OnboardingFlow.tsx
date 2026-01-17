import { motion, AnimatePresence } from "framer-motion"
import { useGhostStore } from "~/stores/ghostStore"
import { useDarkMode } from "~/hooks/useDarkMode"
import { GlassContainer } from "~/components/shared/GlassContainer"
import { WelcomeStep } from "./WelcomeStep"
import { PermissionsStep } from "./PermissionsStep"
import { PersonalizationStep } from "./PersonalizationStep"
import { CompletionStep } from "./CompletionStep"

export function OnboardingFlow() {
  const { onboarding } = useGhostStore()
  const isDark = useDarkMode()

  if (onboarding.completed) return null

  const steps = [WelcomeStep, PermissionsStep, PersonalizationStep, CompletionStep]

  const CurrentStep = steps[onboarding.currentStep]

  return (
    <div
      className={`
        fixed inset-0 z-[2147483647] flex items-center justify-center
        bg-black/50 backdrop-blur-sm
        ${isDark ? "dark" : ""}
      `}
    >
      <GlassContainer
        intensity="heavy"
        className="w-full max-w-md mx-4"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={onboarding.currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <CurrentStep />
          </motion.div>
        </AnimatePresence>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 pb-4">
          {[0, 1, 2, 3].map((step) => (
            <motion.div
              key={step}
              className={`
                w-2 h-2 rounded-full
                ${
                  step === onboarding.currentStep
                    ? isDark
                      ? "bg-white"
                      : "bg-ghost-900"
                    : isDark
                      ? "bg-white/30"
                      : "bg-ghost-300"
                }
              `}
              animate={step === onboarding.currentStep ? { scale: 1.2 } : { scale: 1 }}
            />
          ))}
        </div>
      </GlassContainer>
    </div>
  )
}
