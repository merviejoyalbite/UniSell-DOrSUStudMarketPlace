import type { Listing, User } from '../types';

/**
 * Ownership is the single rule behind every seller action.
 *
 * A listing belongs to the student whose session id matches `sellerId`. The
 * helper is deliberately small so screens and tests cannot drift into slightly
 * different checks.
 */
export function canManageListing(
  user: User | null | undefined,
  listing: Pick<Listing, 'sellerId'> | null | undefined,
): boolean {
  return Boolean(user && listing && listing.sellerId === user.id);
}

/** Shared rejection copy for status changes and deletes. */
export const OWNERSHIP_ERROR = 'You can only change your own listings.';

/** The edit form uses slightly more specific copy. */
export const EDIT_OWNERSHIP_ERROR = 'You can only edit your own listings.';

export const SOLD_EDIT_ERROR =
  'Sold listings cannot be edited. Mark it as available again first.';

export const NOT_SIGNED_IN_ERROR =
  'Please sign in again before managing your listings.';

export const PROFILE_OWNERSHIP_ERROR =
  'You can only edit your own profile.';
