import { Ionicons } from '@expo/vector-icons';
import {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  radii,
  spacing,
  useTheme,
} from '../theme';
import type { Category } from '../types';
import { ANIM_DURATION, ANIM_EASING, useReducedMotion } from '../lib/animations';
import { GlowPulse } from './motion';

interface FilterChipProps {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** When set, the selected state uses that category's identity colour. */
  category?: Category;
  /** Tighter 40px chip with a 4px hit slop (used by the Post meetup row). */
  compact?: boolean;
}

/**
 * Pill used for category and condition filters.
 *
 * Selected category chips take the category's own colour (textbooks blue,
 * gadgets teal, food red, ...) so the filter row reads as a colour key. Plain
 * filters fall back to the brand teal. Inactive chips use the themed surface.
 */
export function FilterChip({
  label,
  active = false,
  onPress,
  icon,
  category,
  compact = false,
}: FilterChipProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reduced = useReducedMotion();

  const [scale] = useState(new Animated.Value(active ? 1.05 : 1));

  useEffect(() => {
    if (reduced) {
      scale.setValue(active ? 1.05 : 1);
      return;
    }
    Animated.timing(scale, {
      toValue: active ? 1.05 : 1,
      duration: ANIM_DURATION.fast,
      easing: ANIM_EASING,
      useNativeDriver: true,
    }).start();
  }, [active, scale, reduced]);

  const categoryPalette = category ? colors.categories[category] : null;
  const activeBackground = colors.primary;
  const activeContent = colors.onPrimary;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: active }}
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        hitSlop={4}
        style={({ pressed }) => [
          styles.base,
          compact && styles.compact,
          active && { backgroundColor: activeBackground, borderColor: activeBackground },
          hovered && !active && styles.hovered,
          pressed && styles.pressed,
          focused && styles.focused,
        ]}
      >
      {hovered && active ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.hoverSheen }]}
        />
      ) : null}

      {active ? <GlowPulse color={activeBackground} size={44} active /> : null}

      {icon ? (
        <Ionicons
          name={icon}
          size={15}
          color={
            active
              ? activeContent
              : (categoryPalette?.color ?? colors.textMuted)
          }
        />
      ) : null}
      <Text style={[styles.label, active && { color: activeContent }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  base: {
    minHeight: 44,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.chip,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    overflow: 'hidden',
  },
  compact: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  hovered: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  focused: Platform.select({
    web: {
      boxShadow: `0 0 0 3px ${colors.focusRing}`,
    } as unknown as ViewStyle,
    default: {
      borderColor: colors.focusRing,
      borderWidth: 2,
    },
  }) as ViewStyle,
  label: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.chipText,
  },
}));
