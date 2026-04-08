import React, { useEffect, useState } from 'react'
import { Text, StyleSheet, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import { type, colors, spacing } from '../constants/theme'

interface TimeDisplayProps {
  /** Color of the main clock text */
  textColor?: string
  /** Color of the date line below */
  dateColor?: string
  /** Show a soft ambient glow ring behind the time */
  showGlow?: boolean
  glowColor?: string
  /** Animate in on mount */
  animateIn?: boolean
}

function formatTime(date: Date): string {
  const h = date.getHours() % 12 || 12
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

function formatAmPm(date: Date): string {
  return date.getHours() < 12 ? 'AM' : 'PM'
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * TimeDisplay — the hero element of the wake screen.
 *
 * Shows a live clock (updates every second) with an optional glow ring.
 * The glow ring pulses slowly to signal the app is alive.
 * Fades up on mount.
 */
export function TimeDisplay({
  textColor = colors.wake.clockText,
  dateColor = colors.wake.dateText,
  showGlow = true,
  glowColor = colors.wake.glowColor,
  animateIn = true,
}: TimeDisplayProps) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Mount animation
  const opacity = useSharedValue(animateIn ? 0 : 1)
  const translateY = useSharedValue(animateIn ? 16 : 0)

  // Glow ring pulse
  const glowScale = useSharedValue(1)
  const glowOpacity = useSharedValue(0.15)

  useEffect(() => {
    if (animateIn) {
      opacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
      translateY.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) })
    }

    if (showGlow) {
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.22, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.1, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    }
  }, [animateIn, showGlow, opacity, translateY, glowScale, glowOpacity])

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  const glowRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }))

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {showGlow && (
        <Animated.View
          style={[styles.glowRing, { backgroundColor: glowColor }, glowRingStyle]}
        />
      )}

      {/* AM/PM + time row */}
      <View style={styles.timeRow}>
        <Text style={[styles.ampm, { color: dateColor }]}>{formatAmPm(now)}</Text>
        <Text style={[styles.clock, { color: textColor }]}>{formatTime(now)}</Text>
      </View>

      {/* Date below */}
      <Text style={[styles.date, { color: dateColor }]}>{formatDate(now)}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: '50%',
    left: '50%',
    marginTop: -140,
    marginLeft: -140,
    // Soft blur is approximated — a large semi-transparent circle with no hard edges
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  ampm: {
    fontSize: type.sublabelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    marginTop: 14, // align to top of clock numerals
    textTransform: 'uppercase',
  },
  clock: {
    fontSize: type.clockSize,
    fontWeight: type.clockWeight,
    letterSpacing: type.clockLetterSpacing,
    lineHeight: type.clockLineHeight,
    includeFontPadding: false,
  },
  date: {
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    letterSpacing: type.sublabelLetterSpacing,
    marginTop: spacing.sm,
  },
})
