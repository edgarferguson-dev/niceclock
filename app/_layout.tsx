import * as Notifications from 'expo-notifications'
import { router, Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AlarmProvider, useAlarm } from '../context/AlarmContext'
import { initNotificationChannel } from '../hooks/useAlarmNotification'

// Listens for lock-screen notification taps and routes to the wake screen.
// Only active on native — expo-notifications does not run on web.
function NotificationTapHandler() {
  const { fireAlarm, state } = useAlarm()

  useEffect(() => {
    if (Platform.OS === 'web') return

    const openWakeScreen = () => {
      if (state.phase !== 'idle') return
      fireAlarm()
      router.replace('/alarm/wake')
    }

    // Tell expo-notifications to suppress the system banner while the app is
    // foregrounded (the wake screen is already open and playing audio).
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false,
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    })

    initNotificationChannel()

    Notifications.getLastNotificationResponseAsync().then((response) => {
      const data = response?.notification.request.content.data
      if (data?.type === 'alarm') {
        openWakeScreen()
      }
    })

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data
      if (data?.type === 'alarm') {
        openWakeScreen()
      }
    })

    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data
        if (data?.type === 'alarm') {
          openWakeScreen()
        }
      },
    )
    return () => {
      receivedSub.remove()
      sub.remove()
    }
  }, [fireAlarm, state.phase])

  return null
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AlarmProvider>
        <NotificationTapHandler />
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: '#050D1A' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="home" options={{ animation: 'fade' }} />
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
