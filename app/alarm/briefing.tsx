import React, { useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { router } from 'expo-router'

import { Screen } from '../../components/Screen'
import { BriefingCard } from '../../components/BriefingCard'
import { GlowButton } from '../../components/GlowButton'
import { useAlarm } from '../../context/AlarmContext'
import { useVoice } from '../../hooks/useVoice'
import { mockDay, voiceScripts } from '../../data/mockDay'
import { colors, spacing, type, radius } from '../../constants/theme'

/**
 * Briefing Screen — the reward.
 *
 * After confirming awake, the user gets a calm, warm overview of their morning.
 * Cards stagger in. Voice fires after the animation settles.
 * The feeling is: collected, clear, ready.
 */
export default function BriefingScreen() {
  const { reset } = useAlarm()
  const { speak } = useVoice()

  // Voice fires after cards have animated in (~900ms)
  useEffect(() => {
    const id = setTimeout(() => speak(voiceScripts.briefing), 900)
    return () => clearTimeout(id)
  }, [speak])

  const handleDone = () => {
    reset()
    router.replace('/')
  }

  // ── Entrance animations ──────────────────────────────────────────────────

  // Screen fade from white
  const bgOpacity = useSharedValue(0)
  useEffect(() => {
    bgOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
  }, [bgOpacity])
  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }))

  // Greeting fades in first
  const greetingOpacity = useSharedValue(0)
  const greetingY = useSharedValue(12)
  useEffect(() => {
    greetingOpacity.value = withDelay(
      150,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
    )
    greetingY.value = withDelay(
      150,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) })
    )
  }, [greetingOpacity, greetingY])
  const greetingStyle = useAnimatedStyle(() => ({
    opacity: greetingOpacity.value,
    transform: [{ translateY: greetingY.value }],
  }))

  // Weather strip slides down
  const weatherOpacity = useSharedValue(0)
  const weatherY = useSharedValue(-8)
  useEffect(() => {
    weatherOpacity.value = withDelay(
      100,
      withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) })
    )
    weatherY.value = withDelay(
      100,
      withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) })
    )
  }, [weatherOpacity, weatherY])
  const weatherStyle = useAnimatedStyle(() => ({
    opacity: weatherOpacity.value,
    transform: [{ translateY: weatherY.value }],
  }))

  // CTA fades in last
  const ctaOpacity = useSharedValue(0)
  useEffect(() => {
    ctaOpacity.value = withDelay(
      800,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
    )
  }, [ctaOpacity])
  const ctaStyle = useAnimatedStyle(() => ({ opacity: ctaOpacity.value }))

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Screen solidBg={colors.briefing.bg} style={styles.screen}>
      <Animated.View style={[styles.inner, bgStyle]}>
        {/* Weather strip — top, subtle */}
        <Animated.View style={[styles.weatherStrip, weatherStyle]}>
          <Text style={styles.weatherIcon}>{mockDay.weather.icon}</Text>
          <Text style={styles.weatherText}>
            {mockDay.weather.condition} · {mockDay.weather.tempF}°F
          </Text>
        </Animated.View>

        {/* Greeting */}
        <Animated.View style={[styles.greetingBlock, greetingStyle]}>
          <Text style={styles.greeting}>{mockDay.greeting}</Text>
          <Text style={styles.greetingSubtext}>Here's your morning.</Text>
        </Animated.View>

        {/* Cards */}
        <ScrollView
          style={styles.cards}
          contentContainerStyle={styles.cardsContent}
          showsVerticalScrollIndicator={false}
        >
          <BriefingCard
            label="First up"
            value={mockDay.firstActivity.label}
            subValue={`${mockDay.firstActivity.time}${mockDay.firstActivity.location ? ' · ' + mockDay.firstActivity.location : ''}`}
            icon="📅"
            enterDelay={300}
            accent
          />

          <BriefingCard
            label="Leave by"
            value={mockDay.leaveBy}
            icon="🚶"
            enterDelay={450}
          />

          <BriefingCard
            label="Top task"
            value={mockDay.topTask}
            icon="✓"
            enterDelay={600}
          />
        </ScrollView>

        {/* CTA */}
        <Animated.View style={[styles.cta, ctaStyle]}>
          <GlowButton
            label="Let's go"
            onPress={handleDone}
            variant="ghost"
            noPulse
          />
        </Animated.View>
      </Animated.View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: {
    // Override Screen to use briefing light background
  },
  inner: {
    flex: 1,
    gap: spacing.xl,
  },
  weatherStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.briefing.accentLight,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  weatherIcon: {
    fontSize: 14,
  },
  weatherText: {
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    color: colors.briefing.accent,
    letterSpacing: 0.1,
  },
  greetingBlock: {
    gap: 4,
  },
  greeting: {
    fontSize: type.headlineLargeSize,
    fontWeight: type.headlineWeight,
    letterSpacing: type.headlineLetterSpacing,
    color: colors.briefing.textPrimary,
  },
  greetingSubtext: {
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    color: colors.briefing.textSecondary,
    letterSpacing: 0.1,
  },
  cards: {
    flex: 1,
  },
  cardsContent: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  cta: {
    paddingBottom: spacing.sm,
  },
})
