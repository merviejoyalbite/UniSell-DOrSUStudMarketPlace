import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { layout, useBreakpoint } from '../theme';

interface ResponsiveContainerProps {
  children: ReactNode;
  /** Widest the content may grow. Defaults to the marketplace content width. */
  maxWidth?: number;
  /** Apply the breakpoint-aware horizontal page padding. */
  padded?: boolean;
  /** Let the container fill the available height (non-scrolling screens). */
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Centres page content and caps its width on laptop/desktop windows.
 *
 * On a phone it simply adds the standard 16px page padding. On a wide monitor
 * the content stops at `maxContentWidth` (1200px) instead of stretching the
 * phone layout across the window.
 */
export function ResponsiveContainer({
  children,
  maxWidth = layout.maxContentWidth,
  padded = true,
  fill = false,
  style,
}: ResponsiveContainerProps) {
  const { pagePadding } = useBreakpoint();

  return (
    <View
      style={[
        styles.outer,
        padded && { paddingHorizontal: pagePadding },
        fill && styles.fill,
        style,
      ]}
    >
      <View style={[styles.inner, fill && styles.fill, { maxWidth }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
  },
  fill: {
    flex: 1,
  },
});
