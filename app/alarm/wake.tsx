import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { router } from 'expo-router'

import { GlowButton } from '../../components/GlowButton'
import { ProductMark } from '../../components/ProductMark'
import { Screen } from '../../components/Screen'
import { StatusPill } from '../../components/StatusPill'
import { TimeDisplay } from '../../components/TimeDisplay'
import { alarmAudioConfig } from '../../constants/audio'
import { colors, font, radius, spacing, type } from '../../constants/theme'
import { useAlarm } from '../../context/AlarmContext'
import { voiceScripts } from '../../data/mockDay'
import { useAlarmSound } from '../../hooks/useAlarmSound'
import { useAlarmTimer } from '../../hooks/useAlarmTimer'
import { useMorningEdition } from '../../hooks/useMorningEdition'
import { useVoice } from '../../hooks/useVoice'

export default function WakeScreen() {
  const { confirmAwake, triggerEscalation } = useAlarm()
  const { speak } = useVoice()
  const { playWake, stop } = useAlarmSound()
  const { data: edition } = useMorningEdition()
  const hasSpokenRef = useRef(false)

  useEffect(() => {
    playWake()
  }, [playWake])

  useEffect(() => {
    if (hasSpokenRef.current) return

    const script = edition?.narration ?? voiceScripts.wake
    const delay = edition ? alarmAudioConfig.wake.voiceDelayMs : alarmAudioConfig.wake.voiceDelayMs + 900
    const id = setTimeout(() => {
      if (hasSpokenRef.current) return
      hasSpokenRef.current = true
      speak(script)
    }, delay)

    return () => clearTimeout(id)
  }, [edition, speak])

  useAlarmTimer({
    delayMs: 30_000,
    onEscalate: () => {
      triggerEscalation()
      router.replace('/alarm/escalation')
    },
  })

  const handleConfirm = async () => {
    await stop()
    confirmAwake()
    router.replace('/alarm/briefing')
  }

  const topOpacity = useSharedValue(0)
  useEffect(() => {
    topOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    )
  }, [topOpacity])
  const topStyle = useAnimatedStyle(() => ({ opacity: topOpacity.value }))

  const dataOpacity = useSharedValue(0)
  useEffect(() => {
    dataOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
    )
  }, [dataOpacity])
  const dataStyle = useAnimatedStyle(() => ({ opacity: dataOpacity.value }))

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

  // Build live data rows when edition is ready
  const topScore = edition?.localScores[0]
  const hasScore = !!topScore?.teamScore
  const localLead = edition?.localStories[0]?.title
  const topLead = edition?.topStories[0]?.title

  // Use local story as the second headline if it differs from the top story
  const secondLead = localLead && localLead !== topLead ? localLead : null

  return (
    <Screen
      gradient={colors.wake.gradientColors}
      gradientLocations={[0, 0.55, 1] as const}
      style={styles.screen}
    >
      <Animated.View style={[styles.top, topStyle]}>
        <ProductMark />
        <StatusPill label="Alarm active" variant="dot" />
      </Animated.View>

      <View style={styles.center}>
        <TimeDisplay
          textColor={colors.wake.clockText}
          dateColor={colors.wake.dateText}
          showGlow
          glowColor={colors.wake.glowColor}
          animateIn
        />

        <View style={styles.divider} />

        <Animated.View style={[styles.promptBlock, topStyle]}>
          <Text style={styles.prompt}>Are you awake?</Text>
          {topLead ? (
            <Text style={styles.storyPrompt} numberOfLines={2}>{topLead}</Text>
          ) : null}
        </Animated.View>

        {/* Live data strip — weather · score · local lead */}
        {edition ? (
          <Animated.View style={[styles.liveStrip, dataStyle]}>
            {/* Weather pill */}
            <View style={styles.livePill}>
              <Text style={styles.livePillText}>
                {edition.weather.temperatureF}° · {edition.weather.condition}
              </Text>
            </View>

            {/* Score chip */}
            {hasScore && topScore ? (
              <View style={[styles.livePill, styles.livePillScore]}>
                <View style={[styles.scoreDot, topScore.state === 'live' && styles.scoreDotLive]} />
                <Text style={styles.livePillText}>
                  {topScore.team} {topScore.teamScore}–{topScore.opponent} {topScore.opponentScore ?? ''}
                </Text>
              </View>
            ) : null}

            {/* Local story if distinct from the top story shown above */}
            {secondLead ? (
              <Text style={styles.localLead} numberOfLines={2}>{secondLead}</Text>
            ) : null}
          </Animated.View>
        ) : null}
      </View>

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
    alignItems: 'flex-start',
    paddingTop: spacing.sm,
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
  promptBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  prompt: {
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    letterSpacing: 0.5,
    color: 'rgba(240, 234, 214, 0.45)',
    textAlign: 'center',
  },
  storyPrompt: {
    maxWidth: 260,
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    color: 'rgba(240, 234, 214, 0.68)',
    lineHeight: 20,
    textAlign: 'center',
  },
  liveStrip: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(8, 18, 34, 0.62)',
    borderWidth: 1,
    borderColor: colors.wake.surfaceBorder,
  },
  livePillScore: {
    backgroundColor: 'rgba(8, 18, 34, 0.44)',
  },
  livePillText: {
    fontFamily: font.sans,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(240, 234, 214, 0.72)',
    letterSpacing: 0.1,
  },
  scoreDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(240, 234, 214, 0.28)',
  },
  scoreDotLive: {
    backgroundColor: '#F5C97A',
  },
  localLead: {
    maxWidth: 264,
    fontFamily: font.sans,
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(240, 234, 214, 0.48)',
    lineHeight: 18,
    textAlign: 'center',
  },
  bottom: {
    paddingBottom: spacing.md,
  },
})
