import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  radii,
  spacing,
  useTheme,
} from '../theme';

interface ErrorBannerProps {
  message?: string | null;
  /** Optional retry action for failed owner actions. */
  onRetry?: () => void;
}

/** Inline error used for API failures (wrong password, server down, ...). */
export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [hovered, setHovered] = useState(false);

  if (!message) return null;

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <View style={styles.body}>
        <Text style={styles.text}>{message}</Text>
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try the action again"
            onPress={onRetry}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            hitSlop={10}
            style={({ pressed }) => [
              styles.retry,
              hovered && styles.retryHovered,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="refresh" size={14} color={colors.danger} />
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  body: {
    flex: 1,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.danger,
  },
  retry: {
    marginTop: spacing.sm,
    minHeight: 36,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  retryHovered: {
    backgroundColor: colors.surface,
  },
  retryText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.danger,
  },
  pressed: {
    opacity: 0.75,
  },
}));
