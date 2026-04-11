import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import { router } from 'expo-router'

import { GlowButton } from '../../components/GlowButton'
import { ProductMark } from '../../components/ProductMark'
import { Screen } from '../../components/Screen'
import { alarmAudioConfig } from '../../constants/audio'
import { colors, spacing, type } from '../../constants/theme'
import { useAlarm } from '../../context/AlarmContext'
import { voiceScripts } from '../../data/mockDay'
import { useAlarmSound } from '../../hooks/useAlarmSound'
import { useVoice } from '../../hooks/useVoice'

export default function EscalationScreen() {
  const { confirmAwake, state } = useAlarm()
  const { speak } = useVoice()
  const { playEscalation, stop } = useAlarmSound()
  const [minutesLate, setMinutesLate] = useState(0)

  useEffect(() => {
    playEscalation()
    const id = setTimeout(() => speak(voiceScripts.escalation), alarmAudioConfig.escalation.voiceDelayMs)
    return () => clearTimeout(id)
  }, [playEscalation, speak])

  useEffect(() => {
    const firedAt = state.escalationFiredAt ?? Date.now()

    const update = () => {
      const elapsed = Math.floor((Date.now() - firedAt) / 60_000)
      setMinutesLate(elapsed)
    }

    update()
    const id = setInterval(update, 10_000)
    return () => clearInterval(id)
  }, [state.escalationFiredAt])

  const handleConfirm = async () => {
    await stop()
    confirmAwake()
    router.replace('/alarm/briefing')
  }

  const opacity = useSharedValue(0)
  const translateY = useSharedValue(24)

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
    translateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) })
  }, [opacity, translateY])

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  const headlinePulse = useSharedValue(1)
  useEffect(() => {
    headlinePulse.value = withRepeat(
      withSequence(
        withTiming(1.015, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    )
  }, [headlinePulse])
  const headlineStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headlinePulse.value }],
  }))

  return (
    <Screen
      gradient={colors.escalation.gradientColors}
      gradientLocations={[0, 0.4, 1] as const}
      style={styles.screen}
    >
      <Animated.View style={[styles.content, containerStyle]}>
        <View style={styles.top}>
          <ProductMark tone="danger" />
        </View>

        <View style={styles.center}>
          <Animated.Text style={[styles.headline, headlineStyle]}>
            You're still{`\n`}in bed.
          </Animated.Text>

          <Text style={styles.subtext}>Your day is already moving.</Text>

          {minutesLate > 0 && (
            <View style={styles.counterBlock}>
              <Text style={styles.counterValue}>{minutesLate}</Text>
              <Text style={styles.counterLabel}>
                {minutesLate === 1 ? 'minute late' : 'minutes late'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottom}>
          <GlowButton
            label="I'm Up Now"
            onPress={handleConfirm}
            variant="urgent"
          />
        </View>
      </Animated.View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  top: {
    paddingTop: spacing.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  headline: {
    fontSize: type.headlineLargeSize,
    fontWeight: type.headlineWeight,
    letterSpacing: type.headlineLetterSpacing,
    color: colors.escalation.headlineText,
    lineHeight: 42,
  },
  subtext: {
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    color: colors.escalation.subText,
    letterSpacing: 0.2,
  },
  counterBlock: {
    marginTop: spacing.lg,
    gap: 4,
  },
  counterValue: {
    fontSize: type.displaySize,
    fontWeight: type.displayWeight,
    letterSpacing: type.displayLetterSpacing,
    color: colors.escalation.counterText,
    lineHeight: 70,
  },
  counterLabel: {
    fontSize: type.sublabelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    color: colors.escalation.subText,
    textTransform: 'uppercase',
  },
  bottom: {
    paddingBottom: spacing.md,
  },
})
