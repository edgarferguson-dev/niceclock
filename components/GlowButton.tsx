import React, { useEffect } from 'react'
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { type, radius, spacing, colors } from '../constants/theme'

interface GlowButtonProps {
  label: string
  onPress: () => void
  variant?: 'calm' | 'urgent' | 'ghost'
  style?: ViewStyle
  /** Disable the ambient pulse animation */
  noPulse?: boolean
}

const VARIANTS = {
  calm: {
    bg: colors.wake.ctaBg,
    text: colors.wake.ctaText,
    glow: colors.wake.ctaGlow,
    glowColor: colors.wake.ctaBg,
  },
  urgent: {
    bg: colors.escalation.ctaBg,
    text: colors.escalation.ctaText,
    glow: colors.escalation.ctaGlow,
    glowColor: colors.escalation.ctaBg,
  },
  ghost: {
    bg: 'transparent',
    text: colors.briefing.ctaText,
    glow: 'transparent',
    glowColor: 'transparent',
  },
} as const

/**
 * GlowButton — the primary CTA for NiceClock.
 *
 * Has a built-in ambient pulse animation that runs on loop.
 * Variant determines the color palette (calm=amber wake, urgent=red escalation, ghost=briefing).
 * Haptic feedback fires on press.
 */
export function GlowButton({
  label,
  onPress,
  variant = 'calm',
  style,
  noPulse = false,
}: GlowButtonProps) {
  const v = VARIANTS[variant]
  const scale = useSharedValue(1)
  const glowOpacity = useSharedValue(0.6)

  useEffect(() => {
    if (noPulse || variant === 'ghost') return

    const pulseDuration = variant === 'urgent' ? 1000 : 2000

    scale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: pulseDuration / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: pulseDuration / 2, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    )

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: pulseDuration / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.5, { duration: pulseDuration / 2, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    )
  }, [variant, noPulse, scale, glowOpacity])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }))

  const handlePress = () => {
    Haptics.impactAsync(
      variant === 'urgent'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Medium
    )
    onPress()
  }

  return (
    <Animated.View style={[styles.wrapper, animatedStyle, style]}>
      {/* Glow halo behind button */}
      {variant !== 'ghost' && (
        <Animated.View
          style={[
            styles.glowHalo,
            { backgroundColor: v.glowColor },
            glowStyle,
          ]}
        />
      )}
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: v.bg },
          variant === 'ghost' && styles.ghostBorder,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.label, { color: v.text }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  glowHalo: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    bottom: -8,
    borderRadius: radius.xl,
    // blur effect is approximated via opacity + spread — expo-blur for real blur later
  },
  button: {
    height: 58,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  ghostBorder: {
    borderWidth: 1,
    borderColor: colors.briefing.cardBorder,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: type.ctaSize,
    fontWeight: type.ctaWeight,
    letterSpacing: type.ctaLetterSpacing,
  },
})
