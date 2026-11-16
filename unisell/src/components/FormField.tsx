import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
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

interface FormFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Optional leading icon. Post listing fields omit it to match Figma. */
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  /** Optional link on the right side of the label, e.g. "Forgot password?". */
  labelAction?: { label: string; onPress: () => void };
  /** Optional non-interactive hint on the right side, e.g. a counter. */
  labelHint?: string;
  /** Compact 44px field used by the Post listing form. */
  compact?: boolean;
}

/**
 * Labelled text input used by the Login and Sign Up forms.
 * Handles focus styling, inline errors and the show/hide password toggle.
 */
export function FormField({
  label,
  icon,
  error,
  labelAction,
  labelHint,
  secureTextEntry,
  multiline,
  compact = false,
  onFocus,
  onBlur,
  ...inputProps
}: FormFieldProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      <View style={[styles.labelRow, compact && styles.labelRowCompact]}>
        <Text style={styles.label}>{label}</Text>
        {labelAction ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={labelAction.label}
            onPress={labelAction.onPress}
            hitSlop={14}
          >
            <Text style={styles.labelAction}>{labelAction.label}</Text>
          </Pressable>
        ) : labelHint ? (
          <Text style={styles.labelHint}>{labelHint}</Text>
        ) : null}
      </View>

      <View
        style={[
          styles.inputRow,
          compact && styles.inputRowCompact,
          multiline && styles.inputRowMultiline,
          compact && multiline && styles.inputRowMultilineCompact,
          focused && styles.inputRowFocused,
          Boolean(error) && styles.inputRowError,
          focused && Platform.OS === 'web' && { boxShadow: `0 0 0 3px ${colors.primaryLight}` } as any,
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
          accessibilityLabel={label}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={isPassword ? !revealed : false}
          multiline={multiline}
          style={[
            styles.input,
            compact && styles.inputCompact,
            multiline && styles.inputMultiline,
            compact && multiline && styles.inputMultilineCompact,
            noOutline,
          ]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />

        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            onPress={() => setRevealed((current) => !current)}
            hitSlop={14}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={19}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  wrapper: {
    marginBottom: spacing.lg,
  },
  wrapperCompact: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  labelRowCompact: {
    marginBottom: 6,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.label,
  },
  labelAction: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.primary,
  },
  labelHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
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
  inputRowCompact: {
    minHeight: 44,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
  },
  inputRowFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  inputRowError: {
    borderColor: colors.danger,
    backgroundColor: colors.surface,
  },
  inputRowMultiline: {
    alignItems: 'flex-start',
    paddingTop: spacing.md,
    borderRadius: radii.md,
  },
  inputRowMultilineCompact: {
    borderRadius: radii.sm,
    paddingTop: spacing.sm + 2,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  inputCompact: {
    paddingVertical: spacing.sm,
  },
  inputMultiline: {
    minHeight: 104,
    paddingTop: 0,
    paddingBottom: spacing.md,
    textAlignVertical: 'top',
  },
  inputMultilineCompact: {
    minHeight: 88,
    paddingBottom: spacing.sm + 2,
  },
  error: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.danger,
  },
}));
