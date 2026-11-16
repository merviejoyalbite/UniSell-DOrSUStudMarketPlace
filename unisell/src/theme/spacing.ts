/**
 * Spacing and corner-radius scale.
 *
 * Using one shared scale keeps margins and padding consistent across screens.
 * The numbers follow a simple 4-point grid and include the Figma 40px step.
 * Radii follow the Figma component measurements: 12 / 18 / 22 cards,
 * 28 large, 42 panels, 25 floating navigation and pill controls.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 22,
  xl: 28,
  panel: 42,
  nav: 25,
  pill: 999,
} as const;

/** Shared horizontal page padding used by most screens. */
export const pagePadding = spacing.lg;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radii;
