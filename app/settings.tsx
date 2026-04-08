import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { router } from 'expo-router'

import { Screen } from '../components/Screen'
import { TimePicker } from '../components/TimePicker'
import { GlowButton } from '../components/GlowButton'
import { StatusPill } from '../components/StatusPill'
import { useAlarm } from '../context/AlarmContext'
import { colors, spacing, type, palette } from '../constants/theme'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** "07:30" → "7:30 AM" */
function displayTime(time: string): string {
  const [hStr, mStr] = time.split(':')
  const h24 = parseInt(hStr, 10)
  const ampm = h24 < 12 ? 'AM' : 'PM'
  const h12 = h24 % 12 || 12
  return `${h12}:${mStr} ${ampm}`
}

// ─── Screen ──────────────────────────────────────────────────────────────────

/**
 * Settings Screen — the idle home of NiceClock.
 *
 * Same dark atmosphere as the wake screen — the user lives in this space
 * until the alarm fires. Transitioning to the wake screen feels continuous,
 * not like entering a different app.
 *
 * Local `localTime` state holds edits until "Set Alarm" is confirmed.
 * On confirm: persists to storage, fires alarm phase, navigates to wake.
 *
 * Production note: "Set Alarm" would schedule an Expo Notification instead
 * of immediately firing. The nav to /alarm/wake would wait for the trigger.
 */
export default function SettingsScreen() {
  const { state, setAlarmTime, fireAlarm } = useAlarm()

  // Local edit state — committed on "Set Alarm"
  const [localTime, setLocalTime] = useState(state.alarmTime)

  // Sync if context alarmTime changes after hydration resolves
  useEffect(() => {
    setLocalTime(state.alarmTime)
  }, [state.alarmTime])

  const handleSetAlarm = () => {
    setAlarmTime(localTime)
    fireAlarm()
    router.replace('/alarm/wake')
  }

  // ── Entrance animations ──────────────────────────────────────────────────

  const topOpacity = useSharedValue(0)
  useEffect(() => {
    topOpacity.value = withDelay(
      100,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    )
  }, [topOpacity])
  const topStyle = useAnimatedStyle(() => ({ opacity: topOpacity.value }))

  const pickerOpacity = useSharedValue(0)
  const pickerY = useSharedValue(20)
  useEffect(() => {
    pickerOpacity.value = withDelay(
      250,
      withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) })
    )
    pickerY.value = withDelay(
      250,
      withTiming(0, { duration: 550, easing: Easing.out(Easing.cubic) })
    )
  }, [pickerOpacity, pickerY])
  const pickerStyle = useAnimatedStyle(() => ({
    opacity: pickerOpacity.value,
    transform: [{ translateY: pickerY.value }],
  }))

  const ctaOpacity = useSharedValue(0)
  const ctaY = useSharedValue(16)
  useEffect(() => {
    ctaOpacity.value = withDelay(
      450,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    )
    ctaY.value = withDelay(
      450,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) })
    )
  }, [ctaOpacity, ctaY])
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaY.value }],
  }))

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Screen
      gradient={colors.wake.gradientColors}
      gradientLocations={[0, 0.55, 1] as const}
      style={styles.screen}
    >
      {/* Top: brand + status */}
      <Animated.View style={[styles.top, topStyle]}>
        <Text style={styles.brand}>NICECLOCK</Text>
        <StatusPill label="Ready" variant="dot" />
      </Animated.View>

      {/* Center: label + picker + confirmation */}
      <View style={styles.center}>
        <Animated.View style={[styles.pickerBlock, pickerStyle]}>
          <Text style={styles.label}>WAKE TIME</Text>

          <TimePicker value={localTime} onChange={setLocalTime} />

          {/* Confirmation text — updates live as user adjusts */}
          <Text style={styles.confirmation}>
            Wake me at{' '}
            <Text style={styles.confirmationAccent}>{displayTime(localTime)}</Text>
          </Text>
        </Animated.View>
      </View>

      {/* Bottom: CTA */}
      <Animated.View style={[styles.bottom, ctaStyle]}>
        {/* Divider */}
        <View style={styles.divider} />

        <GlowButton
          label="Set Alarm"
          onPress={handleSetAlarm}
          variant="calm"
        />
      </Animated.View>
    </Screen>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'space-between',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  brand: {
    fontSize: type.brandSize,
    fontWeight: type.brandWeight,
    letterSpacing: type.brandLetterSpacing,
    color: 'rgba(240, 234, 214, 0.3)',
    textTransform: 'uppercase',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerBlock: {
    alignItems: 'center',
    gap: spacing.xl,
  },
  label: {
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    color: 'rgba(240, 234, 214, 0.35)',
    textTransform: 'uppercase',
  },
  confirmation: {
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    color: 'rgba(240, 234, 214, 0.35)',
    letterSpacing: 0.2,
    marginTop: spacing.sm,
  },
  confirmationAccent: {
    color: palette.amber400,
    fontWeight: type.ctaWeight,
  },
  bottom: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.wake.divider,
  },
})
