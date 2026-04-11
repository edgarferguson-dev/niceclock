import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import { colors, type, spacing, palette } from '../constants/theme'

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  tone?: 'dark' | 'paper'
}

function parse(value: string): { hour: number; minutes: number; ampm: 'AM' | 'PM' } {
  const [hStr, mStr] = value.split(':')
  const h24 = parseInt(hStr, 10)
  const minutes = parseInt(mStr, 10)
  const ampm: 'AM' | 'PM' = h24 < 12 ? 'AM' : 'PM'
  const hour = h24 % 12 || 12
  return { hour, minutes, ampm }
}

function format(hour: number, minutes: number, ampm: 'AM' | 'PM'): string {
  let h24: number
  if (ampm === 'AM') h24 = hour === 12 ? 0 : hour
  else h24 = hour === 12 ? 12 : hour + 12
  return `${String(h24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function Column({
  value,
  onUp,
  onDown,
  tone,
}: {
  value: string
  onUp: () => void
  onDown: () => void
  tone: 'dark' | 'paper'
}) {
  const chevronColor = tone === 'paper' ? 'rgba(90, 80, 72, 0.5)' : 'rgba(240, 234, 214, 0.35)'
  const pressedColor = tone === 'paper' ? 'rgba(200, 121, 58, 0.08)' : 'rgba(240, 234, 214, 0.07)'
  const digitColor = tone === 'paper' ? colors.edition.headline : colors.wake.clockText

  return (
    <View style={styles.column}>
      <Pressable
        onPress={onUp}
        style={({ pressed }) => [styles.chevron, pressed && { backgroundColor: pressedColor }]}
        hitSlop={12}
      >
        <Text style={[styles.chevronText, { color: chevronColor }]}>?</Text>
      </Pressable>

      <Text style={[styles.digit, { color: digitColor }]}>{value}</Text>

      <Pressable
        onPress={onDown}
        style={({ pressed }) => [styles.chevron, pressed && { backgroundColor: pressedColor }]}
        hitSlop={12}
      >
        <Text style={[styles.chevronText, { color: chevronColor }]}>?</Text>
      </Pressable>
    </View>
  )
}

function AmPmToggle({
  value,
  onToggle,
  tone,
}: {
  value: 'AM' | 'PM'
  onToggle: () => void
  tone: 'dark' | 'paper'
}) {
  const optionColor = tone === 'paper' ? 'rgba(90, 80, 72, 0.45)' : 'rgba(240, 234, 214, 0.2)'

  return (
    <Pressable
      onPress={onToggle}
      style={styles.ampmContainer}
      hitSlop={8}
    >
      <Text style={[styles.ampmOption, { color: optionColor }, value === 'AM' && styles.ampmActive]}>AM</Text>
      <Text style={[styles.ampmOption, { color: optionColor }, value === 'PM' && styles.ampmActive]}>PM</Text>
    </Pressable>
  )
}

export function TimePicker({ value, onChange, tone = 'dark' }: TimePickerProps) {
  const { hour, minutes, ampm } = parse(value)
  const separatorColor = tone === 'paper' ? 'rgba(90, 80, 72, 0.3)' : 'rgba(240, 234, 214, 0.2)'

  const adjustHour = (delta: number) => {
    Haptics.selectionAsync()
    const next = ((hour - 1 + delta + 12) % 12) + 1
    onChange(format(next, minutes, ampm))
  }

  const adjustMinutes = (delta: number) => {
    Haptics.selectionAsync()
    const next = ((minutes + delta * 5) + 60) % 60
    onChange(format(hour, next, ampm))
  }

  const toggleAmPm = () => {
    Haptics.selectionAsync()
    onChange(format(hour, minutes, ampm === 'AM' ? 'PM' : 'AM'))
  }

  return (
    <View style={styles.container}>
      <Column
        value={String(hour).padStart(2, '0')}
        onUp={() => adjustHour(1)}
        onDown={() => adjustHour(-1)}
        tone={tone}
      />

      <Text style={[styles.separator, { color: separatorColor }]}>:</Text>

      <Column
        value={String(minutes).padStart(2, '0')}
        onUp={() => adjustMinutes(1)}
        onDown={() => adjustMinutes(-1)}
        tone={tone}
      />

      <AmPmToggle value={ampm} onToggle={toggleAmPm} tone={tone} />
    </View>
  )
}

const DIGIT_SIZE = 76

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  column: {
    alignItems: 'center',
    gap: spacing.md,
  },
  chevron: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  chevronText: {
    fontSize: 18,
    fontWeight: '300',
    lineHeight: 22,
  },
  digit: {
    fontSize: DIGIT_SIZE,
    fontWeight: type.clockWeight,
    letterSpacing: type.clockLetterSpacing,
    lineHeight: DIGIT_SIZE + 4,
    includeFontPadding: false,
    minWidth: DIGIT_SIZE + 8,
    textAlign: 'center',
  },
  separator: {
    fontSize: DIGIT_SIZE * 0.5,
    fontWeight: '200',
    lineHeight: DIGIT_SIZE,
    marginBottom: spacing.lg,
  },
  ampmContainer: {
    marginLeft: spacing.sm,
    gap: spacing.md,
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  ampmOption: {
    fontSize: type.labelSize,
    fontWeight: type.labelWeight,
    letterSpacing: type.labelLetterSpacing,
    textTransform: 'uppercase',
  },
  ampmActive: {
    color: palette.amber400,
  },
})
