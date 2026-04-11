import React, { useEffect, useRef } from 'react'
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
import { useAlarmSound } from '../../hooks/useAlarmSound'
import { useMorningBriefing } from '../../hooks/useMorningBriefing'
import { useVoice } from '../../hooks/useVoice'
import { mockDay, voiceScripts } from '../../data/mockDay'
import { colors, spacing, type, radius } from '../../constants/theme'

export default function BriefingScreen() {
  const { reset } = useAlarm()
  const { speak } = useVoice()
  const { stop } = useAlarmSound()
  const { data: edition } = useMorningBriefing()
  const hasSpokenRef = useRef(false)

  // Stop any lingering alarm audio immediately on mount
  useEffect(() => {
    stop()
  }, [stop])

  // Speak briefing voice after animation settles.
  // If edition is already loaded, use live weather in the line.
  // If not yet loaded, wait a little longer then fall back to the static script.
  // Once spoken, never re-speak if edition arrives late.
  useEffect(() => {
    if (hasSpokenRef.current) return

    const voiceLine = edition
      ? `Good morning. ${edition.weather.temperatureF} degrees and ${edition.weather.condition.toLowerCase()} in ${edition.locationLabel.split(',')[0]}. Your first block is ${mockDay.firstActivity.label} at ${mockDay.firstActivity.time}. Leave by ${mockDay.leaveBy}.`
      : voiceScripts.briefing

    const delay = edition ? 900 : 1600
    const id = setTimeout(() => {
      if (hasSpokenRef.current) return
      hasSpokenRef.current = true
      speak(voiceLine)
    }, delay)

    return () => clearTimeout(id)
  }, [speak, edition])

  const handleDone = async () => {
    await stop()
    reset()
    router.replace('/')
  }

  // — Animations —

  const bgOpacity = useSharedValue(0)
  useEffect(() => {
    bgOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
  }, [bgOpacity])
  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }))

  const greetingOpacity = useSharedValue(0)
  const greetingY = useSharedValue(12)
  useEffect(() => {
    greetingOpacity.value = withDelay(150, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }))
    greetingY.value = withDelay(150, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }))
  }, [greetingOpacity, greetingY])
  const greetingStyle = useAnimatedStyle(() => ({
    opacity: greetingOpacity.value,
    transform: [{ translateY: greetingY.value }],
  }))

  const weatherOpacity = useSharedValue(0)
  const weatherY = useSharedValue(-8)
  useEffect(() => {
    weatherOpacity.value = withDelay(100, withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }))
    weatherY.value = withDelay(100, withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }))
  }, [weatherOpacity, weatherY])
  const weatherStyle = useAnimatedStyle(() => ({
    opacity: weatherOpacity.value,
    transform: [{ translateY: weatherY.value }],
  }))

  const ctaOpacity = useSharedValue(0)
  useEffect(() => {
    ctaOpacity.value = withDelay(800, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }))
  }, [ctaOpacity])
  const ctaStyle = useAnimatedStyle(() => ({ opacity: ctaOpacity.value }))

  // Weather strip: show live data when loaded, graceful text when not yet ready
  const weatherText = edition
    ? `${edition.weather.temperatureF}° · ${edition.weather.condition}`
    : 'Good morning'

  return (
    <Screen solidBg={colors.briefing.bg} style={styles.screen}>
      <Animated.View style={[styles.inner, bgStyle]}>
        <Animated.View style={[styles.weatherStrip, weatherStyle]}>
          <Text style={styles.weatherText}>{weatherText}</Text>
        </Animated.View>

        <Animated.View style={[styles.greetingBlock, greetingStyle]}>
          <Text style={styles.greeting}>Good morning.</Text>
          <Text style={styles.greetingSubtext}>Here's your morning.</Text>
        </Animated.View>

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

          {edition?.topStories[0] ? (
            <BriefingCard
              label="Top story"
              value={edition.topStories[0].title}
              subValue={edition.topStories[0].source}
              icon="📰"
              enterDelay={750}
            />
          ) : null}
        </ScrollView>

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
  screen: {},
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
