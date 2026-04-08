import { useCallback, useRef } from 'react'
import * as Speech from 'expo-speech'

/**
 * useVoice — voice abstraction for NiceClock
 *
 * Architecture: ElevenLabs slot is reserved via the `elevenLabsApiKey` check.
 * For MVP, expo-speech handles all TTS. When ElevenLabs is wired in,
 * replace the `speakWithElevenLabs` implementation — nothing in the screens changes.
 */

interface UseVoiceOptions {
  elevenLabsApiKey?: string
  voiceId?: string // ElevenLabs voice ID
}

export function useVoice(options: UseVoiceOptions = {}) {
  const isSpeakingRef = useRef(false)

  const stop = useCallback(async () => {
    Speech.stop()
    isSpeakingRef.current = false
  }, [])

  const speakWithExpo = useCallback((text: string) => {
    isSpeakingRef.current = true
    Speech.speak(text, {
      rate: 0.9,      // slightly slower than default — calm and clear
      pitch: 1.0,
      onDone: () => { isSpeakingRef.current = false },
      onError: () => { isSpeakingRef.current = false },
    })
  }, [])

  // ElevenLabs slot — implement when API key is ready
  const speakWithElevenLabs = useCallback(
    async (text: string, apiKey: string, voiceId: string) => {
      try {
        // TODO: implement ElevenLabs streaming TTS
        // const audio = await fetchElevenLabsAudio(text, apiKey, voiceId)
        // await Audio.Sound.createAsync(audio).then(({ sound }) => sound.playAsync())
        // For now, fall through to expo-speech
        speakWithExpo(text)
      } catch {
        speakWithExpo(text)
      }
    },
    [speakWithExpo]
  )

  const speak = useCallback(
    (text: string) => {
      if (isSpeakingRef.current) stop()

      if (options.elevenLabsApiKey && options.voiceId) {
        speakWithElevenLabs(text, options.elevenLabsApiKey, options.voiceId)
      } else {
        speakWithExpo(text)
      }
    },
    [options.elevenLabsApiKey, options.voiceId, speakWithElevenLabs, speakWithExpo, stop]
  )

  return { speak, stop }
}
