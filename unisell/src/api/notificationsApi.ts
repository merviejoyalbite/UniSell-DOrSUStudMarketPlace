import { apiClient, ApiError } from './apiClient';
import type {
  AppNotification,
  NewNotificationInput,
  User,
} from '../types';
import { NOT_SIGNED_IN_ERROR } from '../utils/permissions';
import { loadSession } from '../utils/storage';

/**
 * Notification data access (Phase 3).
 *
 * Every notification row belongs to one recipient (`userId`). Reads and read
 * receipts re-check the signed-in student from the persisted session, because
 * json-server itself has no authentication. A real backend would enforce the
 * same rule with row-level security.
 *
 * Notifications are secondary to the action that caused them: the lifecycle
 * helpers in reservationsApi/listingsApi call `createNotificationSafely`, which
 * never lets a notification failure fail the reserve, accept or sold action.
 */

export const NOTIFICATION_OWNERSHIP_ERROR =
  'You can only manage your own notifications.';

/** Read the signed-in student from the persisted session, never a screen. */
async function getSessionUser(): Promise<User> {
  const user = await loadSession();
  if (!user) throw new ApiError(NOT_SIGNED_IN_ERROR, 401);
  return user;
}

function newestFirst(
  notifications: AppNotification[],
): AppNotification[] {
  return [...notifications].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * Load the signed-in student's notifications, newest first.
 *
 * A network failure returns an empty list so the rest of the marketplace keeps
 * working in the bundled-fallback demo mode.
 */
export async function getNotificationsForUser(): Promise<AppNotification[]> {
  const user = await getSessionUser();

  try {
    const notifications = await apiClient.get<AppNotification[]>(
      `/notifications?userId=${user.id}`,
    );
    return newestFirst(notifications);
  } catch (error) {
    const isNetworkError =
      error instanceof ApiError && error.status === undefined;
    if (isNetworkError) return [];
    throw error;
  }
}

/** Mark one notification as read, after confirming the session owns it. */
export async function markNotificationRead(
  id: number,
): Promise<AppNotification> {
  const user = await getSessionUser();
  const notification = await apiClient.get<AppNotification>(
    `/notifications/${id}`,
  );

  if (notification.userId !== user.id) {
    throw new ApiError(NOTIFICATION_OWNERSHIP_ERROR, 403);
  }

  // Patching an already-read row is harmless, but skipping the request keeps
  // tap-to-open snappy when the card is already read.
  if (notification.read) return notification;

  return apiClient.patch<AppNotification>(`/notifications/${id}`, {
    read: true,
  });
}

/** Mark every unread notification for the signed-in student as read. */
export async function markAllNotificationsRead(): Promise<void> {
  const user = await getSessionUser();
  const unread = await apiClient.get<AppNotification[]>(
    `/notifications?userId=${user.id}&read=false`,
  );

  await Promise.all(
    unread.map((notification) =>
      apiClient.patch<AppNotification>(`/notifications/${notification.id}`, {
        read: true,
      }),
    ),
  );
}

/**
 * Create one notification for a recipient.
 *
 * Used by the reserve lifecycle and the sold flow; not called by screens.
 */
export async function createNotification(
  input: NewNotificationInput,
): Promise<AppNotification> {
  return apiClient.post<AppNotification>('/notifications', {
    ...input,
    listingId: input.listingId ?? null,
    reservationId: input.reservationId ?? null,
    read: false,
    createdAt: new Date().toISOString(),
    sample: false,
  });
}

/**
 * Best-effort wrapper for lifecycle notifications.
 *
 * A failed notification must never undo or block the primary action (reserve,
 * accept, decline, cancel, sold). The error is logged for debugging only.
 */
export async function createNotificationSafely(
  input: NewNotificationInput,
): Promise<void> {
  try {
    await createNotification(input);
  } catch (error) {
    console.warn(
      '[UniSell notifications] Could not create a notification.',
      error,
    );
  }
}
