import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  spacing,
  useTheme,
} from '../theme';
import { AppButton } from './AppButton';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  accent?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Friendly empty state for "no saved items", "no search matches" and missing
 * listings. The optional action gives the student a clear next step.
 */
export function EmptyState({
  icon,
  title,
  message,
  accent,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const accentColor = accent ?? colors.primary;

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: `${accentColor}18` }]}>
        <Ionicons name={icon} size={34} color={accentColor} />
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  iconCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    marginTop: spacing.xs,
    maxWidth: 300,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.lg,
    minWidth: 200,
  },
}));
