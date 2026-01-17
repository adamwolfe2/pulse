import { useEffect, useCallback } from "react"
import { useGhostStore } from "~/stores/ghostStore"

export function useKeyboardShortcuts() {
  const { settings, barState, setVisible, expand, collapse, dismiss, isVisible } =
    useGhostStore()

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, shiftKey } = event

      // Parse shortcut string like "Ctrl+Shift+G"
      const parseShortcut = (shortcut: string) => {
        const parts = shortcut.toLowerCase().split("+")
        return {
          ctrl: parts.includes("ctrl"),
          meta: parts.includes("command") || parts.includes("cmd"),
          shift: parts.includes("shift"),
          key: parts[parts.length - 1]
        }
      }

      // Toggle visibility (Ctrl+Shift+G)
      const toggleShortcut = parseShortcut(settings.shortcuts.toggle)
      if (
        key.toLowerCase() === toggleShortcut.key &&
        ctrlKey === toggleShortcut.ctrl &&
        (metaKey === toggleShortcut.meta || !toggleShortcut.meta) &&
        shiftKey === toggleShortcut.shift
      ) {
        event.preventDefault()
        setVisible(!isVisible)
        return
      }

      // Dismiss (Escape)
      if (key === "Escape" && barState !== "dormant") {
        event.preventDefault()
        dismiss()
        return
      }

      // Expand (Enter when visible)
      if (key === "Enter" && barState === "visible") {
        event.preventDefault()
        expand()
        return
      }

      // Collapse (Escape when expanded)
      if (key === "Escape" && barState === "expanded") {
        event.preventDefault()
        collapse()
        return
      }
    },
    [settings.shortcuts, barState, setVisible, expand, collapse, dismiss, isVisible]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])
}
