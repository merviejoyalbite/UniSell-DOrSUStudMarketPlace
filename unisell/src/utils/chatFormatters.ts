/**
 * Date helpers for the Messages inbox and chat screen.
 *
 * Times are rendered in the device's local timezone. The Figma design shows a
 * short clock time for today, "Yesterday" for the previous day, a weekday
 * within the last week and a short date for older threads.
 */

function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a) === startOfDay(b);
}

function daysAgo(date: Date): number {
  return Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
}

/** Short clock time, e.g. "10:38 AM". */
export function formatMessageTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Compact inbox timestamp: clock time, "Yesterday", "Mon" or "Nov 5". */
export function formatChatListTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  const age = daysAgo(date);
  if (age <= 0) return formatMessageTime(isoDate);
  if (age === 1) return 'Yesterday';
  if (age < 7) return date.toLocaleDateString(undefined, { weekday: 'short' });

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/** Day divider inside a chat: "Today", "Yesterday", "Monday" or "Nov 5". */
export function formatChatDay(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  const age = daysAgo(date);
  if (age <= 0) return 'Today';
  if (age === 1) return 'Yesterday';
  if (age < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  }

  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}
