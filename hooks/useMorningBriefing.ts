import { useEffect, useState } from 'react'
import type { MorningEdition } from '../lib/morningEdition'
import { loadMorningEdition } from '../lib/morningEdition'

interface MorningBriefingState {
  data: MorningEdition | null
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  updatedAt: number | null
}

let cachedEdition: MorningEdition | null = null
let cachedAt = 0
let inflight: Promise<MorningEdition> | null = null
const CACHE_MS = 15 * 60 * 1000

async function getEdition(forceRefresh: boolean = false) {
  const isFresh = cachedEdition && Date.now() - cachedAt < CACHE_MS
  if (!forceRefresh && isFresh) return cachedEdition

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

  useEffect(() => {
    let isMounted = true

    getEdition()
      .then((edition) => {
        if (!isMounted) return
        setState({
          data: edition,
          isLoading: false,
          isRefreshing: false,
          error: null,
          updatedAt: cachedAt,
        })
      })
      .catch((error: unknown) => {
        if (!isMounted) return
        setState((current) => ({
          ...current,
          isLoading: false,
          isRefreshing: false,
          error: error instanceof Error ? error.message : 'Unable to load morning briefing.',
        }))
      })

    return () => {
      isMounted = false
    }
  }, [])

  return state
}
