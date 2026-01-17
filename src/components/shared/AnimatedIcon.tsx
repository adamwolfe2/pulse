import { motion } from "framer-motion"

interface AnimatedIconProps {
  icon: string
  size?: "sm" | "md" | "lg"
  animate?: boolean
  className?: string
}

const sizeMap = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl"
}

export function AnimatedIcon({
  icon,
  size = "md",
  animate = true,
  className = ""
}: AnimatedIconProps) {
  return (
    <motion.span
      className={`inline-block ${sizeMap[size]} ${className}`}
      initial={animate ? { scale: 0.8, opacity: 0 } : false}
      animate={animate ? { scale: 1, opacity: 1 } : false}
      whileHover={animate ? { scale: 1.1 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {icon}
    </motion.span>
  )
}
