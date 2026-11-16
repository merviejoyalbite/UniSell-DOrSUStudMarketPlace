import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  createThemedStyles,
  radii,
  spacing,
  useTheme,
} from '../theme';

type RoundIconButtonVariant = 'glass' | 'solid' | 'ghost' | 'accent';

interface RoundIconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: RoundIconButtonVariant;
  size?: number;
  /** Orange unread dot in the top-right corner (notification bell). */
  dot?: boolean;
  /** Override the icon colour (for example a filled favourite heart). */
  iconColor?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Circular icon button used for back arrows, the notification bell, the
 * settings gear and the "..." listing menu. Matches the Figma 44–48px round
 * glass button with a soft teal shadow.
 */
export function RoundIconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'glass',
  size = 44,
  dot = false,
  iconColor,
  disabled = false,
  style,
}: RoundIconButtonProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const resolvedIconColor =
    iconColor ??
    (variant === 'solid'
      ? colors.onPrimary
      : variant === 'accent'
        ? colors.onAccent
        : colors.text);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        variant === 'glass' && styles.glass,
        variant === 'solid' && { backgroundColor: colors.primary },
        variant === 'accent' && { backgroundColor: colors.accent },
        hovered && !disabled && styles.hovered,
        pressed && !disabled && styles.pressed,
        focused && styles.focused,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Ionicons
        name={icon}
        size={Math.round(size * 0.45)}
        color={resolvedIconColor}
      />
      {dot ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.dot}
        />
      ) : null}
    </Pressable>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glass: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  hovered: {
    transform: [{ translateY: -1 }],
  },
  pressed: {
    transform: [{ scale: 0.96 }],
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
  disabled: {
    opacity: 0.45,
  },
  dot: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: colors.surfaceElevated,
  },
}));
