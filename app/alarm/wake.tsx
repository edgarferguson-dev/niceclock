import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { router } from 'expo-router'

import { Screen } from '../../components/Screen'
import { TimeDisplay } from '../../components/TimeDisplay'
import { GlowButton } from '../../components/GlowButton'
import { StatusPill } from '../../components/StatusPill'
import { useAlarm } from '../../context/AlarmContext'
import { useAlarmTimer } from '../../hooks/useAlarmTimer'
import { useVoice } from '../../hooks/useVoice'
import { voiceScripts } from '../../data/mockDay'
import { colors, spacing, type } from '../../constants/theme'

/**
 * Wake Screen — the first moment of the alarm experience.
 *
 * Visual intent: deep navy darkness, a glowing clock in the center,
 * an amber CTA rising from the bottom. Calm but alive.
 * The screen breathes — it is not static.
 *
 * Flow:
 * - Voice fires 1s after mount
 * - Escalation timer starts immediately (30s)
 * - "I'm Awake" → confirmAwake() → navigate to briefing
 * - Timer expiring → triggerEscalation() → navigate to escalation
 */
export default function WakeScreen() {
  const { confirmAwake, triggerEscalation } = useAlarm()
  const { speak } = useVoice()

  // Voice: fires once, 1 second after mount
  useEffect(() => {
    const id = setTimeout(() => speak(voiceScripts.wake), 1000)
    return () => clearTimeout(id)
  }, [speak])

  // Escalation timer: 30s of silence → escalation screen
  useAlarmTimer({
    delayMs: 30_000,
    onEscalate: () => {
      triggerEscalation()
      router.replace('/alarm/escalation')
    },
  })

  const handleConfirm = () => {
    confirmAwake()
    router.replace('/alarm/briefing')
  }

  // ── Entrance animations ──────────────────────────────────────────────────

  // Top section: brand + status pill fade in
  const topOpacity = useSharedValue(0)
  useEffect(() => {
    topOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    )
  }, [topOpacity])
  const topStyle = useAnimatedStyle(() => ({ opacity: topOpacity.value }))

  // Bottom CTA: slides up from below
  const ctaTranslateY = useSharedValue(32)
  const ctaOpacity = useSharedValue(0)
  useEffect(() => {
    ctaTranslateY.value = withDelay(
      400,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    )
    ctaOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    )
  }, [ctaTranslateY, ctaOpacity])
  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ctaTranslateY.value }],
    opacity: ctaOpacity.value,
  }))

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Screen
      gradient={colors.wake.gradientColors}
      gradientLocations={[0, 0.55, 1] as const}
      style={styles.screen}
    >
      {/* Top: brand + alarm status */}
      <Animated.View style={[styles.top, topStyle]}>
        <Text style={styles.brand}>NICECLOCK</Text>
        <StatusPill label="Alarm active" variant="dot" />
      </Animated.View>

      {/* Center: hero time display */}
      <View style={styles.center}>
        <TimeDisplay
          textColor={colors.wake.clockText}
          dateColor={colors.wake.dateText}
          showGlow
          glowColor={colors.wake.glowColor}
          animateIn
        />

        {/* Soft divider below clock */}
        <View style={styles.divider} />

        {/* Wake prompt */}
        <Animated.View style={topStyle}>
          <Text style={styles.prompt}>Are you awake?</Text>
        </Animated.View>
      </View>

      {/* Bottom: CTA */}
      <Animated.View style={[styles.bottom, ctaStyle]}>
        <GlowButton
          label="I'm Awake"
          onPress={handleConfirm}
          variant="calm"
        />
      </Animated.View>
    </Screen>
  )
}

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
    gap: spacing.lg,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: colors.wake.divider,
  },
  prompt: {
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    letterSpacing: 0.5,
    color: 'rgba(240, 234, 214, 0.45)',
  },
  bottom: {
    paddingBottom: spacing.md,
  },
})
