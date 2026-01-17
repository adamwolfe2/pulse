import { useEffect, useCallback } from "react"
import { useGhostStore } from "~/stores/ghostStore"
import { extractPageContext } from "~/lib/contextExtractor"
import { TIMING } from "~/lib/constants"

export function usePageContext() {
  const { pageContext, setPageContext } = useGhostStore()

  const refreshContext = useCallback(() => {
    const context = extractPageContext()
    setPageContext(context)
    return context
  }, [setPageContext])

  useEffect(() => {
    // Initial extraction
    refreshContext()

    // Watch for URL changes (SPA support)
    let currentUrl = window.location.href
    const interval = setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href
        refreshContext()
      }
    }, 1000)

    // Watch for significant DOM changes
    let debounceTimer: ReturnType<typeof setTimeout>
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(refreshContext, TIMING.debounceContext)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    })

    return () => {
      clearInterval(interval)
      clearTimeout(debounceTimer)
      observer.disconnect()
    }
  }, [refreshContext])

  return { pageContext, refreshContext }
}
