import React, { useEffect, useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { router } from 'expo-router'

import { ActivityCard } from '../components/ActivityCard'
import { ProductMark } from '../components/ProductMark'
import { Screen } from '../components/Screen'
import { StatusPill } from '../components/StatusPill'
import { colors, palette, radius, spacing, type } from '../constants/theme'
import { getSelectedLockScreenGlances, mockDay } from '../data/mockDay'
import { useCurrentTime } from '../hooks/useCurrentTime'
import { useVoice } from '../hooks/useVoice'
import {
  buildActivityVoiceLine,
  createLockScreenSnapshot,
  formatRange,
  getTimelineState,
} from '../lib/activityTimeline'

export default function ActivitiesScreen() {
  const now = useCurrentTime()
  const { speak } = useVoice()

  const timeline = useMemo(() => getTimelineState(mockDay.activities, now), [now])
  const lockScreenSnapshot = useMemo(
    () => createLockScreenSnapshot({
      activities: mockDay.activities,
      now,
      glances: getSelectedLockScreenGlances(mockDay),
    }),
    [now]
  )

  const topOpacity = useSharedValue(0)
  const topY = useSharedValue(18)

  useEffect(() => {
    topOpacity.value = withDelay(80, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }))
    topY.value = withDelay(80, withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) }))
  }, [topOpacity, topY])

  const topStyle = useAnimatedStyle(() => ({
    opacity: topOpacity.value,
    transform: [{ translateY: topY.value }],
  }))

  const currentHeadline = timeline.active?.title ?? timeline.next?.title ?? 'The day is clear.'
  const currentDetail = timeline.active
    ? `Live until ${formatRange(timeline.active.startTime, timeline.active.endTime).split(' - ')[1]}`
    : timeline.next
      ? `Next aligned block starts at ${formatRange(timeline.next.startTime, timeline.next.endTime).split(' - ')[0]}`
      : 'No more activity blocks are waiting.'

  return (
    <Screen
      gradient={colors.wake.gradientColors}
      gradientLocations={[0, 0.55, 1] as const}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.topRow, topStyle]}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
          <ProductMark />
          <StatusPill label={timeline.active ? 'Live now' : 'Upcoming'} variant="dot" />
        </Animated.View>

        <Animated.View style={[styles.heroPanel, topStyle]}>
          <Text style={styles.overline}>Activity Surface</Text>
          <Text style={styles.heroHeadline}>{currentHeadline}</Text>
          <Text style={styles.heroCopy}>
            It is {timeline.nowLabel}. {currentDetail}
          </Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Current</Text>
              <Text style={styles.summaryValue}>{lockScreenSnapshot.activeActivity?.title ?? 'No active block'}</Text>
              <Text style={styles.summarySubvalue}>{lockScreenSnapshot.activeActivity?.timeRange ?? 'Waiting for the next window'}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Next</Text>
              <Text style={styles.summaryValue}>{lockScreenSnapshot.nextActivity?.title ?? 'Nothing queued'}</Text>
              <Text style={styles.summarySubvalue}>{lockScreenSnapshot.nextActivity?.timeRange ?? 'The rest of the day is open'}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.lockScreenPanel, topStyle]}>
          <Text style={styles.lockTitle}>Read-only companion</Text>
          <Text style={styles.lockCopy}>
            This layer already mirrors the same active and next activity truth the lock screen will use later.
          </Text>
          <View style={styles.glanceRow}>
            {lockScreenSnapshot.glances.map((glance) => (
              <View key={glance.key} style={styles.glancePill}>
                <Text style={styles.glanceLabel}>{glance.label}</Text>
                <Text style={styles.glanceValue}>{glance.value}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Today</Text>
          <Text style={styles.sectionHint}>Tap any activity to hear it read aloud.</Text>
        </View>

        <View style={styles.list}>
          {timeline.activities.map((activity, index) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              index={index}
              onPress={() => speak(buildActivityVoiceLine(activity))}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'space-between',
  },
  content: {
    gap: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  topRow: {
    gap: spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.wake.surfaceBorder,
    backgroundColor: 'rgba(240, 234, 214, 0.03)',
  },
  backLabel: {
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    color: colors.wake.clockText,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.84,
  },
  heroPanel: {
    backgroundColor: colors.wake.surfaceStrong,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(245, 201, 122, 0.22)',
    padding: spacing.xl,
    gap: spacing.md,
  },
  overline: {
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    color: colors.wake.surfaceMuted,
    textTransform: 'uppercase',
  },
  heroHeadline: {
    fontSize: type.headlineLargeSize,
    fontWeight: type.headlineWeight,
    letterSpacing: type.headlineLetterSpacing,
    color: colors.wake.clockText,
    lineHeight: 42,
  },
  heroCopy: {
    fontSize: type.bodySize,
    fontWeight: type.bodyWeight,
    lineHeight: 24,
    color: colors.wake.surfaceMuted,
  },
  summaryRow: {
    gap: spacing.md,
  },
  summaryCard: {
    backgroundColor: 'rgba(240, 234, 214, 0.04)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.wake.surfaceBorder,
    padding: spacing.md,
    gap: 4,
  },
  summaryLabel: {
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    color: palette.amber400,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: type.ctaSize,
    fontWeight: type.ctaWeight,
    color: colors.wake.clockText,
  },
  summarySubvalue: {
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    color: colors.wake.surfaceMuted,
  },
  lockScreenPanel: {
    backgroundColor: colors.wake.surfaceBg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.wake.surfaceBorder,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  lockTitle: {
    fontSize: type.ctaSize,
    fontWeight: type.ctaWeight,
    color: colors.wake.clockText,
  },
  lockCopy: {
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    color: colors.wake.surfaceMuted,
    lineHeight: 20,
  },
  glanceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  glancePill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(240, 234, 214, 0.05)',
    borderWidth: 1,
    borderColor: colors.wake.surfaceBorder,
    gap: 2,
  },
  glanceLabel: {
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    color: colors.wake.surfaceSubtle,
    textTransform: 'uppercase',
  },
  glanceValue: {
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    color: colors.wake.clockText,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    color: colors.wake.surfaceMuted,
    textTransform: 'uppercase',
  },
  sectionHint: {
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    color: colors.wake.surfaceSubtle,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
})
