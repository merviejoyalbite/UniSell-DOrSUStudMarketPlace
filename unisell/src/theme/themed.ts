import { useMemo } from 'react';
import {
  StyleSheet,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme, type AppShadows } from '../context/ThemeContext';
import type { ThemeColors } from './palettes';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Build a themed stylesheet.
 *
 * Usage:
 *   const useStyles = createThemedStyles((colors, shadows) => ({
 *     card: { backgroundColor: colors.surface, ...shadows.card },
 *   }));
 *   ...
 *   const styles = useStyles();
 *
 * The factory runs again whenever the palette changes, so every style value
 * follows light/dark mode. Screens should not keep a module-level
 * `StyleSheet.create` block that references colours directly.
 */
export function createThemedStyles<T extends NamedStyles<T>>(
  factory: (colors: ThemeColors, shadows: AppShadows) => T,
) {
  return function useStyles(): T {
    const { colors, shadows } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors, shadows)), [colors, shadows]);
  };
}
