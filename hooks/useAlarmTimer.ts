import { useEffect, useRef } from 'react'

interface UseAlarmTimerOptions {
  /** How many ms to wait before firing escalation. Default: 30000 (30s) */
  delayMs?: number
  onEscalate: () => void
  /** Set to false to disable the timer (e.g. already escalated) */
  active?: boolean
}

/**
 * useAlarmTimer — silent countdown on the wake screen.
 * If the user doesn't confirm in `delayMs`, `onEscalate` fires.
 * The timer is cleared automatically on unmount.
 */
export function useAlarmTimer({
  delayMs = 30_000,
  onEscalate,
  active = true,
}: UseAlarmTimerOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onEscalateRef = useRef(onEscalate)
  onEscalateRef.current = onEscalate

  useEffect(() => {
    if (!active) return

    timerRef.current = setTimeout(() => {
      onEscalateRef.current()
    }, delayMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [active, delayMs])

  const cancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  return { cancel }
}
