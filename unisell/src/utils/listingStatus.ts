import type { ThemeColors } from '../theme/palettes';
import type { ListingStatus } from '../types';

/**
 * Shared colour for a listing status badge.
 *
 * The palette is passed in so the same helper works in light and dark mode.
 * Keeping the mapping in one place avoids slightly different greens/oranges
 * between the feed card, details screen and profile.
 */
export function getStatusColor(
  status: ListingStatus,
  colors: Pick<
    ThemeColors,
    'statusAvailable' | 'statusReserved' | 'statusSold'
  >,
): string {
  if (status === 'reserved') return colors.statusReserved;
  if (status === 'sold') return colors.statusSold;
  return colors.statusAvailable;
}

/** Soft background that pairs with `getStatusColor` on status pills. */
export function getStatusBackground(
  status: ListingStatus,
  colors: Pick<
    ThemeColors,
    'statusAvailableSoft' | 'statusReservedSoft' | 'statusSoldSoft'
  >,
): string {
  if (status === 'reserved') return colors.statusReservedSoft;
  if (status === 'sold') return colors.statusSoldSoft;
  return colors.statusAvailableSoft;
}
