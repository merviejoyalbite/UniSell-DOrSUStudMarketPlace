import { apiClient, ApiError } from './apiClient';
import { createNotificationSafely } from './notificationsApi';
import fallbackListings from '../data/listings.json';
import type {
  Listing,
  ListingStatus,
  ListingsSource,
  NewListingInput,
  Reservation,
  UpdateListingInput,
  User,
} from '../types';
import {
  EDIT_OWNERSHIP_ERROR,
  NOT_SIGNED_IN_ERROR,
  OWNERSHIP_ERROR,
  SOLD_EDIT_ERROR,
  canManageListing,
} from '../utils/permissions';
import { loadSession } from '../utils/storage';

/**
 * Listings data access.
 *
 * Reads fall back to the bundled JSON file when the mock server is unreachable
 * (network error / timeout), so the app is demo-safe. A real HTTP error such as
 * a 500 is passed to the context so the UI can show its error state.
 *
 * Writes always go to the mock server and always re-check ownership against the
 * persisted session. json-server itself has no authentication, so this service
 * layer is the demo's last line of defence; a real backend would enforce the
 * same rule with row-level security.
 */

const FALLBACK_LISTINGS = fallbackListings as Listing[];

export interface ListingsResult {
  listings: Listing[];
  source: ListingsSource;
}

function newestFirst(listings: Listing[]): Listing[] {
  return [...listings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getListings(): Promise<ListingsResult> {
  try {
    const listings = await apiClient.get<Listing[]>('/listings');
    return { listings: newestFirst(listings), source: 'api' };
  } catch (error) {
    const isNetworkError = error instanceof ApiError && error.status === undefined;
    if (isNetworkError) {
      // Offline / server-down mode: use the data bundled with the app.
      return { listings: newestFirst(FALLBACK_LISTINGS), source: 'fallback' };
    }
    throw error;
  }
}

export async function getListingById(id: number): Promise<Listing> {
  try {
    return await apiClient.get<Listing>(`/listings/${id}`);
  } catch (error) {
    const isNetworkError = error instanceof ApiError && error.status === undefined;
    const fallback = isNetworkError
      ? FALLBACK_LISTINGS.find((listing) => listing.id === id)
      : undefined;

    if (fallback) return fallback;
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError('This listing is no longer available.', 404);
    }
    throw error instanceof ApiError ? error : new ApiError('Listing not found.');
  }
}

/** Read the signed-in student from the persisted session, never from a screen. */
async function getSessionUser(): Promise<User> {
  const user = await loadSession();
  if (!user) throw new ApiError(NOT_SIGNED_IN_ERROR, 401);
  return user;
}

/**
 * Load the current server copy before a write. Unlike `getListingById`, this
 * never uses the bundled fallback: an owner action must not be applied to a
 * stale demo record.
 */
async function loadListingForWrite(id: number): Promise<Listing> {
  try {
    return await apiClient.get<Listing>(`/listings/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError('This listing is no longer available.', 404);
    }
    throw error;
  }
}

/**
 * Ownership guard used by every status change and delete.
 * The listing id comes from the caller, but the identity always comes from the
 * stored session, and the seller id always comes from the server copy.
 */
async function assertOwner(id: number, action: 'edit' | 'manage'): Promise<Listing> {
  const [user, listing] = await Promise.all([
    getSessionUser(),
    loadListingForWrite(id),
  ]);

  if (!canManageListing(user, listing)) {
    throw new ApiError(
      action === 'edit' ? EDIT_OWNERSHIP_ERROR : OWNERSHIP_ERROR,
      403,
    );
  }

  return listing;
}

export async function createListing(input: NewListingInput): Promise<Listing> {
  // Seller identity is always taken from the session. Any seller fields that a
  // screen happens to pass are overwritten here.
  const user = await getSessionUser();
  const payload = {
    ...input,
    sellerId: user.id,
    sellerName: user.name,
    sellerCourse: user.course,
    sellerYearLevel: user.yearLevel,
    status: 'available' as const,
    createdAt: new Date().toISOString(),
    soldAt: null,
    imageType: null,
  };

  // json-server assigns the numeric id and appends the record to db.json.
  return apiClient.post<Listing>('/listings', payload);
}

export async function updateListing(
  id: number,
  input: UpdateListingInput,
): Promise<Listing> {
  const listing = await assertOwner(id, 'edit');

  if (listing.status === 'sold') {
    throw new ApiError(SOLD_EDIT_ERROR, 400);
  }

  // Keep createdAt, sellerId and the denormalized seller fields from the
  // existing record; only the editable item fields change.
  const payload = {
    title: input.title,
    description: input.description,
    price: input.price,
    category: input.category,
    condition: input.condition,
    image: input.image,
    images: input.images,
    imageSources: input.imageSources,
    meetupSpot: input.meetupSpot,
    imageType: input.imageType ?? null,
    updatedAt: new Date().toISOString(),
  };

  return apiClient.patch<Listing>(`/listings/${id}`, payload);
}

export async function updateListingStatus(
  id: number,
  status: ListingStatus,
): Promise<Listing> {
  const listing = await assertOwner(id, 'manage');

  const now = new Date().toISOString();
  const updated = await apiClient.patch<Listing>(`/listings/${id}`, {
    status,
    soldAt: status === 'sold' ? now : null,
    updatedAt: now,
  });

  // A sold item is news for the buyer whose accepted request it fulfils. The
  // request itself stays `accepted`; there is no separate completed step yet.
  // Guard against a duplicate notification when a sold row is saved again.
  if (status === 'sold' && listing.status !== 'sold') {
    const accepted = await apiClient
      .get<Reservation[]>(`/reservations?listingId=${id}&status=accepted`)
      .catch(() => []);

    const buyerId = accepted[0]?.buyerId;
    if (buyerId) {
      await createNotificationSafely({
        userId: buyerId,
        title: 'Item marked as sold',
        detail: `${listing.title} was handed over by ${listing.sellerName}. You can now leave a review.`,
        tone: 'green',
        target: 'review',
        listingId: id,
      });
    }
  }

  return updated;
}

export async function deleteListing(id: number): Promise<void> {
  await assertOwner(id, 'manage');
  await apiClient.delete<void>(`/listings/${id}`);
}

/**
 * Profile editing keeps the denormalized seller snapshot on each listing in
 * sync. The caller (authApi) has already checked that the session owns
 * `userId`; this helper is intentionally not exported for screen use.
 */
export async function updateUserListingsSellerFields(
  userId: number,
  fields: {
    sellerName: string;
    sellerCourse: string;
    sellerYearLevel: string;
  },
): Promise<void> {
  const listings = await apiClient.get<Listing[]>(
    `/listings?sellerId=${userId}`,
  );

  await Promise.all(
    listings.map((listing) =>
      apiClient.patch<Listing>(`/listings/${listing.id}`, fields),
    ),
  );
}
