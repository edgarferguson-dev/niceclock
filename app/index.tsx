import { useEffect } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { useAlarm } from '../context/AlarmContext'
import { palette } from '../constants/theme'

/**
 * Entry point — holds on a dark screen while storage hydrates,
 * then routes imperatively via router.replace() once ready.
 *
 * Using router.replace() in useEffect instead of <Redirect> avoids
 * a known Expo Router edge case where a component switching from
 * rendering <View> to <Redirect> on re-render can fail silently.
 *
 * idle       → /settings
 * wake       → /alarm/wake
 * escalation → /alarm/escalation
 * briefing   → /alarm/briefing
 */
export default function Index() {
  const { state } = useAlarm()

  useEffect(() => {
    if (!state.isHydrated) return

    switch (state.phase) {
      case 'idle':
        router.replace('/settings')
        break
      case 'wake':
        router.replace('/alarm/wake')
        break
      case 'escalation':
        router.replace('/alarm/escalation')
        break
      case 'briefing':
        router.replace('/alarm/briefing')
        break
    }
  }, [state.isHydrated, state.phase])

  // Dark hold screen — matches splash background, invisible to user
  return <View style={{ flex: 1, backgroundColor: palette.navy900 }} />
}
