import React, { useEffect } from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { colors, type, spacing, radius, shadows } from '../constants/theme'

interface BriefingCardProps {
  label: string
  value: string
  subValue?: string
  icon?: string
  /** Stagger delay in ms — each card gets a slightly later delay */
  enterDelay?: number
  /** Highlight this card's value in accent color */
  accent?: boolean
  style?: ViewStyle
}

/**
 * BriefingCard — info card for the morning briefing screen.
 *
 * Stagger entrance: each card slides up and fades in, offset by `enterDelay`.
 * Labels are uppercase and small. Values are large and readable.
 */
export function BriefingCard({
  label,
  value,
  subValue,
  icon,
  enterDelay = 0,
  accent = false,
  style,
}: BriefingCardProps) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)

  useEffect(() => {
    opacity.value = withDelay(
      enterDelay,
      withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) })
    )
    translateY.value = withDelay(
      enterDelay,
      withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) })
    )
  }, [enterDelay, opacity, translateY])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View style={[styles.card, animatedStyle, style]}>
      <View style={styles.inner}>
        <View style={styles.labelRow}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={styles.label}>{label.toUpperCase()}</Text>
        </View>

        <Text
          style={[
            styles.value,
            accent && { color: colors.briefing.accent },
          ]}
        >
          {value}
        </Text>

        {subValue ? <Text style={styles.subValue}>{subValue}</Text> : null}
      </View>

      {/* Accent bar for highlighted cards */}
      {accent && <View style={styles.accentBar} />}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.briefing.cardBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.briefing.cardBorder,
    overflow: 'hidden',
    ...shadows.card,
  },
  inner: {
    padding: spacing.md,
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  icon: {
    fontSize: 13,
  },
  label: {
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    color: colors.briefing.textLabel,
  },
  value: {
    fontSize: type.cardValueSize,
    fontWeight: type.cardValueWeight,
    letterSpacing: type.cardValueLetterSpacing,
    color: colors.briefing.textPrimary,
  },
  subValue: {
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    color: colors.briefing.textSecondary,
    marginTop: 2,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.briefing.accent,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
})
