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

import { ProductMark } from '../components/ProductMark'
import { Screen } from '../components/Screen'
import { colors, font, palette, shadows, spacing } from '../constants/theme'
import { useAlarm } from '../context/AlarmContext'
import { getSelectedLockScreenGlances, mockDay } from '../data/mockDay'
import { useCurrentTime } from '../hooks/useCurrentTime'
import { useMorningBriefing } from '../hooks/useMorningBriefing'
import { useVoice } from '../hooks/useVoice'
import { createLockScreenSnapshot } from '../lib/activityTimeline'
import { createMorningSurfaceSnapshot } from '../lib/morningSurface'

export default function HomeScreen() {
  const { state, fireAlarm } = useAlarm()
  // 10s interval so we catch the alarm minute within ~10 seconds of it starting
  const now = useCurrentTime(10_000)
  const { data: edition, isLoading, error, updatedAt } = useMorningBriefing()
  const { speak } = useVoice()

  const snapshot = useMemo(
    () =>
      createMorningSurfaceSnapshot({
        now,
        alarmTime: state.alarmTime,
        activities: mockDay.activities,
        edition,
      }),
    [edition, now, state.alarmTime]
  )

  const lockSnapshot = useMemo(
    () =>
      createLockScreenSnapshot({
        activities: mockDay.activities,
        now,
        glances: getSelectedLockScreenGlances(mockDay),
      }),
    [now]
  )

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).format(now),
    [now]
  )

  const topOpacity = useSharedValue(0)
  const topY = useSharedValue(26)

  useEffect(() => {
    topOpacity.value = withDelay(40, withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) }))
    topY.value = withDelay(40, withTiming(0, { duration: 560, easing: Easing.out(Easing.cubic) }))
  }, [topOpacity, topY])

  const topStyle = useAnimatedStyle(() => ({
    opacity: topOpacity.value,
    transform: [{ translateY: topY.value }],
  }))

  // Real alarm trigger: fires when the current wall-clock minute matches alarmTime.
  // Only active in idle phase. Clears itself once phase changes.
  useEffect(() => {
    if (state.phase !== 'idle') return
    const [alarmH, alarmM] = state.alarmTime.split(':').map(Number)
    if (now.getHours() === alarmH && now.getMinutes() === alarmM) {
      fireAlarm()
      router.replace('/alarm/wake')
    }
  }, [now, state.phase, state.alarmTime, fireAlarm])

  const statusLine = error
    ? 'Live feed paused'
    : isLoading && !edition
      ? 'Refreshing morning signals'
      : updatedAt
        ? `Updated ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(updatedAt)}`
        : snapshot.liveNote

  const handleReadLead = () => speak(`${snapshot.localLead}. ${snapshot.localLeadSummary}`)
  const handleReadBriefing = () => speak(edition?.narration ?? `Wake set for ${snapshot.nextAlarmLabel}. ${snapshot.supportingLine}`)
  const handleReadWeather = () => speak(`Weather. ${snapshot.weatherLine}. ${snapshot.weatherSummary}`)
  const handleReadScores = () => {
    if (!snapshot.scoreCard) return
    speak(`${snapshot.scoreCard.team} versus ${snapshot.scoreCard.opponent}. ${snapshot.scoreLine}. ${snapshot.scoreCard.status}.`)
  }

  return (
    <Screen gradient={colors.wake.gradientColors} gradientLocations={colors.wake.gradientLocations} style={styles.screen}>
      <View pointerEvents="none" style={styles.haloTop} />
      <View pointerEvents="none" style={styles.haloSide} />
      <View pointerEvents="none" style={styles.haloBottom} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.masthead, topStyle]}>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{formattedDate}</Text>
            <Text style={styles.metaDivider}>/</Text>
            <Text style={styles.metaText}>{edition?.locationLabel ?? 'New York edition'}</Text>
          </View>
          <ProductMark />
          <Text style={styles.statusText}>{statusLine}</Text>
        </Animated.View>

        <Animated.View style={[styles.heroZone, topStyle]}>
          <View pointerEvents="none" style={styles.heroGlow} />
          <Text style={styles.heroTitle}>{snapshot.primaryTitle}</Text>
          <Text style={styles.heroSupport}>{snapshot.supportingLine}</Text>

          <View style={styles.heroInfoLine}>
            <Text style={styles.wakeTime}>{snapshot.nextAlarmLabel}</Text>
            <Text style={styles.voiceNote}>Alarm reads weather, lead, scoreline.</Text>
          </View>

          <View style={styles.nextLine}>
            <Text style={styles.nextLabel}>Next</Text>
            <Text style={styles.nextValue} numberOfLines={1}>{lockSnapshot.nextActivity?.title ?? 'Morning stays open'}</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.signalRow, topStyle]}>
          <Pressable onPress={handleReadWeather} style={({ pressed }) => [styles.weatherLine, pressed && styles.pressed]}>
            <Text style={styles.signalKey}>Weather</Text>
            <Text style={styles.signalText} numberOfLines={1}>{snapshot.weatherLine}</Text>
          </Pressable>

          <Pressable onPress={handleReadScores} style={({ pressed }) => [styles.scoreRow, pressed && styles.pressed]}>
            <Text style={styles.scoreKey}>Board</Text>
            <View style={styles.scoreStream}>
              {snapshot.scoreItems.length > 0 ? (
                snapshot.scoreItems.slice(0, 3).map((score) => (
                  <View key={score.id} style={styles.scoreItem}>
                    <View style={[styles.scoreDot, score.state === 'live' && styles.scoreDotLive]} />
                    <Text style={styles.scoreText} numberOfLines={1}>
                      {score.team} {score.teamScore ?? ''}-{score.opponent} {score.opponentScore ?? ''}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.scoreFallback}>No New York line</Text>
              )}
            </View>
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.leadZone, topStyle]}>
          <View pointerEvents="none" style={styles.leadPlate} />
          <Pressable onPress={handleReadLead} style={({ pressed }) => [styles.leadTouch, pressed && styles.pressed]}>
            <Text style={styles.leadLabel}>Local lead</Text>
            <Text style={styles.leadTitle}>{snapshot.localLead}</Text>
            <Text style={styles.leadText} numberOfLines={2}>{snapshot.localLeadSummary}</Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.bottomLine, topStyle]}>
          <View style={styles.nowLine}>
            <Text style={styles.nowLabel}>Now</Text>
            <Text style={styles.nowTitle}>{lockSnapshot.activeActivity?.title ?? 'No active block'}</Text>
            <Text style={styles.nowMeta}>{lockSnapshot.activeActivity?.timeRange ?? 'Waiting for the next window'}</Text>
          </View>

          <Pressable onPress={handleReadBriefing} style={({ pressed }) => [styles.briefingLine, pressed && styles.pressed]}>
            <Text style={styles.briefingText}>{snapshot.weatherLine}. {snapshot.localLeadSummary}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <Animated.View style={[styles.footer, topStyle]}>
        <Pressable onPress={() => router.push('/activities')} style={({ pressed }) => [styles.footerLink, pressed && styles.pressed]}>
          <Text style={styles.footerLinkText}>View day</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/settings')} style={({ pressed }) => [styles.footerLink, styles.footerLinkQuiet, pressed && styles.pressed]}>
          <Text style={[styles.footerLinkText, styles.footerLinkTextQuiet]}>Settings</Text>
        </Pressable>
      </Animated.View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'space-between',
  },
  haloTop: {
    position: 'absolute',
    top: -130,
    right: -60,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(245, 201, 122, 0.14)',
  },
  haloSide: {
    position: 'absolute',
    top: 240,
    left: -150,
    width: 300,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(35, 66, 118, 0.16)',
  },
  haloBottom: {
    position: 'absolute',
    bottom: 40,
    right: -110,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(7, 18, 34, 0.58)',
  },
  content: {
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  masthead: {
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: font.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(240, 234, 214, 0.56)',
  },
  metaDivider: {
    color: 'rgba(240, 234, 214, 0.18)',
  },
  statusText: {
    fontFamily: font.sans,
    fontSize: 12,
    color: 'rgba(240, 234, 214, 0.34)',
  },
  heroZone: {
    position: 'relative',
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  heroGlow: {
    position: 'absolute',
    top: -20,
    right: -10,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(245, 201, 122, 0.08)',
  },
  heroTitle: {
    width: '76%',
    fontFamily: font.editorial,
    fontSize: 49,
    lineHeight: 53,
    fontWeight: '600',
    letterSpacing: -1.8,
    color: colors.wake.clockText,
  },
  heroSupport: {
    width: '74%',
    fontFamily: font.sans,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(240, 234, 214, 0.58)',
  },
  heroInfoLine: {
    gap: 2,
    marginTop: 4,
  },
  wakeTime: {
    fontFamily: font.editorial,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '600',
    color: colors.wake.clockText,
  },
  voiceNote: {
    fontFamily: font.sans,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(240, 234, 214, 0.66)',
  },
  nextLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: 6,
  },
  nextLabel: {
    fontFamily: font.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: palette.amber400,
  },
  nextValue: {
    flex: 1,
    fontFamily: font.editorial,
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '600',
    color: colors.wake.clockText,
  },
  signalRow: {
    gap: 10,
    marginTop: spacing.sm,
  },
  weatherLine: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 999,
  },
  signalKey: {
    fontFamily: font.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: palette.amber400,
  },
  signalText: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 13,
    fontWeight: '600',
    color: colors.wake.clockText,
  },
  scoreRow: {
    gap: 6,
  },
  scoreKey: {
    fontFamily: font.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(240, 234, 214, 0.4)',
  },
  scoreStream: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(8, 18, 32, 0.44)',
  },
  scoreDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(240, 234, 214, 0.28)',
  },
  scoreDotLive: {
    backgroundColor: palette.amber400,
  },
  scoreText: {
    fontFamily: font.sans,
    fontSize: 12,
    color: 'rgba(240, 234, 214, 0.76)',
  },
  scoreFallback: {
    fontFamily: font.sans,
    fontSize: 12,
    color: 'rgba(240, 234, 214, 0.42)',
  },
  leadZone: {
    position: 'relative',
    marginTop: spacing.lg,
    marginLeft: spacing.lg,
    minHeight: 264,
  },
  leadPlate: {
    position: 'absolute',
    inset: 0,
    borderRadius: 36,
    backgroundColor: 'rgba(7, 18, 34, 0.72)',
    ...shadows.cardLuxury,
  },
  leadTouch: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  leadLabel: {
    fontFamily: font.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: palette.amber400,
  },
  leadTitle: {
    width: '88%',
    fontFamily: font.editorial,
    fontSize: 33,
    lineHeight: 37,
    fontWeight: '600',
    color: colors.wake.clockText,
  },
  leadText: {
    width: '78%',
    fontFamily: font.sans,
    fontSize: 14,
    lineHeight: 19,
    color: 'rgba(240, 234, 214, 0.58)',
  },
  bottomLine: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  nowLine: {
    gap: 2,
  },
  nowLabel: {
    fontFamily: font.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(240, 234, 214, 0.42)',
  },
  nowTitle: {
    fontFamily: font.editorial,
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '600',
    color: colors.wake.clockText,
  },
  nowMeta: {
    fontFamily: font.sans,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(240, 234, 214, 0.48)',
  },
  briefingLine: {
    paddingVertical: 4,
  },
  briefingText: {
    fontFamily: font.sans,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(240, 234, 214, 0.68)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  footerLink: {
    minHeight: 32,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  footerLinkQuiet: {
    opacity: 0.72,
  },
  footerLinkText: {
    fontFamily: font.sans,
    fontSize: 15,
    fontWeight: '600',
    color: colors.wake.clockText,
  },
  footerLinkTextQuiet: {
    color: 'rgba(240, 234, 214, 0.66)',
  },
  pressed: {
    opacity: 0.86,
  },
})
