import { motion } from "framer-motion"
import { useDarkMode } from "~/hooks/useDarkMode"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8"
}

export function LoadingSpinner({ size = "md" }: LoadingSpinnerProps) {
  const isDark = useDarkMode()

  return (
    <motion.div
      className={`${sizeMap[size]} relative`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <div
        className={`
          absolute inset-0 rounded-full border-2
          ${isDark ? "border-white/20" : "border-black/10"}
        `}
      />
      <div
        className={`
          absolute inset-0 rounded-full border-2 border-transparent
          ${isDark ? "border-t-white/80" : "border-t-ghost-700"}
        `}
      />
    </motion.div>
  )
}
