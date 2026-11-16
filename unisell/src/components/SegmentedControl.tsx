import { useState } from 'react';
import {
  Platform,
  Pressable,
  Text,
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
} from '../theme';

export interface SegmentOption<T extends string> {
  key: T;
  label: string;
  /** Optional count badge, e.g. pending requests or listings. */
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  /** `null` leaves every segment unselected (used before a form choice). */
  value: T | null;
  onChange: (key: T) => void;
  accessibilityLabel?: string;
  /** `form` is the compact rounded track used by the Post listing form. */
  variant?: 'pill' | 'form';
  style?: StyleProp<ViewStyle>;
}

/**
 * Pill segmented control used for Profile | Seller shop and
 * Requests | My Listings | Sold. The active segment is filled teal, matching
 * the Figma control; an optional count sits in a small badge.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel = 'View options',
  variant = 'pill',
  style,
}: SegmentedControlProps<T>) {
  const styles = useStyles();
  const [focusedKey, setFocusedKey] = useState<T | null>(null);
  const isForm = variant === 'form';

  return (
    <View
      accessibilityRole={isForm ? 'radiogroup' : 'tablist'}
      accessibilityLabel={accessibilityLabel}
      style={[styles.container, isForm && styles.containerForm, style]}
    >
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole={isForm ? 'radio' : 'tab'}
            accessibilityLabel={
              typeof option.count === 'number'
                ? `${option.label}, ${option.count}`
                : option.label
            }
            accessibilityState={{
              selected: active,
              checked: isForm ? active : undefined,
            }}
            aria-checked={isForm ? active : undefined}
            aria-selected={isForm ? undefined : active}
            hitSlop={isForm ? 3 : 0}
            onPress={() => onChange(option.key)}
            onFocus={() => setFocusedKey(option.key)}
            onBlur={() => setFocusedKey(null)}
            style={({ pressed }) => [
              styles.segment,
              isForm && styles.segmentForm,
              active &&
                (isForm ? styles.segmentActiveForm : styles.segmentActive),
              pressed && styles.pressed,
              focusedKey === option.key && styles.focused,
            ]}
          >
            <Text
              style={[
                styles.label,
                active && styles.labelActive,
                isForm && active && styles.labelActiveForm,
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
            {typeof option.count === 'number' ? (
              <View
                style={[styles.count, active && styles.countActive]}
              >
                <Text
                  style={[
                    styles.countText,
                    active && styles.countTextActive,
                  ]}
                >
                  {option.count}
                </Text>
              </View>
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
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: 4,
  },
  containerForm: {
    gap: 0,
    borderRadius: radii.sm,
    borderWidth: 0,
    backgroundColor: colors.segmentedTrack,
    padding: 3,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
  },
  segmentForm: {
    minHeight: 38,
    borderRadius: 10,
    paddingHorizontal: spacing.xs,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentActiveForm: {
    backgroundColor: colors.segmentedThumb,
  },
  pressed: {
    opacity: 0.86,
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
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.onPrimary,
  },
  labelActiveForm: {
    color: colors.primary,
  },
  count: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
    paddingHorizontal: 5,
  },
  countActive: {
    backgroundColor: colors.hoverSheen,
  },
  countText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs - 2,
    lineHeight: lineHeights.xs - 4,
    color: colors.textMuted,
  },
  countTextActive: {
    color: colors.onPrimary,
  },
}));
