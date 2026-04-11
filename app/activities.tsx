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
import { colors, font, palette, radius, shadows, spacing, type } from '../constants/theme'
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
      <View pointerEvents="none" style={styles.atmosphereTop} />
      <View pointerEvents="none" style={styles.atmosphereBottom} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.topRow, topStyle]}>
          <View style={styles.navRow}>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Text style={styles.backLabel}>Back</Text>
            </Pressable>
            <StatusPill label={timeline.active ? 'Live now' : 'Upcoming'} variant="dot" />
          </View>
          <ProductMark />
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

        <Animated.View style={[styles.contextGrid, topStyle]}>
          <View style={styles.lockScreenPanel}>
            <Text style={styles.lockTitle}>Read-only companion</Text>
            <Text style={styles.lockCopy}>
              This surface already compresses to the same active, next, and glance truth the lock screen will mirror later.
            </Text>
            <View style={styles.glanceRow}>
              {lockScreenSnapshot.glances.map((glance) => (
                <View key={glance.key} style={styles.glancePill}>
                  <Text style={styles.glanceLabel}>{glance.label}</Text>
                  <Text style={styles.glanceValue}>{glance.value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.helperPanel}>
            <Text style={styles.lockTitle}>Tap to hear</Text>
            <Text style={styles.lockCopy}>
              Each card reads the title, time range, and a single supporting detail so the day stays skimmable.
            </Text>
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
  atmosphereTop: {
    position: 'absolute',
    top: -70,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.wake.overlayTop,
  },
  atmosphereBottom: {
    position: 'absolute',
    bottom: 120,
    left: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(245, 201, 122, 0.05)',
  },
  content: {
    gap: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  topRow: {
    gap: spacing.md,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    backgroundColor: colors.wake.panelWarm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(245, 201, 122, 0.22)',
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.cardLuxury,
  },
  overline: {
    fontFamily: font.sans,
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    color: colors.wake.surfaceMuted,
    textTransform: 'uppercase',
  },
  heroHeadline: {
    fontFamily: font.editorial,
    fontSize: type.heroSize,
    fontWeight: '600',
    letterSpacing: type.heroLetterSpacing,
    color: colors.wake.clockText,
    lineHeight: 52,
  },
  heroCopy: {
    fontFamily: font.sans,
    fontSize: type.bodySize,
    fontWeight: type.bodyWeight,
    lineHeight: 24,
    color: colors.wake.surfaceMuted,
  },
  summaryRow: {
    gap: spacing.md,
  },
  summaryCard: {
    backgroundColor: 'rgba(240, 234, 214, 0.05)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.wake.surfaceBorder,
    padding: spacing.md,
    gap: 4,
  },
  summaryLabel: {
    fontFamily: font.sans,
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    color: palette.amber400,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontFamily: font.editorial,
    fontSize: type.ctaSize,
    fontWeight: '600',
    color: colors.wake.clockText,
  },
  summarySubvalue: {
    fontFamily: font.sans,
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    color: colors.wake.surfaceMuted,
  },
  contextGrid: {
    gap: spacing.md,
  },
  lockScreenPanel: {
    backgroundColor: colors.wake.panelCool,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.wake.surfaceBorder,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  helperPanel: {
    backgroundColor: 'rgba(9, 17, 31, 0.62)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.wake.surfaceBorder,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  lockTitle: {
    fontFamily: font.editorial,
    fontSize: type.ctaSize,
    fontWeight: '600',
    color: colors.wake.clockText,
  },
  lockCopy: {
    fontFamily: font.sans,
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
    fontFamily: font.sans,
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    color: colors.wake.surfaceSubtle,
    textTransform: 'uppercase',
  },
  glanceValue: {
    fontFamily: font.sans,
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    color: colors.wake.clockText,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionLabel: {
    fontFamily: font.sans,
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    color: colors.wake.surfaceMuted,
    textTransform: 'uppercase',
  },
  sectionHint: {
    fontFamily: font.sans,
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    color: colors.wake.surfaceSubtle,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
})
