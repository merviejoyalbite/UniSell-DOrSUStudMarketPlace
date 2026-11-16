import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  radii,
  spacing,
  useTheme,
} from '../theme';

interface OfflineBannerProps {
  message?: string;
}

/**
 * Shown when the feed comes from the bundled JSON fallback. The app remains
 * usable, but the student should know the data may be a saved copy.
 */
export function OfflineBanner({
  message = "You're offline. Showing saved listings.",
}: OfflineBannerProps) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  text: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.warning,
  },
}));
