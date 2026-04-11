import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { productCopy } from '../constants/product'
import { palette, spacing, type } from '../constants/theme'

interface ProductMarkProps {
  tone?: 'light' | 'warm' | 'danger'
}

const TONES = {
  light: {
    heading: 'rgba(240, 234, 214, 0.74)',
    subheading: 'rgba(240, 234, 214, 0.34)',
  },
  warm: {
    heading: palette.textDark,
    subheading: 'rgba(90, 80, 72, 0.6)',
  },
  danger: {
    heading: '#F5D0C8',
    subheading: 'rgba(245, 208, 200, 0.42)',
  },
} as const

export function ProductMark({ tone = 'light' }: ProductMarkProps) {
  const colors = TONES[tone]

  return (
    <View style={styles.container}>
      <Text style={[styles.subheading, { color: colors.subheading }]}>
        {productCopy.subheading}
      </Text>
      <Text style={[styles.heading, { color: colors.heading }]}>
        {productCopy.heading}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  subheading: {
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: type.brandSize,
    fontWeight: type.brandWeight,
    letterSpacing: type.brandLetterSpacing,
    textTransform: 'uppercase',
  },
})
