import { useEffect, useState } from 'react'

export function useCurrentTime(intervalMs: number = 30_000) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setNow(new Date())

    tick()
    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
