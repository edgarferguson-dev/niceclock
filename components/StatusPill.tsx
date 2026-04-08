import React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { type, spacing, radius } from '../constants/theme'

interface StatusPillProps {
  label: string
  /** 'dot' shows a small animated dot, 'plain' is text only */
  variant?: 'dot' | 'plain'
  color?: string
  bgColor?: string
}

/**
 * StatusPill — lightweight status indicator.
 * Used on the wake screen to show alarm label / "Alarm active" context.
 */
export function StatusPill({
  label,
  variant = 'dot',
  color = 'rgba(240, 234, 214, 0.5)',
  bgColor = 'rgba(240, 234, 214, 0.07)',
}: StatusPillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: bgColor }]}>
      {variant === 'dot' && (
        <View style={[styles.dot, { backgroundColor: color }]} />
      )}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    textTransform: 'uppercase',
  },
})
