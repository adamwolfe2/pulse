import { useEffect, useState } from "react"
import { useGhostStore } from "~/stores/ghostStore"

export function useDarkMode() {
  const settings = useGhostStore((state) => state.settings)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const updateDarkMode = () => {
      if (settings.darkMode === "auto") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        setIsDark(prefersDark)
      } else {
        setIsDark(settings.darkMode === "dark")
      }
    }

    updateDarkMode()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQuery.addEventListener("change", updateDarkMode)

    return () => {
      mediaQuery.removeEventListener("change", updateDarkMode)
    }
  }, [settings.darkMode])

  return isDark
}
