import { Ionicons } from '@expo/vector-icons';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  radii,
  spacing,
  useTheme,
} from '../theme';

interface SampleImageBadgeProps {
  variant?: 'card' | 'detail';
  /** Icon-only tiny badge used on small phone screens. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Small overlay that marks a seeded illustration as a sample. Camera listings
 * never render this badge because their `imageType` is undefined.
 */
export function SampleImageBadge({
  variant = 'card',
  compact = false,
  style,
}: SampleImageBadgeProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const isDetail = variant === 'detail';

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel="Sample image, not a photo of the actual item"
      style={[
        styles.base,
        compact ? styles.compact : isDetail ? styles.detail : styles.card,
        style,
      ]}
    >
      <Ionicons
        name="image-outline"
        size={compact ? 8 : isDetail ? 13 : 11}
        color={colors.primary}
      />
      {!compact && (
        <Text style={[styles.text, isDetail && styles.detailText]}>
          Sample image
        </Text>
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
  },
  card: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    ...shadows.card,
  },
  compact: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  detail: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs - 1,
    lineHeight: lineHeights.xs,
    color: colors.primary,
  },
  detailText: {
    fontSize: fontSizes.xs,
  },
}));
