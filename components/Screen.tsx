import React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { spacing } from '../constants/theme'

interface ScreenProps {
  children: React.ReactNode
  gradient?: readonly [string, string, ...string[]]
  gradientLocations?: readonly [number, number, ...number[]]
  solidBg?: string
  style?: ViewStyle
  /** Skip horizontal padding — for full-bleed screens */
  noPadding?: boolean
}

/**
 * Screen — base container for all NiceClock screens.
 *
 * Handles:
 * - Safe area insets (top & bottom)
 * - Optional gradient background
 * - Optional solid background
 * - Consistent screen-level padding
 *
 * All screens use this as their root. Nothing else touches safe areas.
 */
export function Screen({
  children,
  gradient,
  gradientLocations,
  solidBg,
  style,
  noPadding = false,
}: ScreenProps) {
  const insets = useSafeAreaInsets()

  const containerStyle: ViewStyle = {
    paddingTop: insets.top + spacing.screenTop,
    paddingBottom: insets.bottom + spacing.md,
    paddingHorizontal: noPadding ? 0 : spacing.screenH,
  }

  if (gradient) {
    return (
      <LinearGradient
        colors={gradient}
        locations={gradientLocations}
        style={[styles.fill, containerStyle, style]}
      >
        {children}
      </LinearGradient>
    )
  }

  return (
    <View style={[styles.fill, { backgroundColor: solidBg ?? '#050D1A' }, containerStyle, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
})
