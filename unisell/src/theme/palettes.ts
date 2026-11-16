import type { Category } from '../types';

/**
 * Semantic colour palettes.
 *
 * Every screen and component reads colours from the active palette through
 * `useTheme()`. No component should hard-code a hex value: if a colour is
 * missing here, add a semantic token instead.
 *
 * Light values follow the Figma Make "Marketplace" frame: teal `#1F7A72`,
 * orange `#F4A261`, glass surfaces and a mint-to-blue page wash. Dark values
 * follow the proposed "Marketplace/Dark" frame: deep navy `#0B1030`, lighter
 * navy cards and a mint active state.
 *
 * Text pairs were checked against WCAG AA (4.5:1 for body copy, 3:1 for large
 * text and UI edges). Figma's own Accessibility page marks white on `#2E9E5B`
 * (3.41:1) and white on `#D64545` (4.38:1) as large-text-only, so the AA-safe
 * success/danger pairs are kept for buttons and body text.
 */

export interface CategoryPalette {
  /** Strong colour for the icon, label and category tint. */
  color: string;
  /** Soft tint for unselected surfaces and image placeholders. */
  tint: string;
  /** Text/icon colour that sits on `color` (AA checked). */
  onColor: string;
}

export interface ThemeColors {
  // Brand
  primary: string;
  primaryDark: string;
  primaryLight: string;
  onPrimary: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  onAccent: string;

  // Surfaces
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  inputBackground: string;
  border: string;
  borderStrong: string;
  /** Hairline used around glass cards and the floating navigation bar. */
  cardBorder: string;
  inputBorder: string;
  chipBorder: string;

  // Text
  text: string;
  textMuted: string;
  placeholder: string;
  /** Form labels and secondary headings. */
  label: string;

  // Feedback
  success: string;
  successStrong: string;
  successSoft: string;
  onSuccess: string;
  warning: string;
  warningStrong: string;
  warningSoft: string;
  onWarning: string;
  danger: string;
  dangerStrong: string;
  dangerSoft: string;
  onDanger: string;

  // Listing status
  statusAvailable: string;
  statusAvailableSoft: string;
  statusReserved: string;
  statusReservedSoft: string;
  statusSold: string;
  statusSoldSoft: string;

  // Favourites
  favorite: string;
  favoriteSoft: string;

  // Marketplace identity
  /** Blue verified check next to a student's name. */
  verified: string;
  /** Green presence dot in Messages. */
  online: string;
  /** Blue unread dot in Messages and on the notification bell. */
  unread: string;
  /** Amber used for star ratings and the reserved accent. */
  rating: string;
  /** Blue-tinted category tag in listing details. */
  categoryTag: string;
  /** Text and icon on `categoryTag`. */
  categoryTagText: string;

  // Utility surfaces
  overlay: string;
  scrim: string;
  shadow: string;
  shadowStrong: string;
  focusRing: string;
  skeleton: string;
  skeletonHighlight: string;
  chip: string;
  chipActive: string;
  chipText: string;
  chipTextActive: string;
  /** Track and active thumb of the compact form segmented control. */
  segmentedTrack: string;
  segmentedThumb: string;
  tabBar: string;
  tabBarBorder: string;
  /** Floating bottom navigation surface and border. */
  navBackground: string;
  navBorder: string;
  photoOverlay: string;
  disabledBackground: string;
  disabledText: string;
  disabledBorder: string;
  /** Translucent sheen painted over filled buttons on hover (web). */
  hoverSheen: string;
  /** Translucent shade painted over filled buttons while pressed. */
  pressedSheen: string;

  // Category identity
  categories: Record<Category, CategoryPalette>;

  // Absolutes (logos and photo overlays stay unchanged)
  white: string;
  black: string;

  /** Backwards-compatible alias used by older components. */
  textOnPrimary: string;
}

export interface ThemeGradients {
  primary: readonly [string, string];
  accent: readonly [string, string];
  success: readonly [string, string];
  warning: readonly [string, string];
  danger: readonly [string, string];
  /** Three-stop page wash behind every screen. */
  page: readonly [string, string, string];
}

const lightCategories: Record<Category, CategoryPalette> = {
  Textbooks: { color: '#2F5F9F', tint: '#E8F0FB', onColor: '#FFFFFF' },
  Uniforms: { color: '#8A4E1C', tint: '#FDF0E4', onColor: '#FFFFFF' },
  Gadgets: { color: '#1F7A72', tint: '#E4F2EE', onColor: '#FFFFFF' },
  'Dorm Items': { color: '#6E4BB5', tint: '#F1ECFB', onColor: '#FFFFFF' },
  Food: { color: '#A33A3A', tint: '#FBEAEA', onColor: '#FFFFFF' },
  Others: { color: '#5F6F75', tint: '#EEF2F2', onColor: '#FFFFFF' },
};

const darkCategories: Record<Category, CategoryPalette> = {
  Textbooks: { color: '#9CC2F5', tint: '#16283D', onColor: '#0B1B2C' },
  Uniforms: { color: '#E7B27E', tint: '#332417', onColor: '#241405' },
  Gadgets: { color: '#7FD6C4', tint: '#12332E', onColor: '#04231E' },
  'Dorm Items': { color: '#C4ACF7', tint: '#241C36', onColor: '#150C26' },
  Food: { color: '#F2A0A0', tint: '#331A1A', onColor: '#240D0D' },
  Others: { color: '#C2D0CC', tint: '#1C2B28', onColor: '#0C1715' },
};

export const lightColors: ThemeColors = {
  primary: '#1F7A72',
  primaryDark: '#165F5A',
  primaryLight: 'rgba(31, 122, 114, 0.12)',
  onPrimary: '#FFFFFF',
  accent: '#F4A261',
  accentStrong: '#D97A2B',
  accentSoft: 'rgba(244, 162, 97, 0.18)',
  onAccent: '#231607',

  background: '#EAF6F6',
  surface: 'rgba(255, 255, 255, 0.68)',
  surfaceElevated: 'rgba(255, 255, 255, 0.82)',
  surfaceMuted: 'rgba(255, 255, 255, 0.46)',
  inputBackground: 'rgba(255, 255, 255, 0.76)',
  border: 'rgba(31, 122, 114, 0.13)',
  borderStrong: 'rgba(31, 122, 114, 0.26)',
  cardBorder: 'rgba(255, 255, 255, 0.8)',
  inputBorder: 'rgba(85, 125, 145, 0.2)',
  chipBorder: 'rgba(31, 122, 114, 0.13)',

  text: '#1F3A4D',
  textMuted: '#4F6878',
  placeholder: '#5E7482',
  label: '#324E60',

  success: '#1F7A50',
  successStrong: '#176B45',
  successSoft: '#E4F4EC',
  onSuccess: '#FFFFFF',
  warning: '#8A520E',
  warningStrong: '#7A4708',
  warningSoft: '#FDF0E0',
  onWarning: '#FFFFFF',
  danger: '#B3261E',
  dangerStrong: '#9E1B14',
  dangerSoft: '#FBEAEA',
  onDanger: '#FFFFFF',

  statusAvailable: '#1F7A50',
  statusAvailableSoft: '#E4F4EC',
  statusReserved: '#1F3A4D',
  statusReservedSoft: 'rgba(244, 162, 97, 0.24)',
  statusSold: '#5F6F75',
  statusSoldSoft: 'rgba(255, 255, 255, 0.55)',

  favorite: '#D6355B',
  favoriteSoft: 'rgba(214, 53, 91, 0.12)',

  verified: '#356E9F',
  online: '#2E9E5B',
  unread: '#4A90D9',
  rating: '#8A520E',
  categoryTag: 'rgba(74, 144, 217, 0.12)',
  categoryTagText: '#396070',

  overlay: 'rgba(15, 35, 48, 0.45)',
  scrim: 'rgba(11, 16, 48, 0.55)',
  shadow: '#1F5263',
  shadowStrong: '#143C4A',
  focusRing: '#1F7A72',
  skeleton: 'rgba(31, 122, 114, 0.08)',
  skeletonHighlight: 'rgba(255, 255, 255, 0.6)',
  chip: 'rgba(255, 255, 255, 0.52)',
  chipActive: '#1F7A72',
  chipText: '#46606F',
  chipTextActive: '#FFFFFF',
  segmentedTrack: 'rgba(79, 104, 120, 0.09)',
  segmentedThumb: '#FFFFFF',
  tabBar: 'rgba(250, 253, 253, 0.9)',
  tabBarBorder: 'rgba(255, 255, 255, 0.85)',
  navBackground: 'rgba(250, 253, 253, 0.9)',
  navBorder: 'rgba(255, 255, 255, 0.85)',
  photoOverlay: 'rgba(11, 16, 48, 0.35)',
  disabledBackground: 'rgba(255, 255, 255, 0.4)',
  disabledText: '#6F8084',
  disabledBorder: 'rgba(31, 122, 114, 0.12)',
  hoverSheen: 'rgba(255, 255, 255, 0.18)',
  pressedSheen: 'rgba(0, 0, 0, 0.14)',

  categories: lightCategories,

  white: '#FFFFFF',
  black: '#000000',
  textOnPrimary: '#FFFFFF',
};

export const darkColors: ThemeColors = {
  primary: '#7FD6C4',
  primaryDark: '#4FA99A',
  primaryLight: 'rgba(127, 214, 196, 0.12)',
  onPrimary: '#0B1030',
  accent: '#F4A261',
  accentStrong: '#D97A2B',
  accentSoft: 'rgba(244, 162, 97, 0.16)',
  onAccent: '#1F1305',

  background: '#0B1030',
  surface: '#141B45',
  surfaceElevated: '#1A2250',
  surfaceMuted: '#11183C',
  inputBackground: '#1A2250',
  border: '#2A3470',
  borderStrong: '#3A468C',
  cardBorder: '#2A3470',
  inputBorder: '#2A3470',
  chipBorder: '#2A3470',

  text: '#FFFFFF',
  textMuted: '#A9B1D6',
  placeholder: '#8B94C4',
  label: '#C9D0EE',

  success: '#6FD3A8',
  successStrong: '#0C5F3E',
  successSoft: 'rgba(46, 158, 91, 0.16)',
  onSuccess: '#0B1030',
  warning: '#F0B45E',
  warningStrong: '#8A520E',
  warningSoft: 'rgba(240, 180, 94, 0.14)',
  onWarning: '#1F1305',
  danger: '#FF8A80',
  dangerStrong: '#9E1B14',
  dangerSoft: 'rgba(255, 138, 128, 0.14)',
  onDanger: '#2A0A08',

  statusAvailable: '#6FD3A8',
  statusAvailableSoft: 'rgba(46, 158, 91, 0.16)',
  statusReserved: '#F4A261',
  statusReservedSoft: 'rgba(244, 162, 97, 0.18)',
  statusSold: '#A9B1D6',
  statusSoldSoft: 'rgba(169, 177, 214, 0.14)',

  favorite: '#FF8AA8',
  favoriteSoft: 'rgba(255, 138, 168, 0.16)',

  verified: '#7FB6E8',
  online: '#6FD3A8',
  unread: '#6FA8F0',
  rating: '#F4A261',
  categoryTag: 'rgba(111, 168, 240, 0.14)',
  categoryTagText: '#A9C8EC',

  overlay: 'rgba(3, 6, 24, 0.65)',
  scrim: 'rgba(3, 6, 24, 0.8)',
  shadow: '#030618',
  shadowStrong: '#030618',
  focusRing: '#7FD6C4',
  skeleton: '#1A2250',
  skeletonHighlight: '#232C63',
  chip: '#141B45',
  chipActive: '#7FD6C4',
  chipText: '#A9B1D6',
  chipTextActive: '#0B1030',
  segmentedTrack: '#1A2250',
  segmentedThumb: '#2A3470',
  tabBar: 'rgba(20, 27, 69, 0.94)',
  tabBarBorder: '#2A3470',
  navBackground: 'rgba(20, 27, 69, 0.94)',
  navBorder: '#2A3470',
  photoOverlay: 'rgba(3, 6, 24, 0.45)',
  disabledBackground: '#1A2250',
  disabledText: '#6F79A8',
  disabledBorder: '#2A3470',
  hoverSheen: 'rgba(255, 255, 255, 0.08)',
  pressedSheen: 'rgba(0, 0, 0, 0.24)',

  categories: darkCategories,

  white: '#FFFFFF',
  black: '#000000',
  textOnPrimary: '#0B1030',
};

export const lightGradients: ThemeGradients = {
  primary: ['#1F7A72', '#286F83'],
  accent: ['#F4A261', '#E08A3C'],
  success: ['#1F7A50', '#176B45'],
  warning: ['#8A520E', '#7A4708'],
  danger: ['#B3261E', '#9E1B14'],
  page: ['#EAF6F6', '#E4F3F4', '#DCEBFA'],
};

export const darkGradients: ThemeGradients = {
  primary: ['#7FD6C4', '#5AB8A8'],
  accent: ['#F4A261', '#E08A3C'],
  success: ['#6FD3A8', '#4FBF92'],
  warning: ['#F0B45E', '#E09A3A'],
  danger: ['#FF8A80', '#E96B60'],
  page: ['#0B1030', '#0C1236', '#0B1030'],
};
