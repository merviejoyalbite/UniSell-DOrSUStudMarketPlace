import { apiClient, ApiError } from './apiClient';
import { createNotificationSafely } from './notificationsApi';
import type {
  Listing,
  NewReservationInput,
  Reservation,
  User,
} from '../types';
import { NOT_SIGNED_IN_ERROR } from '../utils/permissions';
import { loadSession } from '../utils/storage';

/**
 * Reserve request data access (Phase 3).
 *
 * json-server has no authentication, so this service layer is the demo's last
 * line of defence. Every write re-reads the signed-in student from the
 * persisted session and checks ownership against the server copy:
 *   - a buyer cannot reserve their own listing;
 *   - only the seller can accept or decline a request;
 *   - only the buyer can cancel their own pending request.
 *
 * Accepting a request also marks the listing `reserved`, which is why the
 * caller (ReservationsContext) refreshes the listing feed afterwards.
 */

export const RESERVE_OWN_LISTING_ERROR =
  'You cannot reserve your own listing.';
export const RESERVE_UNAVAILABLE_ERROR =
  'This item is no longer available to reserve.';
export const RESERVE_DUPLICATE_ERROR =
  'You already have a pending or accepted request for this item.';
export const RESERVATION_SELLER_ERROR =
  'You can only manage requests for your own listings.';
export const RESERVATION_BUYER_ERROR =
  'You can only cancel your own reserve requests.';
export const RESERVATION_NOT_PENDING_ERROR =
  'Only pending requests can be changed.';
export const RESERVATION_ALREADY_ACCEPTED_ERROR =
  'Another request is already accepted for this item.';

/** Read the signed-in student from the persisted session, never a screen. */
async function getSessionUser(): Promise<User> {
  const user = await loadSession();
  if (!user) throw new ApiError(NOT_SIGNED_IN_ERROR, 401);
  return user;
}

function newestFirst(reservations: Reservation[]): Reservation[] {
  return [...reservations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * Load every request the signed-in student can see: their own requests as a
 * buyer plus requests on the listings they sell.
 *
 * A network failure returns an empty list so the marketplace still works in
 * the bundled-fallback demo mode. Reserve writes intentionally still fail with
 * a clear error, because a request must reach the mock server to exist.
 */
export async function getReservationsForUser(): Promise<Reservation[]> {
  const user = await getSessionUser();

  try {
    const [asBuyer, asSeller] = await Promise.all([
      apiClient.get<Reservation[]>(`/reservations?buyerId=${user.id}`),
      apiClient.get<Reservation[]>(`/reservations?sellerId=${user.id}`),
    ]);

    // A user can appear on both sides only if something is inconsistent, but
    // de-duplicating by id keeps the list safe either way.
    const byId = new Map<number, Reservation>();
    [...asBuyer, ...asSeller].forEach((reservation) => {
      byId.set(reservation.id, reservation);
    });

    return newestFirst([...byId.values()]);
  } catch (error) {
    const isNetworkError = error instanceof ApiError && error.status === undefined;
    if (isNetworkError) return [];
    throw error;
  }
}

async function loadListingForReserve(listingId: number): Promise<Listing> {
  try {
    return await apiClient.get<Listing>(`/listings/${listingId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError(RESERVE_UNAVAILABLE_ERROR, 404);
    }
    throw error;
  }
}

export async function createReservation(
  listingId: number,
  input: NewReservationInput,
): Promise<Reservation> {
  const user = await getSessionUser();
  const listing = await loadListingForReserve(listingId);

  if (listing.sellerId === user.id) {
    throw new ApiError(RESERVE_OWN_LISTING_ERROR, 403);
  }

  if (listing.status !== 'available') {
    throw new ApiError(RESERVE_UNAVAILABLE_ERROR, 409);
  }

  // One active request per buyer per listing. A declined or cancelled request
  // does not block a new one.
  const existing = await apiClient.get<Reservation[]>(
    `/reservations?listingId=${listingId}&buyerId=${user.id}`,
  );
  if (
    existing.some(
      (reservation) =>
        reservation.status === 'pending' || reservation.status === 'accepted',
    )
  ) {
    throw new ApiError(RESERVE_DUPLICATE_ERROR, 409);
  }

  const now = new Date().toISOString();
  const payload = {
    listingId,
    buyerId: user.id,
    sellerId: listing.sellerId,
    buyerName: user.name,
    buyerCourse: user.course,
    buyerYearLevel: user.yearLevel,
    listingTitle: listing.title,
    status: 'pending' as const,
    meetupSpot: input.meetupSpot,
    meetupAt: input.meetupAt,
    note: input.note?.trim() ?? '',
    createdAt: now,
    updatedAt: now,
    sample: false,
  };

  const reservation = await apiClient.post<Reservation>(
    '/reservations',
    payload,
  );

  // Tell the seller a new request is waiting. Best-effort: a notification
  // failure must not lose the buyer's request.
  await createNotificationSafely({
    userId: listing.sellerId,
    title: `${user.name} sent a reserve request`,
    detail: 'Review the requested meetup details.',
    tone: 'teal',
    target: 'listing',
    listingId: listing.id,
    reservationId: reservation.id,
  });

  return reservation;
}

/**
 * Shared seller guard: load the request, confirm the session owns the listing
 * it belongs to, and confirm it is still pending.
 */
async function loadPendingRequestForSeller(
  id: number,
  user: User,
): Promise<Reservation> {
  const reservation = await apiClient.get<Reservation>(`/reservations/${id}`);

  if (reservation.sellerId !== user.id) {
    throw new ApiError(RESERVATION_SELLER_ERROR, 403);
  }

  if (reservation.status !== 'pending') {
    throw new ApiError(RESERVATION_NOT_PENDING_ERROR, 409);
  }

  return reservation;
}

export async function acceptReservation(id: number): Promise<Reservation> {
  const user = await getSessionUser();
  const reservation = await loadPendingRequestForSeller(id, user);
  const listing = await loadListingForReserve(reservation.listingId);

  if (listing.status === 'sold') {
    throw new ApiError('This item is already sold.', 409);
  }

  // Do not double-book: another accepted request already holds the item.
  const accepted = await apiClient.get<Reservation[]>(
    `/reservations?listingId=${reservation.listingId}&status=accepted`,
  );
  if (accepted.some((request) => request.id !== id)) {
    throw new ApiError(RESERVATION_ALREADY_ACCEPTED_ERROR, 409);
  }

  const now = new Date().toISOString();
  const updated = await apiClient.patch<Reservation>(`/reservations/${id}`, {
    status: 'accepted',
    updatedAt: now,
  });

  // Accepting holds the item for this buyer. The seller can still mark it sold
  // later, or mark it available again from the listing controls.
  if (listing.status !== 'reserved') {
    await apiClient.patch<Listing>(`/listings/${listing.id}`, {
      status: 'reserved',
      soldAt: null,
      updatedAt: now,
    });
  }

  // Tell the buyer their request was accepted.
  await createNotificationSafely({
    userId: reservation.buyerId,
    title: 'Your reserve was accepted',
    detail: `${user.name} accepted your ${listing.title} request.`,
    tone: 'green',
    target: 'listing',
    listingId: listing.id,
  });

  return updated;
}

export async function declineReservation(id: number): Promise<Reservation> {
  const user = await getSessionUser();
  const reservation = await loadPendingRequestForSeller(id, user);

  const updated = await apiClient.patch<Reservation>(`/reservations/${id}`, {
    status: 'declined',
    updatedAt: new Date().toISOString(),
  });

  // Tell the buyer the seller cannot meet their request.
  await createNotificationSafely({
    userId: reservation.buyerId,
    title: 'Reserve request declined',
    detail: `${user.name} declined your ${reservation.listingTitle} request.`,
    tone: 'amber',
    target: 'listing',
    listingId: reservation.listingId,
  });

  return updated;
}

export async function cancelReservation(id: number): Promise<Reservation> {
  const user = await getSessionUser();
  const reservation = await apiClient.get<Reservation>(`/reservations/${id}`);

  if (reservation.buyerId !== user.id) {
    throw new ApiError(RESERVATION_BUYER_ERROR, 403);
  }

  if (reservation.status !== 'pending') {
    throw new ApiError(RESERVATION_NOT_PENDING_ERROR, 409);
  }

  const updated = await apiClient.patch<Reservation>(`/reservations/${id}`, {
    status: 'cancelled',
    updatedAt: new Date().toISOString(),
  });

  // Tell the seller the buyer withdrew the request.
  await createNotificationSafely({
    userId: reservation.sellerId,
    title: 'Reserve request cancelled',
    detail: `${user.name} cancelled their ${reservation.listingTitle} request.`,
    tone: 'amber',
    target: 'listing',
    listingId: reservation.listingId,
  });

  return updated;
}
