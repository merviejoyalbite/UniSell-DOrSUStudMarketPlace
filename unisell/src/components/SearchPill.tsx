import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type StyleProp,
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
import { noOutline } from '../lib/noOutline';

interface SearchPillProps {
  placeholder: string;
  /** Read-only mode: the whole pill is a button that opens Search. */
  onPress?: () => void;
  /** Editable mode: typing filters the results in place. */
  value?: string;
  onChangeText?: (value: string) => void;
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
  /** Small circular action on the right (filter icon, clear icon, ...). */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightAccessibilityLabel?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pill search bar. On Home it is a button that opens the Search screen; on the
 * Search screen it becomes a real input. Both share the Figma glass pill.
 */
export function SearchPill({
  placeholder,
  onPress,
  value,
  onChangeText,
  onSubmitEditing,
  autoFocus = false,
  rightIcon,
  onRightPress,
  rightAccessibilityLabel,
  accessibilityLabel,
  style,
}: SearchPillProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  const editable = typeof onChangeText === 'function';

  const right = rightIcon ? (
    onRightPress ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={rightAccessibilityLabel ?? 'Search action'}
        onPress={onRightPress}
        hitSlop={8}
        style={({ pressed }) => [
          styles.rightButton,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name={rightIcon} size={17} color={colors.primary} />
      </Pressable>
    ) : (
      <View style={styles.rightButton}>
        <Ionicons name={rightIcon} size={17} color={colors.primary} />
      </View>
    )
  ) : null;

  const content = (
    <>
      <Ionicons name="search" size={19} color={colors.textMuted} />
      {editable ? (
        <TextInput
          accessibilityLabel={accessibilityLabel ?? placeholder}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          autoFocus={autoFocus}
          returnKeyType="search"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
      ) : (
        <Text style={styles.placeholder} numberOfLines={1}>
          {placeholder}
        </Text>
      )}
      {right}
    </>
  );

  if (!editable) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? placeholder}
        onPress={onPress}
        style={({ pressed }) => [
          styles.pill,
          pressed && styles.pressed,
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.pill, focused && styles.pillFocused, style]}>
      {content}
    </View>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  pill: {
    minHeight: 52,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    paddingLeft: spacing.md + 2,
    paddingRight: spacing.xs + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.card,
  },
  pillFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
    ...(Platform.OS === 'web' ? { boxShadow: `0 0 0 3px ${colors.primaryLight}` } : {}),
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.text,
    ...noOutline,
  },
  placeholder: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.placeholder,
  },
  rightButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
}));
