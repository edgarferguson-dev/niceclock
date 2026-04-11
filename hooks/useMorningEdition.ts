import { useEffect, useState } from 'react'
import type { MorningEdition } from '../lib/morningEdition'
import { loadMorningEdition } from '../lib/morningEdition'

interface MorningEditionState {
  data: MorningEdition | null
  isLoading: boolean
  error: string | null
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

export function useMorningEdition() {
  const [state, setState] = useState<MorningEditionState>({
    data: cachedEdition,
    isLoading: !cachedEdition,
    error: null,
  })

  useEffect(() => {
    let isMounted = true

    getEdition()
      .then((edition) => {
        if (!isMounted) return
        setState({ data: edition, isLoading: false, error: null })
      })
      .catch((error: unknown) => {
        if (!isMounted) return
        setState((current) => ({
          data: current.data,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unable to load morning edition.',
        }))
      })

    return () => {
      isMounted = false
    }
  }, [])

  return state
}
