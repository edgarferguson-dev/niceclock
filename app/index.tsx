import { View } from 'react-native'
import { Redirect } from 'expo-router'
import { useAlarm } from '../context/AlarmContext'
import { palette } from '../constants/theme'

/**
 * Entry point — holds on a dark screen while storage hydrates,
 * then redirects declaratively once ready.
 *
 * idle       → /settings
 * wake       → /alarm/wake
 * escalation → /alarm/escalation
 * briefing   → /alarm/briefing
 */
export default function Index() {
  const { state } = useAlarm()

  // Hold on dark screen until AsyncStorage hydrates
  if (!state.isHydrated) {
    return <View style={{ flex: 1, backgroundColor: palette.navy900 }} />
  }

  const destinations: Record<typeof state.phase, string> = {
    idle: '/home',
    wake: '/alarm/wake',
    escalation: '/alarm/escalation',
    briefing: '/alarm/briefing',
  }

  return <Redirect href={destinations[state.phase] as any} />
}
