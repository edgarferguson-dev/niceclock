import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import { colors, type, spacing, palette, font } from '../constants/theme'

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  tone?: 'dark' | 'paper'
  size?: 'hero' | 'compact'
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
  size,
}: {
  value: string
  onUp: () => void
  onDown: () => void
  tone: 'dark' | 'paper'
  size: 'hero' | 'compact'
}) {
  const chevronColor = tone === 'paper' ? 'rgba(90, 80, 72, 0.5)' : 'rgba(240, 234, 214, 0.35)'
  const pressedColor = tone === 'paper' ? 'rgba(200, 121, 58, 0.08)' : 'rgba(240, 234, 214, 0.07)'
  const digitColor = tone === 'paper' ? colors.edition.headline : colors.wake.clockText
  const digitSize = size === 'compact' ? 52 : 76

  return (
    <View style={styles.column}>
      <Pressable
        onPress={onUp}
        style={({ pressed }) => [styles.chevron, pressed && { backgroundColor: pressedColor }]}
        hitSlop={12}
      >
        <Text style={[styles.chevronText, { color: chevronColor }]}>+</Text>
      </Pressable>

      <Text style={[styles.digit, { color: digitColor, fontSize: digitSize, lineHeight: digitSize + 4, minWidth: digitSize + 8 }]}>{value}</Text>

      <Pressable
        onPress={onDown}
        style={({ pressed }) => [styles.chevron, pressed && { backgroundColor: pressedColor }]}
        hitSlop={12}
      >
        <Text style={[styles.chevronText, { color: chevronColor }]}>-</Text>
      </Pressable>
    </View>
  )
}

function AmPmToggle({
  value,
  onToggle,
  tone,
  size: _size,
}: {
  value: 'AM' | 'PM'
  onToggle: () => void
  tone: 'dark' | 'paper'
  size: 'hero' | 'compact'
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

export function TimePicker({ value, onChange, tone = 'dark', size = 'hero' }: TimePickerProps) {
  const { hour, minutes, ampm } = parse(value)
  const separatorColor = tone === 'paper' ? 'rgba(90, 80, 72, 0.3)' : 'rgba(240, 234, 214, 0.2)'
  const digitSize = size === 'compact' ? 52 : 76

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
        size={size}
      />

      <Text style={[styles.separator, { color: separatorColor, fontSize: digitSize * 0.5, lineHeight: digitSize, marginBottom: size === 'compact' ? spacing.md : spacing.lg }]}>:</Text>

      <Column
        value={String(minutes).padStart(2, '0')}
        onUp={() => adjustMinutes(1)}
        onDown={() => adjustMinutes(-1)}
        tone={tone}
        size={size}
      />

      <AmPmToggle value={ampm} onToggle={toggleAmPm} tone={tone} size={size} />
    </View>
  )
}

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
    fontFamily: font.sans,
    fontSize: 18,
    fontWeight: '300',
    lineHeight: 22,
  },
  digit: {
    fontFamily: font.editorial,
    fontWeight: type.clockWeight,
    letterSpacing: type.clockLetterSpacing,
    includeFontPadding: false,
    textAlign: 'center',
  },
  separator: {
    fontFamily: font.editorial,
    fontWeight: '200',
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
    fontFamily: font.sans,
    textTransform: 'uppercase',
  },
  ampmActive: {
    color: palette.amber400,
  },
})
