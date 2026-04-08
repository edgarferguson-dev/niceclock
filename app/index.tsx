import { Redirect } from 'expo-router'
import { useAlarm } from '../context/AlarmContext'

/**
 * Entry point — reads alarm phase and routes accordingly.
 *
 * For MVP demo: AlarmContext initializes with phase='wake',
 * so the app always opens on the wake screen.
 * In production, this would check the current time against alarmTime
 * and route to idle/settings if not alarm time.
 */
export default function Index() {
  const { state } = useAlarm()

  switch (state.phase) {
    case 'wake':
      return <Redirect href="/alarm/wake" />
    case 'escalation':
      return <Redirect href="/alarm/escalation" />
    case 'briefing':
      return <Redirect href="/alarm/briefing" />
    default:
      return <Redirect href="/alarm/wake" />
  }
}
