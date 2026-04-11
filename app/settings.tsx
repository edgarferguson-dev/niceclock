import React, { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { router } from 'expo-router'

import { GlowButton } from '../components/GlowButton'
import { ProductMark } from '../components/ProductMark'
import { Screen } from '../components/Screen'
import { TimePicker } from '../components/TimePicker'
import { colors, font, radius, spacing, type } from '../constants/theme'
import { useAlarm } from '../context/AlarmContext'
import { useCurrentTime } from '../hooks/useCurrentTime'

function displayTime(time: string): string {
  const [hStr, mStr] = time.split(':')
  const h24 = parseInt(hStr, 10)
  const ampm = h24 < 12 ? 'AM' : 'PM'
  const h12 = h24 % 12 || 12
  return `${h12}:${mStr} ${ampm}`
}

function timeUntilAlarm(alarmTime: string, now: Date): string {
  const [alarmH, alarmM] = alarmTime.split(':').map(Number)
  const alarmMinutes = alarmH * 60 + alarmM
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  let diff = alarmMinutes - nowMinutes
  if (diff <= 0) diff += 24 * 60
  const hours = Math.floor(diff / 60)
  const mins = diff % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export default function SettingsScreen() {
  const { state, setAlarmTime, fireAlarm } = useAlarm()
  const [localTime, setLocalTime] = useState(state.alarmTime)
  const now = useCurrentTime()

  useEffect(() => {
    setLocalTime(state.alarmTime)
  }, [state.alarmTime])

  const heroOpacity = useSharedValue(0)
  const heroY = useSharedValue(18)

  useEffect(() => {
    heroOpacity.value = withDelay(60, withTiming(1, { duration: 460, easing: Easing.out(Easing.cubic) }))
    heroY.value = withDelay(60, withTiming(0, { duration: 460, easing: Easing.out(Easing.cubic) }))
  }, [heroOpacity, heroY])

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroY.value }],
  }))

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).format(now),
    [now]
  )

  const handleSave = () => {
    setAlarmTime(localTime)
    router.back()
  }

  const handlePreview = () => {
    setAlarmTime(localTime)
    fireAlarm()
    router.replace('/alarm/wake')
  }

  return (
    <Screen gradient={colors.wake.gradientColors} gradientLocations={colors.wake.gradientLocations} style={styles.screen}>
      <View pointerEvents="none" style={styles.atmosphereTop} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.topRow, heroStyle]}>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{formattedDate}</Text>
            <Text style={styles.metaDivider}>/</Text>
            <Text style={styles.metaText}>Configuration</Text>
          </View>
          <ProductMark />
        </Animated.View>

        <Animated.View style={[styles.controlStage, heroStyle]}>
          <View style={styles.panelPrimary}>
            <Text style={styles.sectionLabel}>Alarm time</Text>
            <Text style={styles.valueText}>{displayTime(localTime)}</Text>

            <View style={styles.pickerShell}>
              <TimePicker value={localTime} onChange={setLocalTime} tone="dark" size="compact" />
            </View>
          </View>

          <View style={styles.panelSecondary}>
            <Text style={styles.sectionLabel}>Until wake</Text>
            <Text style={styles.countdownValue}>{timeUntilAlarm(localTime, now)}</Text>
            <Text style={styles.countdownMeta}>
              Alarm fires automatically when the clock reaches this time. Home screen watches the clock every 10 seconds.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View style={[styles.footer, heroStyle]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}>
          <Text style={styles.secondaryActionText}>Back</Text>
        </Pressable>
        <View style={styles.buttonColumn}>
          <Pressable onPress={handleSave} style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}>
            <Text style={styles.secondaryActionText}>Save</Text>
          </Pressable>
          <GlowButton label="Preview Wake" onPress={handlePreview} variant="calm" fullWidth={false} size="compact" />
        </View>
      </Animated.View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'space-between',
  },
  atmosphereTop: {
    position: 'absolute',
    top: -100,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.wake.overlayTop,
  },
  content: {
    gap: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  topRow: {
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  metaText: {
    fontFamily: font.sans,
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    textTransform: 'uppercase',
    color: colors.wake.surfaceMuted,
  },
  metaDivider: {
    color: colors.wake.surfaceSubtle,
  },
  controlStage: {
    gap: spacing.md,
  },
  panelPrimary: {
    backgroundColor: colors.wake.panelWarm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.wake.surfaceBorder,
    padding: spacing.xl,
    gap: spacing.md,
  },
  panelSecondary: {
    backgroundColor: 'rgba(9, 17, 31, 0.66)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.wake.surfaceBorder,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontFamily: font.sans,
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    textTransform: 'uppercase',
    color: colors.wake.surfaceMuted,
  },
  valueText: {
    fontFamily: font.editorial,
    fontSize: type.heroSize - 4,
    fontWeight: '600',
    color: colors.wake.clockText,
  },
  pickerShell: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.wake.surfaceBorder,
    backgroundColor: 'rgba(8, 18, 34, 0.48)',
  },
  countdownValue: {
    fontFamily: font.editorial,
    fontSize: type.heroSize - 4,
    fontWeight: '600',
    color: colors.wake.clockText,
    letterSpacing: -1,
  },
  countdownMeta: {
    fontFamily: font.sans,
    fontSize: type.sublabelSize,
    lineHeight: 19,
    color: colors.wake.surfaceMuted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.wake.surfaceBorder,
    paddingTop: spacing.lg,
  },
  buttonColumn: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  secondaryAction: {
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.wake.surfaceBorder,
    backgroundColor: 'rgba(240, 234, 214, 0.04)',
  },
  secondaryActionText: {
    fontFamily: font.sans,
    fontSize: type.ctaSize,
    fontWeight: type.ctaWeight,
    color: colors.wake.clockText,
  },
  pressed: {
    opacity: 0.86,
  },
})
