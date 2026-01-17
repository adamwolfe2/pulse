import { useState, useEffect, useCallback, useRef } from "react"
import { TIMING } from "~/lib/constants"

interface IdleState {
  isIdle: boolean
  idleDuration: number
  lastActivity: number
}

export function useIdleDetection(threshold = TIMING.idleThreshold) {
  const [idleState, setIdleState] = useState<IdleState>({
    isIdle: false,
    idleDuration: 0,
    lastActivity: Date.now()
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef(Date.now())

  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now()

    setIdleState((prev) => ({
      ...prev,
      isIdle: false,
      idleDuration: 0,
      lastActivity: lastActivityRef.current
    }))

    // Reset timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      setIdleState((prev) => ({
        ...prev,
        isIdle: true,
        idleDuration: Date.now() - lastActivityRef.current
      }))
    }, threshold)
  }, [threshold])

  useEffect(() => {
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"]

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Initial timer
    handleActivity()

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [handleActivity])

  return idleState
}
