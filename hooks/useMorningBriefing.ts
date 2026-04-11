import { useCallback, useEffect, useRef, useState } from 'react'
import type { MorningEdition } from '../lib/morningEdition'
import { loadMorningEdition } from '../lib/morningEdition'

interface MorningBriefingState {
  data: MorningEdition | null
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  updatedAt: number | null
}

// Module-level cache shared across all hook instances — persists across navigations
// but resets on full page reload (which is the right behaviour for stale data).
let cachedEdition: MorningEdition | null = null
let cachedAt = 0
let inflight: Promise<MorningEdition> | null = null
const CACHE_MS = 10 * 60 * 1000   // 10-minute freshness window
const REFRESH_MS = 10 * 60 * 1000 // auto-refresh interval
const RETRY_MS = 30 * 1000        // retry delay after a failed fetch

async function getEdition(forceRefresh = false): Promise<MorningEdition> {
  const isFresh = cachedEdition && Date.now() - cachedAt < CACHE_MS
  if (!forceRefresh && isFresh) return cachedEdition!

  // Deduplicate concurrent callers — share the in-flight promise
  if (!inflight) {
    inflight = loadMorningEdition()
      .then((edition) => {
        cachedEdition = edition
        cachedAt = Date.now()
        return edition
      })
      .finally(() => {
        inflight = null
      })
  }

  return inflight
}

export function useMorningBriefing() {
  const [state, setState] = useState<MorningBriefingState>({
    data: cachedEdition,
    isLoading: !cachedEdition,
    isRefreshing: false,
    error: null,
    updatedAt: cachedAt || null,
  })

  const isMounted = useRef(true)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback((force = false) => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current)
      retryTimer.current = null
    }

    setState((s) => ({
      ...s,
      isLoading: !s.data,
      isRefreshing: !!s.data && force,
      error: null,
    }))

    getEdition(force)
      .then((edition) => {
        if (!isMounted.current) return
        setState({
          data: edition,
          isLoading: false,
          isRefreshing: false,
          error: null,
          updatedAt: cachedAt,
        })
      })
      .catch((err: unknown) => {
        if (!isMounted.current) return
        const message = err instanceof Error ? err.message : 'Unable to load morning briefing.'
        setState((s) => ({
          ...s,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }))
        // Auto-retry after 30s when there is no cached data to show
        if (!cachedEdition) {
          retryTimer.current = setTimeout(() => {
            if (isMounted.current) load(false)
          }, RETRY_MS)
        }
      })
  }, [])

  useEffect(() => {
    isMounted.current = true
    load()

    // Periodic refresh so the lock screen stays current throughout the day
    const refreshInterval = setInterval(() => {
      if (isMounted.current) load(true)
    }, REFRESH_MS)

    return () => {
      isMounted.current = false
      clearInterval(refreshInterval)
      if (retryTimer.current) clearTimeout(retryTimer.current)
    }
  }, [load])

  return {
    ...state,
    refresh: () => load(true),
  }
}
