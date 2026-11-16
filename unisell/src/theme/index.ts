import { lightColors } from './palettes';
import { spacing, radii, pagePadding } from './spacing';
import { fonts, fontSizes, lineHeights } from './typography';

/**
 * Single entry point for design tokens and theme helpers.
 *
 * Screens should prefer `useTheme()` + `createThemedStyles()` so colours and
 * shadows follow the active light/dark palette. The static `colors` export is
 * kept as the light palette for code that genuinely needs a fixed colour
 * (brand logos, image overlays, navigation fallbacks).
 */
export const theme = {
  colors: lightColors,
  spacing,
  radii,
  fonts,
  fontSizes,
  lineHeights,
  pagePadding,
} as const;

/**
 * Light elevation presets kept for backwards compatibility. Themed code should
 * read `shadows` from `useTheme()` instead.
 */
export const shadows = {
  card: {
    shadowColor: lightColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  floating: {
    shadowColor: lightColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 6,
  },
  button: {
    shadowColor: lightColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

/** The original light palette, kept as `colors` for compatibility. */
export const colors = lightColors;

export { spacing, radii, pagePadding } from './spacing';
export { fonts, fontSizes, lineHeights } from './typography';
export { lightColors, darkColors, lightGradients, darkGradients } from './palettes';
export type { ThemeColors, ThemeGradients, CategoryPalette } from './palettes';
export { breakpoints, layout, getBreakpoint, useBreakpoint } from './layout';
export type { Breakpoint, ResponsiveInfo } from './layout';
export { createThemedStyles } from './themed';
export { useTheme } from '../context/ThemeContext';
export type { AppShadows, ResolvedScheme } from '../context/ThemeContext';
export type { ThemeMode } from '../utils/storage';
export type { AppColor } from './colors';
export type { SpacingToken, RadiusToken } from './spacing';
export type { FontToken } from './typography';
