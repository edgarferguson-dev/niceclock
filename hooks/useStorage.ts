import AsyncStorage from '@react-native-async-storage/async-storage'

const ALARM_TIME_KEY = '@niceclock/alarm_time'

/**
 * Thin typed wrappers around AsyncStorage.
 * Keeps AsyncStorage calls out of context and components.
 * Fire-and-forget on save — UI updates optimistically via dispatch,
 * storage persists in the background.
 */

export async function loadAlarmTime(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ALARM_TIME_KEY)
  } catch {
    return null
  }
}

export async function saveAlarmTime(time: string): Promise<void> {
  try {
    await AsyncStorage.setItem(ALARM_TIME_KEY, time)
  } catch {
    // storage failure is silent — next launch falls back to default
  }
}
