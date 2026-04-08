import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AlarmProvider } from '../context/AlarmContext'

/**
 * Root layout — wraps the entire app.
 *
 * Responsibilities:
 * - AlarmProvider: global state for the alarm flow
 * - SafeAreaProvider: required by useSafeAreaInsets in Screen component
 * - StatusBar: always light (white) — all screens are dark or light-handled individually
 * - Stack navigator with animations and no visible header chrome
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AlarmProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: '#050D1A' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="alarm/wake" />
          <Stack.Screen
            name="alarm/escalation"
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="alarm/briefing"
            options={{ animation: 'fade' }}
          />
        </Stack>
      </AlarmProvider>
    </SafeAreaProvider>
  )
}
