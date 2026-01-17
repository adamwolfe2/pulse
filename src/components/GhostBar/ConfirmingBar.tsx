import { motion } from "framer-motion"
import { useGhostStore } from "~/stores/ghostStore"
import { useDarkMode } from "~/hooks/useDarkMode"
import { Button } from "~/components/shared/Button"

export function ConfirmingBar() {
  const { setBarState, dismiss } = useGhostStore()
  const isDark = useDarkMode()

  return (
    <motion.div
      className="w-full h-full flex items-center justify-between px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <span
        className={`
          text-sm
          ${isDark ? "text-white" : "text-ghost-900"}
        `}
      >
        Confirm action?
      </span>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => setBarState("visible")}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            // Execute action
            dismiss()
          }}
        >
          Confirm
        </Button>
      </div>
    </motion.div>
  )
}
