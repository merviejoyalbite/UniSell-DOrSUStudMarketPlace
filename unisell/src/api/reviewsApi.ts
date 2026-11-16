import { apiClient, ApiError } from './apiClient';
import { createNotificationSafely } from './notificationsApi';
import type {
  Listing,
  NewReviewInput,
  Reservation,
  Review,
  ReviewTag,
  ReviewTarget,
  User,
} from '../types';
import { REVIEW_TAGS } from '../types';
import { NOT_SIGNED_IN_ERROR } from '../utils/permissions';
import { loadSession } from '../utils/storage';

/**
 * Review data access (Phase 3).
 *
 * json-server has no authentication, so every write re-checks the signed-in
 * student from the persisted session. A review is only allowed when:
 *   - the listing is sold (or its reservation is completed);
 *   - the student is the buyer or the seller of that sale;
 *   - the student is not reviewing themselves;
 *   - the same student has not already reviewed the same sale.
 *
 * Both sides may review each other. The reviewee is always the other party in
 * the sale, so the screen never chooses it.
 */

export const REVIEW_LISTING_ERROR = 'This listing could not be found.';
export const REVIEW_NOT_COMPLETED_ERROR =
  'Reviews open after a completed sale.';
export const REVIEW_PARTICIPANT_ERROR =
  'Only the buyer and seller of this sale can review it.';
export const REVIEW_SELF_ERROR = 'You cannot review yourself.';
export const REVIEW_DUPLICATE_ERROR = 'You already reviewed this sale.';
export const REVIEW_RATING_ERROR =
  'Choose a star rating before submitting your review.';

/** Longest comment the form accepts, matching the Figma counter. */
export const REVIEW_COMMENT_MAX = 200;

/** Read the signed-in student from the persisted session, never a screen. */
async function getSessionUser(): Promise<User> {
  const user = await loadSession();
  if (!user) throw new ApiError(NOT_SIGNED_IN_ERROR, 401);
  return user;
}

function newestFirst(reviews: Review[]): Review[] {
  return [...reviews].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * Load the reviews the signed-in student received and submitted, newest first.
 *
 * A failure propagates so the Profile stats and panels can show an error and a
 * retry instead of a misleading "New · 0 reviews".
 */
export async function getReviewsForUser(): Promise<{
  received: Review[];
  submitted: Review[];
}> {
  const user = await getSessionUser();

  const [received, submitted] = await Promise.all([
    apiClient.get<Review[]>(`/reviews?revieweeId=${user.id}`),
    apiClient.get<Review[]>(`/reviews?reviewerId=${user.id}`),
  ]);

  return {
    received: newestFirst(received),
    submitted: newestFirst(submitted),
  };
}

async function loadListing(listingId: number): Promise<Listing> {
  try {
    return await apiClient.get<Listing>(`/listings/${listingId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError(REVIEW_LISTING_ERROR, 404);
    }
    throw error;
  }
}

/** The accepted/completed reservation that represents the sale. */
async function loadSale(listingId: number): Promise<Reservation | undefined> {
  const reservations = await apiClient.get<Reservation[]>(
    `/reservations?listingId=${listingId}`,
  );

  return (
    reservations.find((reservation) => reservation.status === 'accepted') ??
    reservations.find((reservation) => reservation.status === 'completed')
  );
}

function assertCompleted(listing: Listing, reservation: Reservation): void {
  const completed =
    listing.status === 'sold' || reservation.status === 'completed';
  if (!completed) {
    throw new ApiError(REVIEW_NOT_COMPLETED_ERROR, 409);
  }
}

function resolveReviewee(
  user: User,
  listing: Listing,
  reservation: Reservation,
): {
  revieweeId: number;
  revieweeName: string;
  reviewerRole: 'buyer' | 'seller';
} {
  const isBuyer = reservation.buyerId === user.id;
  const isSeller = reservation.sellerId === user.id;

  if (!isBuyer && !isSeller) {
    throw new ApiError(REVIEW_PARTICIPANT_ERROR, 403);
  }

  if (isBuyer) {
    return {
      revieweeId: reservation.sellerId,
      revieweeName: listing.sellerName,
      reviewerRole: 'buyer',
    };
  }

  return {
    revieweeId: reservation.buyerId,
    revieweeName: reservation.buyerName,
    reviewerRole: 'seller',
  };
}

/**
 * Resolve everything the review form needs for one listing.
 *
 * Throws a clear `ApiError` when the sale is not complete or the student was
 * not part of it, so the screen can show the reason instead of a blank form.
 */
export async function getReviewTarget(
  listingId: number,
): Promise<ReviewTarget> {
  const user = await getSessionUser();
  const listing = await loadListing(listingId);
  const reservation = await loadSale(listingId);

  if (!reservation) {
    throw new ApiError(REVIEW_NOT_COMPLETED_ERROR, 409);
  }

  assertCompleted(listing, reservation);
  const { revieweeId, revieweeName, reviewerRole } = resolveReviewee(
    user,
    listing,
    reservation,
  );

  if (revieweeId === user.id) {
    throw new ApiError(REVIEW_SELF_ERROR, 403);
  }

  const existing = await apiClient.get<Review[]>(
    `/reviews?listingId=${listingId}&reservationId=${reservation.id}&reviewerId=${user.id}`,
  );

  return {
    listing,
    reservation,
    revieweeId,
    revieweeName,
    reviewerRole,
    alreadyReviewed: existing.length > 0,
    review: existing[0] ?? null,
  };
}

/**
 * Create one review for the signed-in student's completed sale.
 *
 * Ownership, completion, duplicate and rating rules are repeated here even
 * though the screen checks them, because the service layer is the demo's last
 * line of defence.
 */
export async function createReview(
  input: NewReviewInput,
): Promise<Review> {
  const user = await getSessionUser();
  const listing = await loadListing(input.listingId);
  const reservation = await apiClient.get<Reservation>(
    `/reservations/${input.reservationId}`,
  );

  if (reservation.listingId !== listing.id) {
    throw new ApiError(REVIEW_LISTING_ERROR, 404);
  }

  assertCompleted(listing, reservation);
  const { revieweeId, revieweeName } = resolveReviewee(
    user,
    listing,
    reservation,
  );

  if (revieweeId === user.id) {
    throw new ApiError(REVIEW_SELF_ERROR, 403);
  }

  const existing = await apiClient.get<Review[]>(
    `/reviews?listingId=${listing.id}&reservationId=${reservation.id}&reviewerId=${user.id}`,
  );
  if (existing.length > 0) {
    throw new ApiError(REVIEW_DUPLICATE_ERROR, 409);
  }

  if (
    !Number.isInteger(input.rating) ||
    input.rating < 1 ||
    input.rating > 5
  ) {
    throw new ApiError(REVIEW_RATING_ERROR, 400);
  }

  // Keep only the four Figma tags, in their canonical order, without repeats.
  const tags = REVIEW_TAGS.filter((tag) =>
    input.tags.includes(tag as ReviewTag),
  );

  const review = await apiClient.post<Review>('/reviews', {
    listingId: listing.id,
    reservationId: reservation.id,
    reviewerId: user.id,
    reviewerName: user.name,
    revieweeId,
    revieweeName,
    rating: input.rating,
    tags,
    comment: input.comment.trim().slice(0, REVIEW_COMMENT_MAX),
    createdAt: new Date().toISOString(),
    sample: false,
  });

  // Tell the other party about the new review. Best-effort: a notification
  // failure must never lose the review.
  await createNotificationSafely({
    userId: revieweeId,
    title: 'New review received',
    detail: `${user.name} gave you ${input.rating} ${
      input.rating === 1 ? 'star' : 'stars'
    } for ${listing.title}.`,
    tone: 'blue',
    target: 'shop',
    listingId: listing.id,
  });

  return review;
}
