import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AlarmProvider } from '../context/AlarmContext'

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
          <Stack.Screen name="settings" options={{ animation: 'fade' }} />
          <Stack.Screen name="activities" options={{ animation: 'slide_from_right' }} />
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
