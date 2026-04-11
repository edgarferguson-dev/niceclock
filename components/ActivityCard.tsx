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
import { colors, palette, radius, shadows, spacing, type } from '../constants/theme'
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
    backgroundColor: 'rgba(14, 29, 53, 0.86)',
    borderColor: 'rgba(245, 201, 122, 0.48)',
    labelColor: palette.amber400,
    titleColor: colors.wake.clockText,
    detailColor: 'rgba(240, 234, 214, 0.7)',
    timeColor: 'rgba(245, 201, 122, 0.9)',
  },
  upcoming: {
    backgroundColor: 'rgba(9, 20, 38, 0.72)',
    borderColor: 'rgba(240, 234, 214, 0.08)',
    labelColor: 'rgba(240, 234, 214, 0.34)',
    titleColor: 'rgba(240, 234, 214, 0.92)',
    detailColor: 'rgba(240, 234, 214, 0.52)',
    timeColor: 'rgba(139, 156, 176, 0.95)',
  },
  past: {
    backgroundColor: 'rgba(8, 15, 29, 0.4)',
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
    ...shadows.cardRaised,
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
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    textTransform: 'uppercase',
  },
  timeRange: {
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
  },
  title: {
    fontSize: type.cardValueSize,
    fontWeight: type.cardValueWeight,
    letterSpacing: type.cardValueLetterSpacing,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  detail: {
    flex: 1,
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
