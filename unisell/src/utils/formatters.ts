/**
 * Small display helpers used across screens.
 */

/**
 * Formats a number as Philippine pesos, e.g. 1250 -> "₱1,250".
 * We avoid `toLocaleString` so the output is identical on every device.
 */
export function formatPeso(amount: number): string {
  const rounded = Math.round(amount);
  const withCommas = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `₱${withCommas}`;
}

/** Short relative label for listing cards, e.g. "2d ago". */
export function formatRelativeDate(isoDate: string): string {
  const created = new Date(isoDate).getTime();
  if (Number.isNaN(created)) return '';

  const minutes = Math.max(0, Math.floor((Date.now() - created) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(isoDate).toLocaleDateString();
}

/** Turns a status ("available") into its display label ("Available"). */
export function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Formats a reserve meetup, e.g. "Thu, Nov 12 · 2:00 PM".
 * Returns an empty string for an invalid date so cards can skip the row.
 */
export function formatMeetupDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  const day = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const time = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${day} · ${time}`;
}

/**
 * Short label for a review card, e.g. "Today", "Yesterday" or "Oct 20".
 */
export function formatReviewDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const days = Math.round(
    (startOfDay(now) - startOfDay(date)) / 86_400_000,
  );

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats an average rating for display, e.g. 4.666 -> "4.7".
 * Returns "New" when the student has not received a review yet.
 */
export function formatAverageRating(reviews: { rating: number }[]): string {
  if (reviews.length === 0) return 'New';
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return (total / reviews.length).toFixed(1);
}

/** "1 review" / "3 reviews", used by the Profile stats. */
export function formatReviewCount(count: number): string {
  return `${count} ${count === 1 ? 'review' : 'reviews'}`;
}

/** "★" repeated for a rating, e.g. 4 -> "★★★★". */
export function formatStars(rating: number): string {
  return '★'.repeat(Math.max(0, Math.min(5, Math.round(rating))));
}

/**
 * Masks the sensitive part of a student ID for the Profile screen.
 * "2022-0417" -> "2022-••17"; short or unusual values are fully masked.
 */
export function maskStudentId(studentId: string): string {
  const digits = studentId.replace(/\D/g, '');
  if (digits.length < 6) return '•'.repeat(Math.max(4, studentId.length));
  return `${digits.slice(0, 4)}-••${digits.slice(-2)}`;
}

/** "Mika Santos" -> "MS", used by the avatar circles. */
export function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || '?';
}
