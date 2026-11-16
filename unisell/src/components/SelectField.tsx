import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
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

interface SelectFieldProps {
  label: string;
  value: string;
  placeholder: string;
  options: readonly string[];
  onChange: (value: string) => void;
  error?: string;
  /** Pass `null` to hide the leading icon (used by the Post form). */
  icon?: keyof typeof Ionicons.glyphMap | null;
  /** Compact 44px control used by the Post listing form. */
  compact?: boolean;
}

/**
 * Dropdown-style picker without an extra dependency.
 * Tapping the field opens a modal sheet with the available options, which is
 * easier to explain (and to style) than a platform-specific Picker.
 */
export function SelectField({
  label,
  value,
  placeholder,
  options,
  onChange,
  error,
  icon = 'chevron-down-circle-outline',
  compact = false,
}: SelectFieldProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      <Text style={[styles.label, compact && styles.labelCompact]}>
        {label}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value || placeholder }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.control,
          compact && styles.controlCompact,
          Boolean(error) && styles.controlError,
          pressed && styles.controlPressed,
        ]}
      >
        {icon ? (
          <Ionicons name={icon} size={18} color={colors.textMuted} />
        ) : null}
        <Text
          style={[
            styles.value,
            compact && styles.valueCompact,
            !value && styles.placeholder,
          ]}
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel={`Close ${label.toLowerCase()} picker`}
            onPress={() => setOpen(false)}
          />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select {label.toLowerCase()}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const selected = option === value;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityLabel={option}
                    accessibilityState={{ selected }}
                    onPress={() => {
                      onChange(option);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      pressed && styles.optionPressed,
                    ]}
                  >
                    <Text
                      style={[styles.optionText, selected && styles.optionTextSelected]}
                    >
                      {option}
                    </Text>
                    {selected ? (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  wrapper: {
    marginBottom: spacing.lg,
  },
  wrapperCompact: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  labelCompact: {
    fontFamily: fonts.semibold,
    marginBottom: 6,
  },
  control: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  controlCompact: {
    minHeight: 44,
    borderRadius: radii.sm,
  },
  controlPressed: {
    opacity: 0.8,
  },
  controlError: {
    borderColor: colors.danger,
  },
  value: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  valueCompact: {
    fontSize: fontSizes.md,
  },
  placeholder: {
    color: colors.placeholder,
  },
  error: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.danger,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '60%',
    ...shadows.floating,
  },
  sheetTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  option: {
    minHeight: 48,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: {
    backgroundColor: colors.primaryLight,
  },
  optionPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  optionText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  optionTextSelected: {
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
}));
