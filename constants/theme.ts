import { Platform } from 'react-native'

/**
 * NiceClock Design System
 *
 * Three emotional phases, one visual thread.
 * Amber is the constant through wake, briefing, and escalation.
 *
 * Base unit: 8px
 * Horizontal screen padding: 28px
 * Safe area respected everywhere
 */

export const palette = {
  black: '#000000',
  trueBlack: '#030608',
  navy900: '#050D1A',
  navy800: '#0A1628',
  navy700: '#0F2040',
  navy600: '#162D55',
  navy500: '#203A66',

  amber400: '#F5C97A',
  amber500: '#E8943A',
  amber600: '#C8793A',
  amber700: '#A85E20',
  amber800: '#70431A',

  red900: '#0F0505',
  red800: '#1A0808',
  red700: '#3D0A0A',
  red600: '#5C1212',
  red500: '#8B1A1A',
  red400: '#C0392B',
  red300: '#E74C3C',

  cream100: '#FAF7F2',
  cream200: '#F2EDE4',
  cream300: '#E8DFD0',
  cream400: '#DDD3C4',
  cream500: '#C9BCA8',

  textCream: '#F0EAD6',
  textMuted: '#8B9CB0',
  textSubtle: '#4A5568',
  textDark: '#1A1410',
  textMedium: '#5A5048',
} as const

export const colors = {
  edition: {
    bg: '#F6F1E8',
    paper: '#FBF7F0',
    panelBg: 'rgba(255, 252, 247, 0.84)',
    panelStrong: '#F8F0E2',
    panelBorder: 'rgba(120, 91, 58, 0.16)',
    headline: palette.textDark,
    body: palette.textMedium,
    muted: palette.textSubtle,
    accent: palette.amber600,
    accentSoft: 'rgba(200, 121, 58, 0.1)',
    hairline: 'rgba(120, 91, 58, 0.12)',
    shadow: 'rgba(31, 22, 14, 0.08)',
    washTop: 'rgba(255, 248, 239, 0.92)',
    washBottom: 'rgba(229, 216, 198, 0.42)',
  },
  wake: {
    gradientColors: ['#07111E', '#10233F', '#19345A'] as const,
    gradientLocations: [0, 0.46, 1] as const,
    clockText: palette.textCream,
    dateText: palette.textMuted,
    glowColor: palette.amber400,
    glowBg: 'rgba(232, 148, 58, 0.08)',
    ctaBg: palette.amber500,
    ctaText: palette.navy900,
    ctaGlow: 'rgba(232, 148, 58, 0.35)',
    brandText: palette.textMuted,
    divider: 'rgba(240, 234, 214, 0.1)',
    surfaceBg: 'rgba(8, 18, 34, 0.72)',
    surfaceStrong: 'rgba(8, 19, 35, 0.94)',
    surfaceBorder: 'rgba(240, 234, 214, 0.09)',
    surfaceMuted: 'rgba(240, 234, 214, 0.48)',
    surfaceSubtle: 'rgba(240, 234, 214, 0.24)',
    overlayTop: 'rgba(245, 201, 122, 0.08)',
    overlayBottom: 'rgba(8, 17, 30, 0.0)',
    panelWarm: 'rgba(17, 28, 45, 0.84)',
    panelCool: 'rgba(9, 17, 31, 0.88)',
  },
  escalation: {
    gradientColors: [palette.red900, palette.red800, palette.red700] as const,
    gradientLocations: [0, 0.4, 1] as const,
    headlineText: '#F5D0C8',
    subText: 'rgba(245, 208, 200, 0.6)',
    counterText: '#FFFFFF',
    ctaBg: palette.red400,
    ctaText: '#FFFFFF',
    ctaGlow: 'rgba(192, 57, 43, 0.4)',
    pulse: palette.red300,
  },
  briefing: {
    bg: palette.cream100,
    cardBg: '#FFFFFF',
    cardBorder: palette.cream300,
    cardShadow: 'rgba(26, 20, 16, 0.06)',
    accent: palette.amber600,
    accentLight: 'rgba(200, 121, 58, 0.12)',
    textPrimary: palette.textDark,
    textSecondary: palette.textMedium,
    textLabel: palette.textSubtle,
    divider: palette.cream300,
    ctaBg: 'transparent',
    ctaBorder: palette.cream300,
    ctaText: palette.textMedium,
  },
} as const

export const font = {
  sans: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
  editorial: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
} as const

export const type = {
  clockSize: 92,
  clockWeight: '200' as const,
  clockLetterSpacing: -4,
  clockLineHeight: 96,

  displaySize: 64,
  displayWeight: '300' as const,
  displayLetterSpacing: -2,

  headlineSize: 28,
  headlineLargeSize: 34,
  heroSize: 46,
  headlineWeight: '600' as const,
  headlineLetterSpacing: -0.5,
  heroLetterSpacing: -1.3,

  cardValueSize: 22,
  cardValueWeight: '600' as const,
  cardValueLetterSpacing: -0.3,

  editorialSize: 32,
  editorialWeight: '600' as const,
  editorialLetterSpacing: -0.8,

  labelSize: 11,
  labelWeight: '600' as const,
  labelLetterSpacing: 1.8,

  sublabelSize: 13,
  sublabelWeight: '500' as const,
  sublabelLetterSpacing: 0.1,

  bodySize: 16,
  bodyWeight: '400' as const,

  ctaSize: 17,
  ctaWeight: '600' as const,
  ctaLetterSpacing: 0.2,

  brandSize: 12,
  brandWeight: '500' as const,
  brandLetterSpacing: 3,
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  screenH: 28,
  screenTop: 16,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 100,
  circle: 9999,
} as const

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  cardRaised: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  cardLuxury: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 12,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 0,
  }),
  ctaGlow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  }),
} as const

export const duration = {
  instant: 0,
  fast: 200,
  normal: 350,
  slow: 500,
  verySlow: 800,

  pulse: 2000,
  breathe: 3000,
} as const
