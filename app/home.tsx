import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import * as Speech from 'expo-speech'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { router } from 'expo-router'

import { Screen } from '../components/Screen'
import { colors, duration, font, palette, radius, shadows, spacing, type } from '../constants/theme'
import { useAlarm } from '../context/AlarmContext'
import { useCurrentTime } from '../hooks/useCurrentTime'
import { useMorningBriefing } from '../hooks/useMorningBriefing'
import { cancelAlarmNotification } from '../hooks/useAlarmNotification'

// ─── types ───────────────────────────────────────────────────────────────────

type ReadSection = 'idle' | 'weather' | 'news' | 'scores'

// ─── helpers ─────────────────────────────────────────────────────────────────

function splitTime(now: Date): { digits: string; period: string } {
  const h = now.getHours()
  const m = now.getMinutes()
  const h12 = h % 12 || 12
  return { digits: `${h12}:${String(m).padStart(2, '0')}`, period: h < 12 ? 'AM' : 'PM' }
}

function formatAlarm(t: string): string {
  const [hStr, mStr] = t.split(':')
  const h24 = parseInt(hStr, 10)
  return `${h24 % 12 || 12}:${mStr} ${h24 < 12 ? 'AM' : 'PM'}`
}

function timeUntil(t: string, now: Date): string {
  const [ah, am] = t.split(':').map(Number)
  let diff = ah * 60 + am - (now.getHours() * 60 + now.getMinutes())
  if (diff <= 0) diff += 1440
  const h = Math.floor(diff / 60), m = diff % 60
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`
}

// ─── component ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { state, fireAlarm } = useAlarm()
  const now = useCurrentTime(1_000)
  const { data: edition, isLoading, isRefreshing, error, updatedAt, refresh } = useMorningBriefing()

  const [readSection, setReadSection] = useState<ReadSection>('idle')
  const isSpeaking = readSection !== 'idle'
  const stopRef = useRef(false)

  // ── Alarm trigger ──
  useEffect(() => {
    if (state.phase !== 'idle') return
    const [ah, am] = state.alarmTime.split(':').map(Number)
    if (now.getHours() === ah && now.getMinutes() === am) {
      cancelAlarmNotification()
      fireAlarm()
      router.replace('/alarm/wake')
    }
  }, [now, state.phase, state.alarmTime, fireAlarm])

  // ── Entrance fade ──
  const fadeOpacity = useSharedValue(0)
  const fadeY = useSharedValue(14)
  useEffect(() => {
    fadeOpacity.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) })
    fadeY.value = withTiming(0, { duration: 480, easing: Easing.out(Easing.cubic) })
  }, [fadeOpacity, fadeY])
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
    transform: [{ translateY: fadeY.value }],
  }))

  // ── Briefing pulse (while speaking) ──
  const pulseScale = useSharedValue(1)
  useEffect(() => {
    if (isSpeaking) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 600, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.00, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      )
    } else {
      pulseScale.value = withTiming(1, { duration: 200 })
    }
  }, [isSpeaking, pulseScale])
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  // ── Derived values ──
  const { digits, period } = splitTime(now)

  const formattedDate = useMemo(
    () => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [now.toDateString()],
  )

  const alarmLabel = formatAlarm(state.alarmTime)
  const countdown = timeUntil(state.alarmTime, now)

  const weatherLine = edition
    ? `${edition.weather.temperatureF}° · ${edition.weather.condition}`
    : null
  const weatherRange = edition
    ? `H ${edition.weather.highF}° / L ${edition.weather.lowF}°`
    : null

  const headline = edition?.localStories[0] ?? edition?.topStories[0] ?? null
  const scores = (edition?.localScores ?? []).filter((s) => s.state === 'live' || s.state === 'final')
  const topScore = scores[0] ?? null

  const updatedLabel = updatedAt
    ? `Updated ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(updatedAt)}`
    : error
      ? 'Tap to retry'
      : isLoading
        ? 'Loading…'
        : null

  // ── Sequenced briefing reader ──
  const stopBriefing = useCallback(() => {
    stopRef.current = true
    Speech.stop()
    setReadSection('idle')
  }, [])

  const runBriefing = useCallback(() => {
    if (!edition) return
    if (isSpeaking) { stopBriefing(); return }

    stopRef.current = false

    const parts: Array<{ section: ReadSection; text: string }> = []

    parts.push({
      section: 'weather',
      text: `Weather: ${edition.weather.temperatureF} degrees and ${edition.weather.condition.toLowerCase()}. High ${edition.weather.highF}, low ${edition.weather.lowF}.`,
    })

    if (headline) {
      parts.push({
        section: 'news',
        text: `${headline.title}. ${headline.summary}`,
      })
    }

    if (topScore) {
      parts.push({
        section: 'scores',
        text: `${topScore.team} ${topScore.teamScore ?? ''}, ${topScore.opponent} ${topScore.opponentScore ?? ''}. ${topScore.status}.`,
      })
    }

    const speak = (index: number) => {
      if (stopRef.current || index >= parts.length) {
        setReadSection('idle')
        return
      }
      const { section, text } = parts[index]
      setReadSection(section)
      Speech.speak(text, {
        rate: 0.88,
        pitch: 1.0,
        onDone: () => speak(index + 1),
        onError: () => speak(index + 1),
      })
    }

    speak(0)
  }, [edition, headline, topScore, isSpeaking, stopBriefing])

  const hasData = !!edition
  const isFirstLoad = isLoading && !hasData

  return (
    <Screen
      gradient={colors.wake.gradientColors}
      gradientLocations={colors.wake.gradientLocations}
      style={styles.screen}
    >
      {/* Ambient background glows */}
      <View pointerEvents="none" style={styles.blobTop} />
      <View pointerEvents="none" style={styles.blobBottom} />

      {/* ── Top bar ── */}
      <Animated.View style={[styles.topBar, fadeStyle]}>
        <Text style={styles.brand}>NICECLOCK</Text>
        <Pressable
          onPress={error || !hasData ? refresh : undefined}
          style={({ pressed }) => [styles.statusPill, (error || isRefreshing) && styles.statusPillAlert, pressed && styles.dimmed]}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={palette.amber400} style={{ marginRight: 4 }} />
          ) : (
            <View style={[styles.statusDot, error ? styles.statusDotError : styles.statusDotOk]} />
          )}
          <Text style={[styles.statusText, error && styles.statusTextError]}>
            {updatedLabel ?? (edition ? `${edition.locationLabel}` : 'Live')}
          </Text>
        </Pressable>
      </Animated.View>

      {/* ── Clock ── */}
      <Animated.View style={[styles.clockZone, fadeStyle]}>
        <View style={styles.clockInner}>
          <Text style={styles.clockDigits}>{digits}</Text>
          <Text style={styles.clockPeriod}>{period}</Text>
        </View>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </Animated.View>

      {/* ── Alarm pill + Hear trigger ── */}
      <Animated.View style={[styles.controlRow, fadeStyle]}>
        <Pressable
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.alarmPill, pressed && styles.dimmed]}
        >
          <View style={styles.alarmDot} />
          <Text style={styles.alarmTime}>Wake {alarmLabel}</Text>
          <View style={styles.pillDivider} />
          <Text style={styles.alarmCountdown}>in {countdown}</Text>
        </Pressable>

        {/* Hear Briefing trigger */}
        <Animated.View style={pulseStyle}>
          <Pressable
            onPress={runBriefing}
            disabled={!hasData}
            style={({ pressed }) => [
              styles.hearBtn,
              isSpeaking && styles.hearBtnActive,
              (!hasData || isFirstLoad) && styles.hearBtnDisabled,
              pressed && styles.dimmed,
            ]}
          >
            <Text style={[styles.hearBtnText, isSpeaking && styles.hearBtnTextActive]}>
              {isSpeaking ? '◼  Stop' : '▶  Hear'}
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>

      {/* ── Info card ── */}
      <Animated.View style={[styles.card, fadeStyle]}>

        {/* Weather */}
        <Pressable
          onPress={() => {
            if (!edition) return
            setReadSection('weather')
            Speech.speak(
              `${edition.weather.temperatureF} degrees, ${edition.weather.condition}. High ${edition.weather.highF}, low ${edition.weather.lowF}.`,
              { rate: 0.88, onDone: () => setReadSection('idle'), onError: () => setReadSection('idle') },
            )
          }}
          style={({ pressed }) => [
            styles.cardRow,
            readSection === 'weather' && styles.cardRowActive,
            pressed && styles.dimmed,
          ]}
        >
          <Text style={styles.rowLabel}>Weather</Text>
          <View style={styles.rowContent}>
            {isFirstLoad ? (
              <View style={styles.loadRow}><ActivityIndicator size="small" color={palette.amber400} /><Text style={styles.loadText}>Fetching…</Text></View>
            ) : weatherLine ? (
              <View style={styles.weatherInner}>
                <Text style={styles.weatherMain}>{weatherLine}</Text>
                <Text style={styles.weatherSub}>{weatherRange}</Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>Unavailable</Text>
            )}
          </View>
          {readSection === 'weather' && <View style={styles.activeBar} />}
        </Pressable>

        <View style={styles.divider} />

        {/* News */}
        <Pressable
          onPress={() => {
            if (!headline) return
            setReadSection('news')
            Speech.speak(`${headline.title}. ${headline.summary}`, {
              rate: 0.88,
              onDone: () => setReadSection('idle'),
              onError: () => setReadSection('idle'),
            })
          }}
          style={({ pressed }) => [
            styles.cardRow,
            styles.cardRowTall,
            readSection === 'news' && styles.cardRowActive,
            pressed && styles.dimmed,
          ]}
        >
          <Text style={styles.rowLabel}>News</Text>
          <View style={styles.rowContent}>
            {isFirstLoad ? (
              <View style={styles.loadRow}><ActivityIndicator size="small" color={palette.amber400} /><Text style={styles.loadText}>Loading…</Text></View>
            ) : headline ? (
              <>
                <Text style={styles.newsSource}>{headline.source}</Text>
                <Text style={styles.newsHeadline} numberOfLines={3}>{headline.title}</Text>
              </>
            ) : (
              <Text style={styles.emptyText}>No headlines</Text>
            )}
          </View>
          {readSection === 'news' && <View style={styles.activeBar} />}
        </Pressable>

        {/* Scores — only render when there's a result or we're loading */}
        {(topScore || isFirstLoad) && (
          <>
            <View style={styles.divider} />
            <Pressable
              onPress={() => {
                if (!topScore) return
                setReadSection('scores')
                Speech.speak(
                  `${topScore.team} ${topScore.teamScore ?? ''}, ${topScore.opponent} ${topScore.opponentScore ?? ''}. ${topScore.status}.`,
                  { rate: 0.88, onDone: () => setReadSection('idle'), onError: () => setReadSection('idle') },
                )
              }}
              style={({ pressed }) => [
                styles.cardRow,
                readSection === 'scores' && styles.cardRowActive,
                pressed && styles.dimmed,
              ]}
            >
              <Text style={styles.rowLabel}>Scores</Text>
              <View style={styles.rowContent}>
                {isFirstLoad ? (
                  <View style={styles.loadRow}><ActivityIndicator size="small" color={palette.amber400} /><Text style={styles.loadText}>Checking…</Text></View>
                ) : topScore ? (
                  <View style={styles.scoreChips}>
                    {scores.slice(0, 2).map((s) => (
                      <View key={s.id} style={styles.scoreChip}>
                        {s.state === 'live' && <View style={styles.liveDot} />}
                        <Text style={styles.scoreText}>{s.team} {s.teamScore ?? '–'}  ·  {s.opponent} {s.opponentScore ?? '–'}</Text>
                        <Text style={styles.scoreStatus}>{s.status}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
              {readSection === 'scores' && <View style={styles.activeBar} />}
            </Pressable>
          </>
        )}
      </Animated.View>

      {/* ── Buttons ── */}
      <Animated.View style={[styles.actions, fadeStyle]}>
        <Pressable
          onPress={() => router.push('/activities')}
          style={({ pressed }) => [styles.btn, pressed && styles.dimmed]}
        >
          <Text style={styles.btnText}>View Day</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.dimmed]}
        >
          <Text style={[styles.btnText, styles.btnTextPrimary]}>Set Alarm</Text>
        </Pressable>
      </Animated.View>
    </Screen>
  )
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'space-between' },

  blobTop: {
    position: 'absolute', top: -80, right: -60, width: 300, height: 300,
    borderRadius: 150, backgroundColor: 'rgba(245, 201, 122, 0.09)',
  },
  blobBottom: {
    position: 'absolute', bottom: 80, left: -90, width: 240, height: 240,
    borderRadius: 120, backgroundColor: 'rgba(22, 45, 85, 0.22)',
  },

  // ── Top bar ──
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 4,
  },
  brand: {
    fontFamily: font.sans, fontSize: type.brandSize, fontWeight: type.brandWeight,
    letterSpacing: type.brandLetterSpacing, color: 'rgba(240, 234, 214, 0.36)',
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 5, paddingHorizontal: 10,
    borderRadius: radius.circle,
    backgroundColor: 'rgba(240, 234, 214, 0.05)',
    borderWidth: 1, borderColor: 'rgba(240, 234, 214, 0.08)',
  },
  statusPillAlert: { borderColor: 'rgba(192, 57, 43, 0.3)', backgroundColor: 'rgba(192, 57, 43, 0.08)' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusDotOk: { backgroundColor: '#4CAF50' },
  statusDotError: { backgroundColor: palette.red300 },
  statusText: { fontFamily: font.sans, fontSize: 11, fontWeight: '500', color: 'rgba(240, 234, 214, 0.44)' },
  statusTextError: { color: palette.red300 },

  // ── Clock ──
  clockZone: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  clockInner: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  clockDigits: {
    fontFamily: font.editorial, fontSize: 104, fontWeight: '200',
    letterSpacing: -5, lineHeight: 108, color: colors.wake.clockText,
  },
  clockPeriod: {
    fontFamily: font.sans, fontSize: 20, fontWeight: '500',
    letterSpacing: 2, color: 'rgba(240, 234, 214, 0.48)', marginBottom: 14,
  },
  dateText: {
    fontFamily: font.sans, fontSize: 16, fontWeight: '400',
    color: 'rgba(240, 234, 214, 0.52)',
  },

  // ── Alarm pill + Hear button row ──
  controlRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingBottom: spacing.md,
  },
  alarmPill: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    paddingVertical: 9, paddingHorizontal: 16,
    borderRadius: radius.circle,
    backgroundColor: 'rgba(245, 201, 122, 0.09)',
    borderWidth: 1, borderColor: 'rgba(245, 201, 122, 0.18)',
  },
  alarmDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.amber400 },
  alarmTime: { fontFamily: font.sans, fontSize: 14, fontWeight: '600', color: colors.wake.clockText },
  pillDivider: { width: 1, height: 12, backgroundColor: 'rgba(245, 201, 122, 0.22)' },
  alarmCountdown: { fontFamily: font.sans, fontSize: 13, fontWeight: '500', color: palette.amber400 },

  hearBtn: {
    paddingVertical: 9, paddingHorizontal: 16,
    borderRadius: radius.circle,
    backgroundColor: 'rgba(245, 201, 122, 0.09)',
    borderWidth: 1, borderColor: 'rgba(245, 201, 122, 0.18)',
  },
  hearBtnActive: {
    backgroundColor: 'rgba(245, 201, 122, 0.18)',
    borderColor: palette.amber400,
  },
  hearBtnDisabled: { opacity: 0.38 },
  hearBtnText: {
    fontFamily: font.sans, fontSize: 14, fontWeight: '600',
    color: 'rgba(245, 201, 122, 0.70)',
  },
  hearBtnTextActive: { color: palette.amber400 },

  // ── Info card ──
  card: {
    borderRadius: radius.xl,
    backgroundColor: 'rgba(7, 16, 30, 0.74)',
    borderWidth: 1, borderColor: colors.wake.surfaceBorder,
    overflow: 'hidden',
    ...shadows.cardLuxury,
  },
  cardRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, paddingVertical: 14, paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  cardRowTall: { alignItems: 'flex-start', minHeight: 72 },
  cardRowActive: { backgroundColor: 'rgba(245, 201, 122, 0.06)' },
  activeBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 3, backgroundColor: palette.amber400, borderRadius: 2,
  },
  divider: { height: 1, marginHorizontal: spacing.lg, backgroundColor: colors.wake.surfaceBorder },

  rowLabel: {
    width: 62, fontFamily: font.sans, fontSize: 10, fontWeight: '600',
    letterSpacing: 1.6, textTransform: 'uppercase', color: palette.amber400,
    paddingTop: 2, flexShrink: 0,
  },
  rowContent: { flex: 1, gap: 3 },

  loadRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadText: { fontFamily: font.sans, fontSize: 13, color: 'rgba(240, 234, 214, 0.38)' },
  emptyText: { fontFamily: font.sans, fontSize: 13, color: 'rgba(240, 234, 214, 0.32)' },

  weatherInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weatherMain: { fontFamily: font.sans, fontSize: 15, fontWeight: '600', color: colors.wake.clockText },
  weatherSub: { fontFamily: font.sans, fontSize: 12, color: 'rgba(240, 234, 214, 0.48)' },

  newsSource: {
    fontFamily: font.sans, fontSize: 10, fontWeight: '600',
    letterSpacing: 1.1, textTransform: 'uppercase', color: 'rgba(240, 234, 214, 0.38)',
  },
  newsHeadline: {
    fontFamily: font.editorial, fontSize: 16, fontWeight: '600',
    lineHeight: 22, color: colors.wake.clockText,
  },

  scoreChips: { gap: 5 },
  scoreChip: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.amber400 },
  scoreText: { fontFamily: font.sans, fontSize: 14, fontWeight: '600', color: colors.wake.clockText },
  scoreStatus: { fontFamily: font.sans, fontSize: 11, color: 'rgba(240, 234, 214, 0.40)' },

  // ── Buttons ──
  actions: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.md },
  btn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.wake.surfaceBorder,
    backgroundColor: 'rgba(240, 234, 214, 0.05)',
  },
  btnPrimary: {
    backgroundColor: palette.amber500, borderColor: palette.amber500,
    ...shadows.ctaGlow(palette.amber500),
  },
  btnText: { fontFamily: font.sans, fontSize: type.ctaSize, fontWeight: type.ctaWeight, color: colors.wake.clockText },
  btnTextPrimary: { color: palette.navy900 },
  dimmed: { opacity: 0.72 },
})
