import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
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
  type ThemeColors,
  type ThemeGradients,
} from '../theme';
import { useReducedMotion, ANIM_DURATION } from '../lib/animations';

export type ButtonVariant =
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'dangerOutline'
  | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon shown before the label. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Icon shown after the label. */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  /** Stretch to the parent width (forms and dialogs). */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  accessibilityHint?: string;
}

/** Which variants paint a gradient instead of a flat surface. */
const GRADIENT_VARIANTS: ButtonVariant[] = [
  'primary',
  'accent',
  'success',
  'warning',
  'danger',
];

const SIZE_TOKENS = {
  sm: {
    minHeight: 40,
    paddingHorizontal: spacing.md + 2,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    icon: 16,
    gap: spacing.xs + 2,
  },
  md: {
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    icon: 18,
    gap: spacing.sm,
  },
  lg: {
    minHeight: 56,
    paddingHorizontal: spacing.xxl - 4,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    icon: 20,
    gap: spacing.sm + 2,
  },
} as const;

function getGradient(
  variant: ButtonVariant,
  gradients: ThemeGradients,
): readonly [string, string] | null {
  if (!GRADIENT_VARIANTS.includes(variant)) return null;
  if (variant === 'primary') return gradients.primary;
  if (variant === 'accent') return gradients.accent;
  if (variant === 'success') return gradients.success;
  if (variant === 'warning') return gradients.warning;
  return gradients.danger;
}

function getContentColor(variant: ButtonVariant, colors: ThemeColors): string {
  switch (variant) {
    case 'primary':
      return colors.onPrimary;
    case 'accent':
      return colors.onAccent;
    case 'success':
      return colors.onSuccess;
    case 'warning':
      return colors.onWarning;
    case 'danger':
      return colors.onDanger;
    case 'secondary':
    case 'ghost':
      return colors.primary;
    case 'dangerOutline':
      return colors.danger;
    default:
      return colors.text;
  }
}

function getShadowColor(variant: ButtonVariant, colors: ThemeColors): string {
  switch (variant) {
    case 'accent':
      return colors.accentStrong;
    case 'success':
      return colors.successStrong;
    case 'warning':
      return colors.warningStrong;
    case 'danger':
    case 'dangerOutline':
      return colors.dangerStrong;
    default:
      return colors.primaryDark;
  }
}

/**
 * The single button used across UniSell.
 *
 * Variants follow a simple colour language: teal is the brand default, orange
 * is reserved for the main call to action, green/amber describe listing state,
 * and red is only used for destructive actions. Every colour comes from the
 * active palette, so light and dark mode are both covered.
 */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  rightIcon,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  labelStyle,
  accessibilityHint,
}: AppButtonProps) {
  const { colors, gradients, shadows } = useTheme();
  const styles = useStyles();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const isDisabled = disabled || loading;
  const gradient = isDisabled ? null : getGradient(variant, gradients);
  const contentColor = isDisabled ? colors.disabledText : getContentColor(variant, colors);
  const sizeToken = SIZE_TOKENS[size];
  const isOutline =
    variant === 'secondary' || variant === 'dangerOutline' || variant === 'ghost';
  const reduced = useReducedMotion();

  // Press scale animation.
  const [pressScale] = useState(new Animated.Value(1));
  const pressedRef = useRef(false);

  const hoveredStyle: ViewStyle | null =
    hovered && !isDisabled && Platform.OS === 'web'
      ? { ...shadows.button, shadowColor: getShadowColor(variant, colors) }
      : null;

  return (
    <Animated.View
      style={[{ transform: [{ scale: pressScale }] }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={() => {
          if (isDisabled) return;
          if (reduced) {
            pressScale.setValue(0.96);
          } else {
            Animated.timing(pressScale, {
              toValue: 0.96,
              duration: ANIM_DURATION.fast,
              useNativeDriver: true,
            }).start();
          }
        }}
        onPressOut={() => {
          if (isDisabled) return;
          if (reduced) {
            pressScale.setValue(1);
          } else {
            Animated.timing(pressScale, {
              toValue: 1,
              duration: ANIM_DURATION.fast,
              useNativeDriver: true,
            }).start();
          }
        }}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        hitSlop={size === 'sm' ? 4 : 0}
        style={({ pressed }) => [
          styles.base,
          {
            minHeight: sizeToken.minHeight,
            paddingHorizontal: sizeToken.paddingHorizontal,
            gap: sizeToken.gap,
          },
          fullWidth && styles.fullWidth,
          !isDisabled && variant === 'secondary' && styles.secondary,
          !isDisabled && variant === 'dangerOutline' && styles.dangerOutline,
          !isDisabled && variant === 'ghost' && styles.ghost,
          isDisabled && styles.disabled,
          hoveredStyle,
          pressed && !isDisabled && styles.pressed,
          focused && styles.focused,
          style,
        ]}
      >
        {gradient ? (
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}

        {hovered && !isDisabled && !isOutline ? (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.hoverSheen }]}
          />
        ) : null}
        {hovered && !isDisabled && isOutline ? (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.primaryLight }]}
          />
        ) : null}

        {loading ? (
          <ActivityIndicator size="small" color={contentColor} />
        ) : icon ? (
          <Ionicons name={icon} size={sizeToken.icon} color={contentColor} />
        ) : null}

        <Text
          style={[
            styles.label,
            {
              fontSize: sizeToken.fontSize,
              lineHeight: sizeToken.lineHeight,
              color: contentColor,
              width: '100%',
              textAlign: 'center',
            },
            labelStyle,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>

        {!loading && rightIcon ? (
          <Ionicons name={rightIcon} size={sizeToken.icon} color={contentColor} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  base: {
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fullWidth: {
    width: '100%',
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  dangerOutline: {
    backgroundColor: colors.surface,
    borderColor: colors.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  disabled: {
    backgroundColor: colors.disabledBackground,
    borderColor: colors.disabledBorder,
    opacity: 0.9,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
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
    flexShrink: 1,
    textAlign: 'center',
  },
}));
