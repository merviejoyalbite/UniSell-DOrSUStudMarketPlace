import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  radii,
  spacing,
} from '../theme';
import type { ListingStatus } from '../types';

interface StatusBadgeProps {
  status: ListingStatus;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

const LABELS: Record<ListingStatus, string> = {
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',
};

/**
 * Peach "Reserved" pill, neutral "Sold" pill and green "Available" pill.
 * The status colours come from the active palette so dark mode stays legible.
 */
export function StatusBadge({ status, label, style }: StatusBadgeProps) {
  const styles = useStyles();

  return (
    <View
      style={[
        styles.base,
        status === 'reserved' && styles.reserved,
        status === 'sold' && styles.sold,
        status === 'available' && styles.available,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          status === 'reserved' && styles.reservedText,
          status === 'sold' && styles.soldText,
          status === 'available' && styles.availableText,
        ]}
      >
        {label ?? LABELS[status]}
      </Text>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  base: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  available: {
    backgroundColor: colors.statusAvailableSoft,
  },
  reserved: {
    backgroundColor: colors.statusReservedSoft,
  },
  sold: {
    backgroundColor: colors.statusSoldSoft,
  },
  text: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs - 1,
    lineHeight: lineHeights.xs - 4,
  },
  availableText: {
    color: colors.statusAvailable,
  },
  reservedText: {
    color: colors.statusReserved,
  },
  soldText: {
    color: colors.statusSold,
  },
}));
