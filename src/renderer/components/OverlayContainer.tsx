import { motion, AnimatePresence } from "framer-motion"
import { ReactNode } from "react"

interface OverlayContainerProps {
  children: ReactNode
  isVisible: boolean
}

export function OverlayContainer({ children, isVisible }: OverlayContainerProps) {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-start pt-20 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
