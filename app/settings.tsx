import React, { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
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
import { colors, radius, shadows, spacing, type } from '../constants/theme'
import { useAlarm } from '../context/AlarmContext'
import { useCurrentTime } from '../hooks/useCurrentTime'
import { useMorningEdition } from '../hooks/useMorningEdition'
import { useVoice } from '../hooks/useVoice'

function displayTime(time: string): string {
  const [hStr, mStr] = time.split(':')
  const h24 = parseInt(hStr, 10)
  const ampm = h24 < 12 ? 'AM' : 'PM'
  const h12 = h24 % 12 || 12
  return `${h12}:${mStr} ${ampm}`
}

export default function SettingsScreen() {
  const { state, setAlarmTime, fireAlarm } = useAlarm()
  const [localTime, setLocalTime] = useState(state.alarmTime)
  const now = useCurrentTime()
  const { width } = useWindowDimensions()
  const { data: edition, isLoading } = useMorningEdition()
  const { speak } = useVoice()

  useEffect(() => {
    setLocalTime(state.alarmTime)
  }, [state.alarmTime])

  const handleSetAlarm = () => {
    setAlarmTime(localTime)
    fireAlarm()
    router.replace('/alarm/wake')
  }

  const handleOpenActivities = () => {
    router.push('/activities')
  }

  const heroOpacity = useSharedValue(0)
  const heroY = useSharedValue(18)
  const footerOpacity = useSharedValue(0)
  const footerY = useSharedValue(18)

  useEffect(() => {
    heroOpacity.value = withDelay(80, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }))
    heroY.value = withDelay(80, withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) }))
    footerOpacity.value = withDelay(260, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }))
    footerY.value = withDelay(260, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }))
  }, [footerOpacity, footerY, heroOpacity, heroY])

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroY.value }],
  }))

  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
    transform: [{ translateY: footerY.value }],
  }))

  const stageSize = Math.min(width - spacing.screenH * 2, 380)
  const clockSize = Math.min(stageSize * 0.78, 300)
  const formattedDate = useMemo(
    () => new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(now),
    [now]
  )

  const topStory = edition?.topStories[0]
  const localStory = edition?.localStories[0]
  const trendingStory = edition?.trendingStories[0]
  const secondTopStory = edition?.topStories[1]

  const readStory = (headline?: string, source?: string) => {
    if (!headline) return
    const sourceLine = source ? ` Source: ${source}.` : ''
    speak(`${headline}.${sourceLine}`)
  }

  return (
    <Screen solidBg={colors.edition.bg} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.masthead, heroStyle]}>
          <Text style={styles.editionLine}>{formattedDate}</Text>
          <View style={styles.mastheadRule} />
          <View style={styles.centeredMark}>
            <ProductMark tone="warm" />
          </View>
          <View style={styles.mastheadRule} />
          <Text style={styles.locationLine}>
            {edition ? `${edition.locationLabel} · ${edition.weather.temperatureF}° · ${edition.weather.condition}` : 'Loading your local edition'}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.featureStage, heroStyle]}>
          <Pressable
            onPress={() => readStory(edition ? `${edition.weather.condition}. High ${edition.weather.highF}. Low ${edition.weather.lowF}.` : undefined, edition?.locationLabel)}
            style={({ pressed }) => [styles.orbitCard, styles.weatherCard, pressed && styles.pressedCard]}
          >
            <Text style={styles.cardEyebrow}>Weather</Text>
            <Text style={styles.cardHeadline}>{edition ? `${edition.weather.temperatureF}° and ${edition.weather.condition}` : 'Loading forecast'}</Text>
            <Text style={styles.cardMeta}>{edition ? `High ${edition.weather.highF}° · Low ${edition.weather.lowF}°` : 'Gathering conditions'}</Text>
          </Pressable>

          <Pressable
            onPress={() => readStory(localStory?.title, localStory?.source)}
            style={({ pressed }) => [styles.orbitCard, styles.localCard, pressed && styles.pressedCard]}
          >
            <Text style={styles.cardEyebrow}>Local lead</Text>
            <Text style={styles.cardHeadline}>{localStory?.title ?? 'Finding nearby headlines'}</Text>
            <Text style={styles.cardMeta}>{localStory?.source ?? 'Morning Edition Desk'}</Text>
          </Pressable>

          <View style={[styles.clockShell, { width: clockSize, height: clockSize, borderRadius: clockSize / 2 }]}>
            <Text style={styles.clockEyebrow}>Set for tomorrow</Text>
            <Text style={styles.clockLabel}>{displayTime(localTime)}</Text>
            <TimePicker value={localTime} onChange={setLocalTime} tone="paper" />
            <Text style={styles.clockNote}>A retro bedside dial for the next edition.</Text>
          </View>

          <Pressable
            onPress={() => readStory(topStory?.title, topStory?.source)}
            style={({ pressed }) => [styles.orbitCard, styles.topStoryCard, pressed && styles.pressedCard]}
          >
            <Text style={styles.cardEyebrow}>Top story</Text>
            <Text style={styles.cardHeadline}>{topStory?.title ?? 'Loading top headlines'}</Text>
            <Text style={styles.cardMeta}>{topStory?.source ?? 'National desk'}</Text>
          </Pressable>

          <Pressable
            onPress={() => readStory(trendingStory?.title, trendingStory?.source)}
            style={({ pressed }) => [styles.orbitCard, styles.trendingCard, pressed && styles.pressedCard]}
          >
            <Text style={styles.cardEyebrow}>Trending</Text>
            <Text style={styles.cardHeadline}>{trendingStory?.title ?? 'Collecting what is trending now'}</Text>
            <Text style={styles.cardMeta}>{trendingStory?.source ?? 'Trending desk'}</Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.frontPagePanel, heroStyle]}>
          <Text style={styles.frontPageTitle}>Front page</Text>
          <Text style={styles.frontPageDeck}>
            The day is arranged around the clock. Tap any story tile to hear it aloud before the alarm speaks the edition in the morning.
          </Text>
          <View style={styles.storyList}>
            {[topStory, secondTopStory, trendingStory].map((story, index) => (
              <Pressable
                key={`${story?.link ?? 'placeholder'}-${index}`}
                onPress={() => readStory(story?.title, story?.source)}
                style={({ pressed }) => [styles.storyRow, pressed && styles.pressedCard]}
              >
                <Text style={styles.storyIndex}>{String(index + 1).padStart(2, '0')}</Text>
                <View style={styles.storyBody}>
                  <Text style={styles.storyTitle}>{story?.title ?? (isLoading ? 'Loading edition headlines' : 'No headline available')}</Text>
                  <Text style={styles.storySource}>{story?.source ?? 'Morning Edition'}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View style={[styles.footerShell, footerStyle]}>
        <View style={styles.footerCopyBlock}>
          <Text style={styles.footerTitle}>Tomorrow is already typeset.</Text>
          <Text style={styles.footerSubtitle}>
            {edition ? `Alarm briefing will speak top, local, and trending stories for ${edition.locationLabel}.` : 'Alarm briefing will read the latest edition once the feed lands.'}
          </Text>
        </View>
        <View style={styles.footerActions}>
          <Pressable onPress={handleOpenActivities} style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressedCard]}>
            <Text style={styles.secondaryActionText}>View day</Text>
          </Pressable>
          <GlowButton label="Set Alarm" onPress={handleSetAlarm} variant="calm" fullWidth={false} size="compact" />
        </View>
      </Animated.View>
    </Screen>
  )
}

const orbitCardBase = {
  position: 'absolute' as const,
  width: '43%' as const,
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'space-between',
  },
  scrollContent: {
    gap: spacing.xl,
    paddingBottom: spacing.xl,
  },
  masthead: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  editionLine: {
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    color: colors.edition.muted,
    textTransform: 'uppercase',
  },
  mastheadRule: {
    width: '100%',
    height: 1,
    backgroundColor: colors.edition.panelBorder,
  },
  centeredMark: {
    alignItems: 'center',
  },
  locationLine: {
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    color: colors.edition.body,
  },
  featureStage: {
    position: 'relative',
    minHeight: 540,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitCard: {
    backgroundColor: colors.edition.panelBg,
    borderColor: colors.edition.panelBorder,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.cardRaised,
  },
  weatherCard: {
    ...orbitCardBase,
    top: 12,
    left: 0,
  },
  localCard: {
    ...orbitCardBase,
    top: 34,
    right: 0,
  },
  topStoryCard: {
    ...orbitCardBase,
    bottom: 86,
    left: 8,
  },
  trendingCard: {
    ...orbitCardBase,
    bottom: 54,
    right: 0,
  },
  pressedCard: {
    opacity: 0.88,
  },
  cardEyebrow: {
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    color: colors.edition.accent,
    textTransform: 'uppercase',
  },
  cardHeadline: {
    fontSize: type.ctaSize,
    fontWeight: type.ctaWeight,
    color: colors.edition.headline,
    lineHeight: 24,
  },
  cardMeta: {
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    color: colors.edition.body,
    lineHeight: 18,
  },
  clockShell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.edition.panelStrong,
    borderWidth: 10,
    borderColor: colors.edition.clockBorder,
    ...shadows.cardRaised,
  },
  clockEyebrow: {
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    color: colors.edition.muted,
    textTransform: 'uppercase',
  },
  clockLabel: {
    fontSize: type.headlineSize,
    fontWeight: type.headlineWeight,
    color: colors.edition.headline,
  },
  clockNote: {
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    color: colors.edition.body,
    textAlign: 'center',
    maxWidth: 180,
  },
  frontPagePanel: {
    backgroundColor: colors.edition.panelBg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.edition.panelBorder,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.cardRaised,
  },
  frontPageTitle: {
    fontSize: type.headlineSize,
    fontWeight: type.headlineWeight,
    color: colors.edition.headline,
    textAlign: 'center',
  },
  frontPageDeck: {
    fontSize: type.bodySize,
    fontWeight: type.bodyWeight,
    color: colors.edition.body,
    lineHeight: 24,
    textAlign: 'center',
  },
  storyList: {
    gap: spacing.sm,
  },
  storyRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.edition.panelBorder,
  },
  storyIndex: {
    width: 28,
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    color: colors.edition.accent,
    textTransform: 'uppercase',
  },
  storyBody: {
    flex: 1,
    gap: 4,
  },
  storyTitle: {
    fontSize: type.ctaSize,
    fontWeight: type.ctaWeight,
    color: colors.edition.headline,
    lineHeight: 24,
  },
  storySource: {
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    color: colors.edition.body,
  },
  footerShell: {
    borderTopWidth: 1,
    borderTopColor: colors.edition.panelBorder,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  footerCopyBlock: {
    gap: 4,
  },
  footerTitle: {
    fontSize: type.ctaSize,
    fontWeight: type.ctaWeight,
    color: colors.edition.headline,
    textAlign: 'center',
  },
  footerSubtitle: {
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    color: colors.edition.body,
    textAlign: 'center',
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'center',
  },
  secondaryAction: {
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.edition.panelBorder,
    backgroundColor: colors.edition.accentSoft,
  },
  secondaryActionText: {
    fontSize: type.ctaSize,
    fontWeight: type.ctaWeight,
    color: colors.edition.headline,
  },
})
