import type { Category, Condition, Listing } from '../types';

export type CategoryFilter = Category | 'All';
export type ConditionFilter = Condition | 'All';

export interface ListingFilters {
  query?: string;
  category?: CategoryFilter;
  condition?: ConditionFilter;
  /** Sold items are hidden unless Search explicitly asks for them. */
  includeSold?: boolean;
}

/**
 * Pure search/filter function used by the Search screen.
 * Kept outside React so it is easy to test and explain:
 *   - keyword matches title, description, category, seller or meet-up spot
 *   - category and condition are exact matches
 *   - sold items are excluded by default
 */
export function filterListings(
  listings: Listing[],
  {
    query = '',
    category = 'All',
    condition = 'All',
    includeSold = false,
  }: ListingFilters = {},
): Listing[] {
  const needle = query.trim().toLowerCase();

  return listings.filter((listing) => {
    if (!includeSold && listing.status === 'sold') return false;
    if (category !== 'All' && listing.category !== category) return false;
    if (condition !== 'All' && listing.condition !== condition) return false;
    if (!needle) return true;

    const haystack = [
      listing.title,
      listing.description,
      listing.category,
      listing.sellerName,
      listing.meetupSpot,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(needle);
  });
}
