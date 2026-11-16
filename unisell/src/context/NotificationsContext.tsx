import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import {
  getNotificationsForUser,
  markAllNotificationsRead as markAllNotificationsReadRequest,
  markNotificationRead as markNotificationReadRequest,
} from '../api/notificationsApi';
import type {
  AppNotification,
  NotificationsState,
} from '../types';
import { useAuth } from './AuthContext';

/**
 * NotificationsContext owns the signed-in student's marketplace updates.
 *
 * The Home bell (unread dot) and the Notifications screen read the same list.
 * Lifecycle writes happen in the API layer (reserve / accept / decline / cancel
 * / sold), so screens never create notifications directly.
 */

type NotificationsAction =
  | { type: 'LOAD_START' }
  | { type: 'REFRESH_START' }
  | { type: 'LOAD_SUCCESS'; notifications: AppNotification[] }
  | { type: 'LOAD_ERROR'; message: string }
  | { type: 'UPDATE_NOTIFICATION'; notification: AppNotification }
  | { type: 'MARK_ALL_READ' }
  | { type: 'RESET' };

const initialState: NotificationsState = {
  notifications: [],
  status: 'idle',
  error: null,
  refreshing: false,
};

function notificationsReducer(
  state: NotificationsState,
  action: NotificationsAction,
): NotificationsState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, status: 'loading', error: null, refreshing: false };
    case 'REFRESH_START':
      // Keep the current list visible while the silent reload runs.
      return { ...state, refreshing: true, error: null };
    case 'LOAD_SUCCESS':
      return {
        ...state,
        notifications: action.notifications,
        status: 'ready',
        error: null,
        refreshing: false,
      };
    case 'LOAD_ERROR':
      return {
        ...state,
        status: state.notifications.length > 0 ? 'ready' : 'error',
        error: action.message,
        refreshing: false,
      };
    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.id === action.notification.id
            ? action.notification
            : notification,
        ),
      };
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.read ? notification : { ...notification, read: true },
        ),
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface NotificationsContextValue extends NotificationsState {
  /** Number of unread cards, used by the Home bell dot. */
  unreadCount: number;
  /** Reload the signed-in student's notifications. */
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  /** Mark one card as read (tap-to-open). */
  markAsRead: (id: number) => Promise<AppNotification>;
  /** Mark every card as read ("Mark all as read"). */
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<
  NotificationsContextValue | undefined
>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(notificationsReducer, initialState);
  const userId = user?.id;

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!userId) {
        dispatch({ type: 'RESET' });
        return;
      }

      dispatch({ type: options?.silent ? 'REFRESH_START' : 'LOAD_START' });

      try {
        const notifications = await getNotificationsForUser();
        dispatch({ type: 'LOAD_SUCCESS', notifications });
      } catch (error) {
        dispatch({
          type: 'LOAD_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Could not load your notifications.',
        });
      }
    },
    [userId],
  );

  // Load when a student signs in, clear when they sign out.
  useEffect(() => {
    if (!userId) {
      dispatch({ type: 'RESET' });
      return;
    }

    void refresh();
  }, [userId, refresh]);

  const markAsRead = useCallback(async (id: number) => {
    const notification = await markNotificationReadRequest(id);
    dispatch({ type: 'UPDATE_NOTIFICATION', notification });
    return notification;
  }, []);

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsReadRequest();
    dispatch({ type: 'MARK_ALL_READ' });
  }, []);

  const unreadCount = useMemo(
    () => state.notifications.filter((notification) => !notification.read).length,
    [state.notifications],
  );

  const value = useMemo<NotificationsContextValue>(
    () => ({
      ...state,
      unreadCount,
      refresh,
      markAsRead,
      markAllAsRead,
    }),
    [state, unreadCount, refresh, markAsRead, markAllAsRead],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used inside <NotificationsProvider>.',
    );
  }
  return context;
}
