import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
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

export interface AppTextInputProps extends TextInputProps {
  /** Optional leading icon. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Error message rendered below the field. */
  error?: string;
  /** Container style override. */
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Reusable rounded text input that removes the browser's default orange/yellow
 * focus outline (web) and instead shows a teal border + soft teal glow on focus.
 * Error states keep a red border.
 */
export function AppTextInput({
  icon,
  error,
  containerStyle,
  onFocus,
  onBlur,
  style,
  placeholderTextColor,
  ...inputProps
}: AppTextInputProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);

  const focusedGlow = Platform.OS === 'web'
    ? ({ boxShadow: `0 0 0 3px ${colors.primaryLight}` } as any)
    : {};

  return (
    <View style={containerStyle}>
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          Boolean(error) && styles.inputRowError,
          focused && focusedGlow,
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? colors.primary : colors.textMuted}
          />
        ) : null}
        <TextInput
          {...inputProps}
          accessibilityLabel={inputProps.accessibilityLabel}
          placeholderTextColor={placeholderTextColor ?? colors.placeholder}
          style={[styles.input, noOutline, style]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  inputRow: {
    minHeight: 52,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputRowFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  inputRowError: {
    borderColor: colors.danger,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  error: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.danger,
  },
}));