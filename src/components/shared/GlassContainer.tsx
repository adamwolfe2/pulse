import { motion, type HTMLMotionProps } from "framer-motion"
import { useDarkMode } from "~/hooks/useDarkMode"

interface GlassContainerProps extends HTMLMotionProps<"div"> {
  intensity?: "light" | "medium" | "heavy"
  children: React.ReactNode
}

export function GlassContainer({
  intensity = "medium",
  children,
  className = "",
  ...props
}: GlassContainerProps) {
  const isDark = useDarkMode()

  const intensityStyles = {
    light: {
      backdrop: "backdrop-blur-sm",
      bg: isDark ? "bg-ghost-900/40" : "bg-white/40",
      border: isDark ? "border-white/10" : "border-black/5"
    },
    medium: {
      backdrop: "backdrop-blur-md",
      bg: isDark ? "bg-ghost-900/60" : "bg-white/60",
      border: isDark ? "border-white/15" : "border-black/10"
    },
    heavy: {
      backdrop: "backdrop-blur-lg",
      bg: isDark ? "bg-ghost-900/80" : "bg-white/80",
      border: isDark ? "border-white/20" : "border-black/15"
    }
  }

  const styles = intensityStyles[intensity]

  return (
    <motion.div
      className={`
        ${styles.backdrop}
        ${styles.bg}
        border ${styles.border}
        rounded-2xl
        shadow-lg
        ${isDark ? "shadow-black/20" : "shadow-black/10"}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  )
}
