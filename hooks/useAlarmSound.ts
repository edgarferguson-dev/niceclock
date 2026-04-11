import { useCallback } from 'react'
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio'
import { alarmAudioConfig, audioAssets } from '../constants/audio'

let activePlayer: AudioPlayer | null = null
let activeKind: 'wake' | 'escalation' | null = null
let audioModeReady = false

async function ensureAudioMode() {
  if (audioModeReady) return

  await setAudioModeAsync(alarmAudioConfig.mode)
  audioModeReady = true
}

function removeActivePlayer() {
  if (!activePlayer) return

  try {
    activePlayer.pause()
  } catch {
    // Ignore pause failures during teardown.
  }

  try {
    activePlayer.remove()
  } catch {
    // Ignore remove failures during teardown.
  }

  activePlayer = null
  activeKind = null
}

async function play(kind: 'wake' | 'escalation') {
  try {
    await ensureAudioMode()

    if (activePlayer && activeKind === kind) {
      activePlayer.seekTo(0).catch(() => undefined)
      activePlayer.play()
      return
    }

    removeActivePlayer()

    const source = kind === 'wake' ? audioAssets.wake : audioAssets.escalation
    const config = kind === 'wake' ? alarmAudioConfig.wake : alarmAudioConfig.escalation
    const player = createAudioPlayer(source, { keepAudioSessionActive: true })

    player.loop = config.loop
    player.volume = config.volume
    player.play()

    activePlayer = player
    activeKind = kind
  } catch (error) {
    console.warn(`Failed to play ${kind} alarm sound`, error)
    removeActivePlayer()
  }
}

export function useAlarmSound() {
  const playWake = useCallback(async () => {
    await play('wake')
  }, [])

  const playEscalation = useCallback(async () => {
    await play('escalation')
  }, [])

  const stop = useCallback(async () => {
    removeActivePlayer()
  }, [])

  const unload = useCallback(async () => {
    removeActivePlayer()
  }, [])

  return { playWake, playEscalation, stop, unload }
}
