import { Ionicons } from '@expo/vector-icons';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Platform,
  Pressable,
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
  type ThemeMode,
} from '../theme';
import { ANIM_DURATION, ANIM_EASING, useReducedMotion } from '../lib/animations';

const OPTIONS: {
  mode: ThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
];

interface ThemeSwitchProps {
  /** Hide the text labels (icon-only) when space is tight. */
  iconOnly?: boolean;
}

/**
 * Segmented System / Light / Dark control.
 *
 * Shown on the Profile screen and in the desktop sidebar. The choice is saved
 * immediately by the theme provider, so it survives a reload.
 */
export function ThemeSwitch({ iconOnly = false }: ThemeSwitchProps) {
  const { mode, setMode, colors } = useTheme();
  const styles = useStyles();
  const [focusedMode, setFocusedMode] = useState<ThemeMode | null>(null);
  const reduced = useReducedMotion();

  return (
    <View style={styles.container} accessibilityLabel="Colour theme">
      {OPTIONS.map((option) => {
        const selected = mode === option.mode;
        return (
          <Pressable
            key={option.mode}
            accessibilityRole="radio"
            accessibilityLabel={`${option.label} theme`}
            accessibilityState={{ checked: selected }}
            onPress={() => setMode(option.mode)}
            onFocus={() => setFocusedMode(option.mode)}
            onBlur={() => setFocusedMode(null)}
            style={({ pressed }) => [
              styles.option,
              selected && styles.optionSelected,
              pressed && styles.pressed,
              focusedMode === option.mode && styles.focused,
            ]}
          >
            <Ionicons
              name={option.icon}
              size={15}
              color={selected ? colors.chipTextActive : colors.textMuted}
            />
            {!iconOnly ? (
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {option.label}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  container: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  option: {
    flex: 1,
    minHeight: 36,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  optionSelected: {
    backgroundColor: colors.chipActive,
  },
  pressed: {
    opacity: 0.85,
  },
  focused: Platform.select({
    web: {
      boxShadow: `0 0 0 2px ${colors.focusRing}`,
    } as unknown as ViewStyle,
    default: {
      borderWidth: 2,
      borderColor: colors.focusRing,
    },
  }) as ViewStyle,
  label: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs - 1,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
  labelSelected: {
    color: colors.chipTextActive,
  },
}));
