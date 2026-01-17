import { motion, HTMLMotionProps } from "framer-motion"
import { ReactNode } from "react"

interface GlassPanelProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode
  intensity?: "light" | "medium" | "heavy"
  glow?: boolean
  className?: string
}

export function GlassPanel({
  children,
  intensity = "medium",
  glow = true,
  className = "",
  ...props
}: GlassPanelProps) {
  const intensityStyles = {
    light: {
      bg: "bg-white/5",
      blur: "backdrop-blur-md",
      border: "border-white/10"
    },
    medium: {
      bg: "bg-white/10",
      blur: "backdrop-blur-xl",
      border: "border-white/15"
    },
    heavy: {
      bg: "bg-white/15",
      blur: "backdrop-blur-2xl",
      border: "border-white/20"
    }
  }

  const style = intensityStyles[intensity]

  return (
    <motion.div
      className={`
        ${style.bg}
        ${style.blur}
        border ${style.border}
        rounded-2xl
        ${glow ? "shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]" : ""}
        ${className}
      `}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Circular glass panel for avatars/thumbnails
interface CircleGlassPanelProps {
  children: ReactNode
  size?: "sm" | "md" | "lg"
  className?: string
}

export function CircleGlassPanel({
  children,
  size = "md",
  className = ""
}: CircleGlassPanelProps) {
  const sizeStyles = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24"
  }

  return (
    <div
      className={`
        ${sizeStyles[size]}
        rounded-full
        bg-white/10
        backdrop-blur-xl
        border border-white/20
        shadow-[0_4px_16px_rgba(0,0,0,0.2)]
        overflow-hidden
        flex items-center justify-center
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// Cluster of circular panels (like the memory photos in the screenshot)
interface PhotoClusterProps {
  images: string[]
  className?: string
}

export function PhotoCluster({ images, className = "" }: PhotoClusterProps) {
  const positions = [
    { x: 0, y: 0, size: "lg" as const, z: 30 },
    { x: -30, y: -20, size: "md" as const, z: 20 },
    { x: 30, y: -15, size: "md" as const, z: 20 },
    { x: -15, y: 25, size: "sm" as const, z: 10 },
    { x: 25, y: 30, size: "sm" as const, z: 10 }
  ]

  return (
    <div className={`relative w-32 h-32 ${className}`}>
      {images.slice(0, 5).map((img, i) => {
        const pos = positions[i]
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              x: pos.x - 32,
              y: pos.y - 32,
              zIndex: pos.z
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1, type: "spring" }}
          >
            <CircleGlassPanel size={pos.size}>
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover"
              />
            </CircleGlassPanel>
          </motion.div>
        )
      })}
    </div>
  )
}
