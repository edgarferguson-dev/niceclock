import { View } from 'react-native'
import { Redirect } from 'expo-router'
import { useAlarm } from '../context/AlarmContext'
import { palette } from '../constants/theme'

/**
 * Entry point — holds on a dark screen while storage hydrates,
 * then routes based on alarm phase.
 *
 * idle     → settings (alarm time picker)
 * wake     → alarm/wake
 * escalation → alarm/escalation
 * briefing → alarm/briefing
 *
 * Production note: the idle→wake transition would be driven by
 * a scheduled notification, not an immediate redirect. For MVP demo,
 * the settings screen fires the alarm directly on "Set Alarm".
 */
export default function Index() {
  const { state } = useAlarm()

  // Hold on a dark screen — matches splash color, no visible flash
  if (!state.isHydrated) {
    return <View style={{ flex: 1, backgroundColor: palette.navy900 }} />
  }

  switch (state.phase) {
    case 'idle':
      return <Redirect href="/settings" />
    case 'wake':
      return <Redirect href="/alarm/wake" />
    case 'escalation':
      return <Redirect href="/alarm/escalation" />
    case 'briefing':
      return <Redirect href="/alarm/briefing" />
    default:
      return <Redirect href="/settings" />
  }
}
