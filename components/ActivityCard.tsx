import React, { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { colors, font, palette, radius, shadows, spacing, type } from '../constants/theme'
import type { ActivityState, TimelineActivity } from '../lib/activityTimeline'
import { formatRange } from '../lib/activityTimeline'

interface ActivityCardProps {
  activity: TimelineActivity
  index: number
  onPress: () => void
}

const CARD_STYLES: Record<ActivityState, {
  backgroundColor: string
  borderColor: string
  labelColor: string
  titleColor: string
  detailColor: string
  timeColor: string
}> = {
  active: {
    backgroundColor: 'rgba(16, 31, 55, 0.9)',
    borderColor: 'rgba(245, 201, 122, 0.48)',
    labelColor: palette.amber400,
    titleColor: colors.wake.clockText,
    detailColor: 'rgba(240, 234, 214, 0.7)',
    timeColor: 'rgba(245, 201, 122, 0.9)',
  },
  upcoming: {
    backgroundColor: 'rgba(9, 20, 38, 0.78)',
    borderColor: 'rgba(240, 234, 214, 0.08)',
    labelColor: 'rgba(240, 234, 214, 0.34)',
    titleColor: 'rgba(240, 234, 214, 0.92)',
    detailColor: 'rgba(240, 234, 214, 0.52)',
    timeColor: 'rgba(139, 156, 176, 0.95)',
  },
  past: {
    backgroundColor: 'rgba(8, 15, 29, 0.48)',
    borderColor: 'rgba(240, 234, 214, 0.04)',
    labelColor: 'rgba(240, 234, 214, 0.2)',
    titleColor: 'rgba(240, 234, 214, 0.42)',
    detailColor: 'rgba(240, 234, 214, 0.24)',
    timeColor: 'rgba(139, 156, 176, 0.38)',
  },
}

const LABELS: Record<ActivityState, string> = {
  active: 'Now',
  upcoming: 'Ahead',
  past: 'Done',
}

export function ActivityCard({ activity, index, onPress }: ActivityCardProps) {
  const entryOpacity = useSharedValue(0)
  const entryY = useSharedValue(18)

  useEffect(() => {
    const delay = 140 + index * 90
    entryOpacity.value = withDelay(
      delay,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) })
    )
    entryY.value = withDelay(
      delay,
      withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) })
    )
  }, [entryOpacity, entryY, index])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: entryOpacity.value,
    transform: [{ translateY: entryY.value }],
  }))

  const cardColors = CARD_STYLES[activity.state]

  const handlePress = () => {
    Haptics.selectionAsync()
    onPress()
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: cardColors.backgroundColor,
            borderColor: cardColors.borderColor,
            opacity: pressed ? 0.9 : 1,
          },
          activity.state === 'active' && styles.activeCard,
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.label, { color: cardColors.labelColor }]}>{LABELS[activity.state]}</Text>
          <Text style={[styles.timeRange, { color: cardColors.timeColor }]}>
            {formatRange(activity.startTime, activity.endTime)}
          </Text>
        </View>

        <Text style={[styles.title, { color: cardColors.titleColor }]}>{activity.title}</Text>

        <View style={styles.footerRow}>
          <Text style={[styles.detail, { color: cardColors.detailColor }]} numberOfLines={2}>
            {activity.detail ?? activity.location ?? 'Tap to hear the next detail.'}
          </Text>
          {activity.state === 'active' ? <View style={styles.activeDot} /> : null}
        </View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.cardLuxury,
  },
  activeCard: {
    shadowColor: palette.amber500,
    shadowOpacity: 0.18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontFamily: font.sans,
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    textTransform: 'uppercase',
  },
  timeRange: {
    fontFamily: font.sans,
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
  },
  title: {
    fontFamily: font.editorial,
    fontSize: type.headlineSize,
    fontWeight: '600',
    letterSpacing: type.headlineLetterSpacing,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  detail: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    lineHeight: 20,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.amber400,
  },
})
