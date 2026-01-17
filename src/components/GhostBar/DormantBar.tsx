import { motion } from "framer-motion"
import { useGhostStore } from "~/stores/ghostStore"
import { useDarkMode } from "~/hooks/useDarkMode"

export function DormantBar() {
  const { peek } = useGhostStore()
  const isDark = useDarkMode()

  return (
    <motion.div
      className="w-full h-full flex items-center justify-center cursor-pointer"
      onClick={peek}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className={`
          w-3 h-3 rounded-full
          ${isDark ? "bg-white/60" : "bg-ghost-600"}
        `}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  )
}
