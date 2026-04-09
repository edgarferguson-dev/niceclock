import { View, Text, StyleSheet } from 'react-native'
import { Link } from 'expo-router'
import { palette, type, spacing } from '../constants/theme'

export default function NotFound() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>NICECLOCK</Text>
      <Text style={styles.message}>Screen not found.</Text>
      <Link href="/" style={styles.link}>Go home</Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.navy900,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screenH,
  },
  title: {
    fontSize: type.brandSize,
    fontWeight: type.brandWeight,
    letterSpacing: type.brandLetterSpacing,
    color: 'rgba(240, 234, 214, 0.3)',
    textTransform: 'uppercase',
    marginBottom: spacing.xl,
  },
  message: {
    fontSize: type.sublabelSize,
    fontWeight: type.sublabelWeight,
    color: 'rgba(240, 234, 214, 0.5)',
    marginBottom: spacing.lg,
  },
  link: {
    fontSize: type.sublabelSize,
    color: palette.amber500,
  },
})
