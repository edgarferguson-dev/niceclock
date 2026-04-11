import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Platform } from 'react-native'
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioStatus } from 'expo-audio'
import * as FileSystem from 'expo-file-system/legacy'
import * as Speech from 'expo-speech'
import { Buffer } from 'buffer'

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1/text-to-speech'
const DEFAULT_MODEL_ID = 'eleven_multilingual_v2'
const DEFAULT_OUTPUT_FORMAT = 'mp3_44100_128'
const VOICE_CACHE_DIR = FileSystem.cacheDirectory
  ? `${FileSystem.cacheDirectory}niceclock-voice`
  : null

let activePlayer: AudioPlayer | null = null
let activePlayerSubscription: { remove(): void } | null = null
let activePlayerFileUri: string | null = null
let audioModeReady = false

interface UseVoiceOptions {
  elevenLabsApiKey?: string
  voiceId?: string
  modelId?: string
}

async function ensureAudioMode() {
  if (audioModeReady) return

  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'doNotMix',
    shouldPlayInBackground: false,
    allowsRecording: false,
    shouldRouteThroughEarpiece: false,
  })

  audioModeReady = true
}

async function ensureVoiceCacheDir() {
  if (!VOICE_CACHE_DIR) {
    throw new Error('Voice cache directory unavailable')
  }

  await FileSystem.makeDirectoryAsync(VOICE_CACHE_DIR, { intermediates: true }).catch(() => {
    // Ignore directory creation races across screens.
  })
}

async function cleanupCachedFile(fileUri: string | null) {
  if (!fileUri) return

  await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {
    // Ignore temp-file cleanup failures.
  })
}

async function releaseActivePlayer() {
  activePlayerSubscription?.remove()
  activePlayerSubscription = null

  if (activePlayer) {
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
  }

  const fileUri = activePlayerFileUri
  activePlayerFileUri = null
  await cleanupCachedFile(fileUri)
}

export function useVoice(options: UseVoiceOptions = {}) {
  const isSpeakingRef = useRef(false)
  const requestIdRef = useRef(0)

  const config = useMemo(
    () => ({
      apiKey: options.elevenLabsApiKey ?? process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY,
      voiceId: options.voiceId ?? process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID,
      modelId: options.modelId ?? process.env.EXPO_PUBLIC_ELEVENLABS_MODEL_ID ?? DEFAULT_MODEL_ID,
    }),
    [options.elevenLabsApiKey, options.modelId, options.voiceId]
  )

  const stop = useCallback(async () => {
    requestIdRef.current += 1
    Speech.stop()
    isSpeakingRef.current = false
    await releaseActivePlayer()
  }, [])

  useEffect(() => {
    return () => {
      requestIdRef.current += 1
      Speech.stop()
      isSpeakingRef.current = false
      void releaseActivePlayer()
    }
  }, [])

  const speakWithExpo = useCallback((text: string) => {
    isSpeakingRef.current = true
    Speech.speak(text, {
      rate: 0.9,
      pitch: 1.0,
      onDone: () => {
        isSpeakingRef.current = false
      },
      onError: () => {
        isSpeakingRef.current = false
      },
    })
  }, [])

  const speakWithElevenLabs = useCallback(
    async (text: string, apiKey: string, voiceId: string, modelId: string, requestId: number) => {
      try {
        if (Platform.OS === 'web') {
          speakWithExpo(text)
          return
        }

        await ensureVoiceCacheDir()

        const response = await fetch(
          `${ELEVENLABS_API_BASE}/${encodeURIComponent(voiceId)}?output_format=${DEFAULT_OUTPUT_FORMAT}`,
          {
            method: 'POST',
            headers: {
              Accept: 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': apiKey,
            },
            body: JSON.stringify({
              text,
              model_id: modelId,
              voice_settings: {
                stability: 0.45,
                similarity_boost: 0.78,
                style: 0.18,
                speed: 0.95,
                use_speaker_boost: true,
              },
            }),
          }
        )

        if (!response.ok) {
          throw new Error(`ElevenLabs request failed with ${response.status}`)
        }

        const audioBuffer = await response.arrayBuffer()
        const fileUri = `${VOICE_CACHE_DIR}/speech-${Date.now()}-${requestId}.mp3`
        const base64Audio = Buffer.from(audioBuffer).toString('base64')

        await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
          encoding: FileSystem.EncodingType.Base64,
        })

        if (requestIdRef.current !== requestId) {
          await cleanupCachedFile(fileUri)
          return
        }

        await ensureAudioMode()
        await releaseActivePlayer()

        const player = createAudioPlayer(
          { uri: fileUri },
          { keepAudioSessionActive: true, downloadFirst: true }
        )

        activePlayer = player
        activePlayerFileUri = fileUri
        isSpeakingRef.current = true

        activePlayerSubscription = player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
          const finished =
            status.didJustFinish ||
            (status.isLoaded && !status.playing && status.currentTime >= status.duration)

          if (!finished) return

          isSpeakingRef.current = false
          void releaseActivePlayer()
        })

        player.play()
      } catch {
        if (requestIdRef.current === requestId) {
          await releaseActivePlayer()
          speakWithExpo(text)
        }
      }
    },
    [speakWithExpo]
  )

  const speak = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return

      requestIdRef.current += 1
      const requestId = requestIdRef.current

      Speech.stop()
      void releaseActivePlayer()

      if (config.apiKey && config.voiceId) {
        void speakWithElevenLabs(trimmed, config.apiKey, config.voiceId, config.modelId, requestId)
      } else {
        speakWithExpo(trimmed)
      }
    },
    [config.apiKey, config.modelId, config.voiceId, speakWithElevenLabs, speakWithExpo]
  )

  return { speak, stop }
}
