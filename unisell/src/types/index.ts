/**
 * Shared domain types for UniSell.
 *
 * Keep these types in one place so the API layer, context providers and
 * screens all agree on the shape of the data.
 */

/** Categories shown as filter chips on the Home and Search screens. */
export const CATEGORIES = [
  'Textbooks',
  'Uniforms',
  'Gadgets',
  'Dorm Items',
  'Food',
  'Others',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CONDITIONS = ['New', 'Used'] as const;
export type Condition = (typeof CONDITIONS)[number];

/** Campus spots students can choose for a safe meet-up. */
export const MEETUP_SPOTS = [
  'Admin Building',
  'College of Business',
  'Dormitory Gate',
  'Gymnasium',
  'IT Building Lobby',
  'Main Gate',
  'Main Library Lobby',
  'Nursing Building',
  'PE Building Entrance',
  'Science Building',
  'Student Center',
] as const;
export type MeetupSpot = (typeof MEETUP_SPOTS)[number];

/** Degree programs offered in the sign-up form. */
export const COURSES = ['BSIT', 'BSCS', 'BSED', 'BSBA', 'BSN', 'BSA'] as const;

/** Year levels offered in the sign-up form. */
export const YEAR_LEVELS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
] as const;

export const LISTING_STATUSES = ['available', 'reserved', 'sold'] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

/** Where a seller photo came from. Matches `Listing.imageSources`. */
export type ImageSource = 'camera' | 'gallery';

export interface User {
  id: number;
  name: string;
  email: string;
  course: string;
  yearLevel: string;
  studentId?: string;
  /**
   * Optional profile photo as a compressed `data:image/jpeg;base64,...` URI.
   * `null`/missing means the initials avatar is shown.
   */
  photo?: string | null;
}

export interface Listing {
  id: number;
  title: string;
  description: string;
  /** Price in Philippine pesos. */
  price: number;
  category: Category;
  condition: Condition;
  status: ListingStatus;
  /**
   * First photo. Seller camera/gallery photos use a
   * `data:image/jpeg;base64,...` URI; seeded listings use an API-served path
   * such as `/images/01-item.jpg`. `null` means the category placeholder is shown.
   */
  image: string | null;
  /** Photos in display order: seller data URIs or API-served paths (1–3). */
  images?: string[];
  /**
   * Source of each photo, in the same order as `images`. Older camera records
   * may omit this; the UI infers `camera` for their `data:image` values.
   */
  imageSources?: ImageSource[];
  /**
   * `sample` marks the AI-generated illustrations used by the seeded demo
   * listings. Seller listings leave this undefined, so they never show the
   * "Sample image" badge.
   */
  imageType?: 'sample' | 'camera' | null;
  sellerId: number;
  sellerName: string;
  sellerCourse: string;
  sellerYearLevel: string;
  meetupSpot: string;
  /** ISO date string, e.g. "2026-10-18T09:30:00.000Z". */
  createdAt: string;
  /** ISO date set when the owner marks the item sold. */
  soldAt?: string | null;
  /** ISO date set on every successful edit or status change. */
  updatedAt?: string;
}

/** Input accepted by `listingsApi.createListing`. */
export interface NewListingInput {
  title: string;
  description: string;
  price: number;
  category: Category;
  condition: Condition;
  /** First photo, mirrored from `images[0]` for older screens. */
  image: string | null;
  /** 1–3 seller photos as base64 data URIs. */
  images: string[];
  /** One `camera` or `gallery` value per photo, in `images` order. */
  imageSources: ImageSource[];
  sellerId: number;
  sellerName: string;
  sellerCourse: string;
  sellerYearLevel: string;
  meetupSpot: string;
}

/**
 * Fields the owner can change when editing a listing.
 *
 * Seller identity and `createdAt` are intentionally absent: the service layer
 * keeps them from the existing record, and `updatedAt` is added by the API.
 */
export interface UpdateListingInput {
  title: string;
  description: string;
  price: number;
  category: Category;
  condition: Condition;
  image: string | null;
  images: string[];
  imageSources: ImageSource[];
  meetupSpot: string;
  /** Preserved for untouched seeded sample illustrations. */
  imageType?: 'sample' | 'camera' | null;
}

export const RESERVATION_STATUSES = [
  'pending',
  'accepted',
  'declined',
  'cancelled',
  'completed',
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/**
 * A buyer's request to meet and buy a listing.
 *
 * Buyer and listing fields are denormalized snapshots so the seller dashboard
 * can render a request without extra lookups, and so an old request still
 * reads correctly after a profile or listing edit.
 */
export interface Reservation {
  id: number;
  listingId: number;
  buyerId: number;
  sellerId: number;
  buyerName: string;
  buyerCourse: string;
  buyerYearLevel: string;
  listingTitle: string;
  status: ReservationStatus;
  meetupSpot: string;
  /** ISO date-time chosen by the buyer. */
  meetupAt: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  /** Seed/demo rows are marked so they can be reset. */
  sample?: boolean;
}

/** Input accepted by `reservationsApi.createReservation`. */
export interface NewReservationInput {
  meetupSpot: string;
  /** ISO date-time built from the date and time-slot pickers. */
  meetupAt: string;
  note?: string;
}

export type ReservationsStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ReservationsState {
  reservations: Reservation[];
  status: ReservationsStatus;
  error: string | null;
  /** True during a silent reload, so cards stay visible. */
  refreshing: boolean;
}

/** Colour tone + glyph used by a notification card. */
export const NOTIFICATION_TONES = ['teal', 'green', 'amber', 'blue'] as const;
export type NotificationTone = (typeof NOTIFICATION_TONES)[number];

/**
 * Where tapping a notification card sends the student.
 *
 * `review` opens the rate-and-review form for a completed sale, and `shop`
 * opens the signed-in student's Seller shop tab (recent reviews).
 */
export const NOTIFICATION_TARGETS = [
  'listing',
  'dashboard',
  'shop',
  'review',
  'none',
] as const;
export type NotificationTarget = (typeof NOTIFICATION_TARGETS)[number];

/**
 * A single marketplace update for one student.
 *
 * `AppNotification` avoids colliding with the browser DOM `Notification` type
 * used by React Native Web. The API stores one row per recipient, so ownership
 * is a simple `userId` check.
 */
export interface AppNotification {
  id: number;
  /** Recipient. */
  userId: number;
  title: string;
  detail: string;
  tone: NotificationTone;
  /** Which screen the card opens when tapped. */
  target: NotificationTarget;
  /** Listing opened for `target: 'listing'`. */
  listingId?: number | null;
  createdAt: string;
  read: boolean;
  /** Seed/demo rows are marked so they can be reset. */
  sample?: boolean;
}

/** Input accepted by `notificationsApi.createNotification`. */
export interface NewNotificationInput {
  userId: number;
  title: string;
  detail: string;
  tone: NotificationTone;
  target: NotificationTarget;
  listingId?: number | null;
}

export type NotificationsStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface NotificationsState {
  notifications: AppNotification[];
  status: NotificationsStatus;
  error: string | null;
  /** True during a silent reload, so cards stay visible. */
  refreshing: boolean;
}

/**
 * One conversation thread between a buyer and the seller of a listing.
 *
 * There is exactly one thread per listing + buyer. The listing fields are
 * denormalized snapshots so the inbox still renders if the listing is edited or
 * removed; the chat screen prefers the live listing when it is available.
 */
export interface Chat {
  id: number;
  listingId: number;
  buyerId: number;
  sellerId: number;
  buyerName: string;
  sellerName: string;
  listingTitle: string;
  listingPrice: number;
  listingImage: string | null;
  listingCategory: Category;
  /** Snapshot; the chat screen prefers the live listing status when found. */
  listingStatus: ListingStatus;
  createdAt: string;
  updatedAt: string;
  /** Seed/demo rows are marked so they can be reset. */
  sample?: boolean;
}

/** One message inside a chat. */
export interface ChatMessage {
  id: number;
  chatId: number;
  senderId: number;
  body: string;
  createdAt: string;
  /** True once the recipient has opened the conversation. */
  read: boolean;
  /** Seed/demo rows are marked so they can be reset. */
  sample?: boolean;
}

/** Chat plus the derived fields the inbox needs. */
export interface ChatThread extends Chat {
  lastMessage: string;
  lastMessageAt: string;
  /** Incoming messages the signed-in student has not read yet. */
  unreadCount: number;
}

export type ChatsStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ChatsState {
  chats: ChatThread[];
  status: ChatsStatus;
  error: string | null;
  /** True during a silent reload, so the list stays visible. */
  refreshing: boolean;
}

/** Quick tags a student can pick when reviewing a completed sale. */
export const REVIEW_TAGS = [
  'On time',
  'As described',
  'Friendly',
  'Fair price',
] as const;
export type ReviewTag = (typeof REVIEW_TAGS)[number];

/**
 * One review left after a completed sale.
 *
 * A review is tied to the listing, the accepted/completed reservation and the
 * reviewer, so the same student cannot review the same sale twice. Both the
 * buyer and the seller may review the other party.
 */
export interface Review {
  id: number;
  listingId: number;
  reservationId: number;
  reviewerId: number;
  reviewerName: string;
  revieweeId: number;
  revieweeName: string;
  /** Whole stars from 1 to 5. */
  rating: number;
  tags: ReviewTag[];
  comment: string;
  createdAt: string;
  /** Seed/demo rows are marked so they can be reset. */
  sample?: boolean;
}

/** Input accepted by `reviewsApi.createReview`. */
export interface NewReviewInput {
  listingId: number;
  reservationId: number;
  rating: number;
  tags: ReviewTag[];
  comment: string;
}

/**
 * Everything the review form needs, resolved from the session and the
 * completed sale. The API returns this so the screen never guesses who the
 * reviewee is or whether the student already reviewed the sale.
 */
export interface ReviewTarget {
  listing: Listing;
  reservation: Reservation;
  /** The other party in the sale: the seller for a buyer, buyer for a seller. */
  revieweeId: number;
  revieweeName: string;
  reviewerRole: 'buyer' | 'seller';
  alreadyReviewed: boolean;
  /** The existing review when `alreadyReviewed` is true. */
  review: Review | null;
}

export type ReviewsStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ReviewsState {
  /** Reviews other students left for the signed-in student. */
  received: Review[];
  /** Reviews the signed-in student submitted. */
  submitted: Review[];
  status: ReviewsStatus;
  error: string | null;
  /** True during a silent reload, so lists stay visible. */
  refreshing: boolean;
}

/** Editable profile fields sent to `PATCH /users/:id`. */
export interface ProfileUpdateInput {
  name: string;
  course: string;
  yearLevel: string;
  /** `null` removes the photo and restores the initials avatar. */
  photo?: string | null;
}

export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
}

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;
}

export type ListingsStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Where the current feed came from: the mock server or bundled JSON. */
export type ListingsSource = 'api' | 'fallback';

export interface ListingsState {
  listings: Listing[];
  status: ListingsStatus;
  source: ListingsSource | null;
  error: string | null;
  /** Listing ids saved by the signed-in student. */
  favorites: number[];
  /** True during pull-to-refresh, so the feed can stay visible. */
  refreshing: boolean;
}
