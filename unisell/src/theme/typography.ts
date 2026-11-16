/**
 * Typography tokens.
 *
 * Poppins is loaded once in App.tsx with expo-font. Screens should use these
 * font-family strings so the app matches the Figma design.
 *
 * Figma's scale is H1 28, H2 22, H3 18, body 16 and a 14px caption minimum.
 * `xs` and `sm` are both 14 so older components that used 11–13px copy are
 * raised to the accessible caption size. Micro counters can use
 * `fontSizes.xs - 1` when a badge must stay compact.
 */
export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

export const fontSizes = {
  xs: 14,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
} as const;

export const lineHeights = {
  xs: 20,
  sm: 20,
  md: 24,
  lg: 26,
  xl: 30,
  xxl: 36,
  display: 42,
} as const;

export type FontToken = keyof typeof fonts;
