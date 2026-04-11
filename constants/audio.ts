export const audioAssets = {
  wake: require('../assets/audio/niceclock-wake.wav'),
  escalation: require('../assets/audio/niceclock-escalation.wav'),
} as const

export const alarmAudioConfig = {
  wake: {
    loop: true,
    volume: 0.58,
    voiceDelayMs: 1000,
  },
  escalation: {
    loop: true,
    volume: 0.78,
    voiceDelayMs: 1500,
  },
  mode: {
    playsInSilentMode: true,
    interruptionMode: 'doNotMix' as const,
    shouldPlayInBackground: false,
  },
} as const
