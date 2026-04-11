import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

import type { MorningEdition } from '../lib/morningEdition'

const PENDING_ID_KEY = 'niceclock_alarm_notif_id'

// Call once at app startup — sets up the Android notification channel for
// the alarm so it shows on the lock screen at max importance.
export async function initNotificationChannel(): Promise<void> {
  if (Platform.OS === 'web' || Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync('alarm', {
    name: 'NiceClock Alarm',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 400, 200, 400],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
  })
}

// Schedule a local notification for the next occurrence of `alarmTime`.
// Body is populated with live weather + score + lead story when edition is ready.
// Repeats daily — user sees it on their lock screen every morning.
// No-ops on web where expo-notifications has no scheduling support.
export async function scheduleAlarmNotification(
  alarmTime: string,
  edition: MorningEdition | null,
): Promise<void> {
  if (Platform.OS === 'web') return
  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== 'granted') return

  // Replace any previously scheduled notification so there is only ever one.
  await cancelAlarmNotification()

  const [hours, minutes] = alarmTime.split(':').map(Number)

  const h12 = hours % 12 || 12
  const ampm = hours < 12 ? 'AM' : 'PM'
  const timeLabel = `${h12}:${String(minutes).padStart(2, '0')} ${ampm}`

  const weatherLine = edition
    ? `${edition.weather.temperatureF}° · ${edition.weather.condition}`
    : null

  const scoreLine =
    edition?.localScores[0]?.teamScore
      ? `${edition.localScores[0].team} ${edition.localScores[0].teamScore}–${edition.localScores[0].opponent} ${edition.localScores[0].opponentScore ?? ''}`
      : null

  const leadLine =
    edition?.topStories[0]?.title ?? edition?.localStories[0]?.title ?? null

  const bodyParts = [weatherLine, scoreLine, leadLine].filter(Boolean)
  const body =
    bodyParts.length > 0
      ? bodyParts.join(' · ')
      : 'Time to start your day.'

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `NiceClock · ${timeLabel}`,
      body,
      sound: true,
      data: { type: 'alarm' },
      ...(Platform.OS === 'android' ? { channelId: 'alarm' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: hours,
      minute: minutes,
      repeats: true,
    },
  })

  await AsyncStorage.setItem(PENDING_ID_KEY, id)
}

// Cancel the scheduled alarm notification — called when the alarm fires in-app
// so the banner doesn't also appear while the wake screen is already open.
export async function cancelAlarmNotification(): Promise<void> {
  if (Platform.OS === 'web') return
  const id = await AsyncStorage.getItem(PENDING_ID_KEY)
  if (!id) return
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
  await AsyncStorage.removeItem(PENDING_ID_KEY)
}
