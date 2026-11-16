import { Ionicons } from '@expo/vector-icons';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  spacing,
  useTheme,
} from '../theme';

interface RatingProps {
  /** `null` means the seller has no reviews yet. */
  average: number | null;
  count?: number;
  /** Show "New · 0" instead of a numeric rating when there are no reviews. */
  showNew?: boolean;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

/**
 * Star rating used on listing cards and in the Seller shop. When a seller has
 * no reviews the label reads "New · 0", matching the Figma profile frame.
 */
export function Rating({
  average,
  count = 0,
  showNew = true,
  size = 'sm',
  style,
}: RatingProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const ratingValue = average !== null && count > 0 ? average : null;
  const iconSize = size === 'md' ? 16 : 13;
  const valueLabel = ratingValue === null ? (showNew ? 'New' : '—') : ratingValue.toFixed(1);

  return (
    <View
      accessible
      accessibilityLabel={
        ratingValue === null
          ? 'No reviews yet'
          : `${ratingValue.toFixed(1)} out of 5 from ${count} ${
              count === 1 ? 'review' : 'reviews'
            }`
      }
      style={[styles.row, style]}
    >
      <Ionicons name="star" size={iconSize} color={colors.rating} />
      <Text style={[styles.value, size === 'md' && styles.valueMd]}>
        {valueLabel}
      </Text>
      {count > 0 ? (
        <Text style={styles.count}>· {count}</Text>
      ) : showNew ? (
        <Text style={styles.count}>· 0</Text>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  value: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs - 2,
    lineHeight: lineHeights.xs - 4,
    color: colors.text,
  },
  valueMd: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  count: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs - 2,
    lineHeight: lineHeights.xs - 4,
    color: colors.textMuted,
  },
}));
