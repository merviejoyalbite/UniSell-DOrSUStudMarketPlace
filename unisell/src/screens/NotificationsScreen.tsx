import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { RoundIconButton } from '../components/RoundIconButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { useReservations } from '../context/ReservationsContext';
import { useToast } from '../context/ToastContext';
import type { RootStackScreenProps } from '../navigation/types';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  layout,
  lineHeights,
  spacing,
  useTheme,
  type ThemeColors,
} from '../theme';
import type { AppNotification, NotificationTone, Reservation } from '../types';

interface ToneStyle {
  color: string;
  backgroundColor: string;
  icon: keyof typeof Ionicons.glyphMap;
}

/**
 * Figma notification tones: teal heart, green check, amber clock and blue star.
 * The icons come from Ionicons so they render consistently on Android and web.
 */
function notificationTone(
  tone: NotificationTone,
  colors: ThemeColors,
): ToneStyle {
  switch (tone) {
    case 'green':
      return {
        color: colors.success,
        backgroundColor: colors.successSoft,
        icon: 'checkmark',
      };
    case 'amber':
      return {
        color: colors.warning,
        backgroundColor: colors.warningSoft,
        icon: 'time-outline',
      };
    case 'blue':
      return {
        color: colors.verified,
        backgroundColor: colors.categoryTag,
        icon: 'star',
      };
    default:
      return {
        color: colors.primary,
        backgroundColor: colors.primaryLight,
        icon: 'heart-outline',
      };
  }
}

/** Compact relative time used on a notification card. */
function formatNotificationTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  const minutes = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 60_000),
  );
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function isToday(isoDate: string): boolean {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/**
 * Notifications screen (Phase 3).
 *
 * Mirrors the Figma "Notifications / Updates from your marketplace" screen:
 * a Today / Earlier feed of glass cards with a tone icon, title, detail, time
 * and "· New" for unread rows. Tapping a card marks it read and opens the
 * listing or seller dashboard it refers to.
 *
 * Notifications are created by the reserve lifecycle and the sold flow in the
 * API layer; this screen never writes domain data.
 */
export function NotificationsScreen({
  navigation,
}: RootStackScreenProps<'Notifications'>) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles();
  const { showToast } = useToast();
  const {
    notifications,
    status,
    error,
    unreadCount,
    refresh,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const { reservations, acceptReservation, declineReservation } =
    useReservations();

  const [markingAll, setMarkingAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<Set<number>>(new Set());

  // Pick up notifications created while this screen was closed. Silent so the
  // cached list stays visible instead of flashing a spinner.
  useFocusEffect(
    useCallback(() => {
      void refresh({ silent: true });
    }, [refresh]),
  );

  const { today, earlier } = useMemo(() => {
    const groups: { today: AppNotification[]; earlier: AppNotification[] } = {
      today: [],
      earlier: [],
    };

    notifications.forEach((notification) => {
      (isToday(notification.createdAt)
        ? groups.today
        : groups.earlier
      ).push(notification);
    });

    return groups;
  }, [notifications]);

  const firstName = user?.name.trim().split(/\s+/)[0] ?? 'Student';
  const isLoading =
    (status === 'loading' || status === 'idle') && notifications.length === 0;

  function displayTitle(notification: AppNotification): string {
    // Figma personalizes the accepted-request card with the reader's name.
    return notification.title === 'Your reserve was accepted'
      ? `${firstName}, your reserve was accepted`
      : notification.title;
  }

  function openNotification(notification: AppNotification) {
    if (!notification.read) {
      // Mark read in the background so opening the item is instant. A failed
      // write only leaves the card unread; it never blocks navigation.
      void markAsRead(notification.id).catch(() => undefined);
    }

    if (notification.target === 'listing' && notification.listingId) {
      navigation.navigate('ListingDetails', {
        listingId: notification.listingId,
      });
      return;
    }

    if (notification.target === 'review' && notification.listingId) {
      navigation.navigate('Review', { listingId: notification.listingId });
      return;
    }

    if (notification.target === 'shop') {
      navigation.navigate('Main', {
        screen: 'Profile',
        params: { tab: 'shop', nonce: Date.now() },
      });
      return;
    }

    if (notification.target === 'dashboard') {
      navigation.navigate('SellerDashboard');
    }
  }

  /** Is this card a seller-side pending reserve request? */
  function isReserveRequest(notification: AppNotification): boolean {
    return (
      Boolean(notification.reservationId) &&
      notification.tone === 'teal' &&
      /reserve request/i.test(notification.title)
    );
  }

  /** The reservation behind a reserve-request notification, if loaded. */
  function reservationFor(notification: AppNotification): Reservation | undefined {
    if (!notification.reservationId) return undefined;
    return reservations.find((r) => r.id === notification.reservationId);
  }

  async function handleAcceptReserve(notification: AppNotification) {
    const reservation = reservationFor(notification);
    if (!reservation) return;
    if (processing.has(reservation.id)) return;

    setProcessing((prev) => new Set([...prev, reservation.id]));
    setActionError(null);
    try {
      await acceptReservation(reservation.id);
      await refresh({ silent: true }).catch(() => undefined);
      showToast(
        `Accepted ${reservation.buyerName}'s request — ${reservation.listingTitle}`,
      );
    } catch (acceptError) {
      setActionError(
        acceptError instanceof Error
          ? acceptError.message
          : 'Could not accept the reserve request.',
      );
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(reservation.id);
        return next;
      });
    }
  }

  async function handleDeclineReserve(notification: AppNotification) {
    const reservation = reservationFor(notification);
    if (!reservation) return;
    if (processing.has(reservation.id)) return;

    setProcessing((prev) => new Set([...prev, reservation.id]));
    setActionError(null);
    try {
      await declineReservation(reservation.id);
      await refresh({ silent: true }).catch(() => undefined);
      showToast(`Declined ${reservation.buyerName}'s request`);
    } catch (declineError) {
      setActionError(
        declineError instanceof Error
          ? declineError.message
          : 'Could not decline the reserve request.',
      );
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(reservation.id);
        return next;
      });
    }
  }

  async function handleMarkAllAsRead() {
    if (markingAll || unreadCount === 0) return;

    setMarkingAll(true);
    setActionError(null);

    try {
      await markAllAsRead();
      showToast('All notifications marked as read');
    } catch (markError) {
      setActionError(
        markError instanceof Error
          ? markError.message
          : 'Could not mark your notifications as read.',
      );
    } finally {
      setMarkingAll(false);
    }
  }

  function renderCard(notification: AppNotification) {
    const tone = notificationTone(notification.tone, colors);
    const isReserve = isReserveRequest(notification);
    const reservation = isReserve ? reservationFor(notification) : undefined;
    const processingThis = reservation
      ? processing.has(reservation.id)
      : false;

    const reserveDetail = isReserve && reservation
      ? `Meet ${reservation.buyerName} (${reservation.buyerCourse} ${reservation.buyerYearLevel}) at ${new Date(reservation.meetupAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
      : notification.detail;

    return (
      <Pressable
        key={notification.id}
        accessibilityRole="button"
        accessibilityLabel={`${displayTitle(notification)}. ${
          notification.detail
        }. ${formatNotificationTime(notification.createdAt)}${
          notification.read ? '' : '. New'
        }`}
        onPress={() => {
          if (!isReserve) openNotification(notification);
        }}
        style={({ pressed }) => [
          styles.card,
          !notification.read && styles.cardUnread,
          pressed && styles.pressed,
        ]}
      >
        <View
          style={[styles.iconTile, { backgroundColor: tone.backgroundColor }]}
        >
          <Ionicons name={tone.icon} size={18} color={tone.color} />
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{displayTitle(notification)}</Text>
          <Text style={styles.cardDetail}>{reserveDetail}</Text>
          <Text style={styles.cardTime}>
            {formatNotificationTime(notification.createdAt)}
            {notification.read ? '' : <Text style={styles.newLabel}> · New</Text>}
          </Text>
        </View>

        {isReserve ? (
          <View style={styles.reserveActions}>
            <Pressable
              onStartShouldSetResponder={() => true}
              onPress={() => void handleAcceptReserve(notification)}
              disabled={processingThis}
              style={[
                styles.actionButton,
                styles.acceptButton,
                processingThis && styles.actionDisabled,
              ]}
            >
              <Text style={[styles.actionText, styles.acceptText]}>
                {processingThis ? 'Accepting…' : 'Accept'}
              </Text>
            </Pressable>
            <Pressable
              onStartShouldSetResponder={() => true}
              onPress={() => void handleDeclineReserve(notification)}
              disabled={processingThis}
              style={[
                styles.actionButton,
                styles.declineButton,
                processingThis && styles.actionDisabled,
              ]}
            >
              <Text style={[styles.actionText, styles.declineText]}>
                {processingThis ? 'Declining…' : 'Decline'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textMuted}
          />
        )}
      </Pressable>
    );
  }

  function renderGroup(title: string, items: AppNotification[]) {
    if (items.length === 0) return null;

    return (
      <View style={styles.group}>
        <Text accessibilityRole="header" style={styles.groupTitle}>
          {title}
        </Text>
        <View style={styles.list}>{items.map(renderCard)}</View>
      </View>
    );
  }

  return (
    <ScreenContainer scroll maxWidth={layout.maxFormWidth}>
      <View style={styles.page}>
        <View style={styles.header}>
          <RoundIconButton
            icon="arrow-back"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
            size={44}
          />
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>
              Notifications
            </Text>
            <Text style={styles.subtitle}>
              Updates from your marketplace
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mark all notifications as read"
          accessibilityState={{
            disabled: unreadCount === 0 || markingAll,
          }}
          disabled={unreadCount === 0 || markingAll}
          onPress={() => {
            void handleMarkAllAsRead();
          }}
          style={({ pressed }) => [
            styles.markAll,
            pressed && styles.pressed,
          ]}
        >
          {markingAll ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text
              style={[
                styles.markAllText,
                unreadCount === 0 && styles.markAllDisabled,
              ]}
            >
              Mark all as read
            </Text>
          )}
        </Pressable>

        <ErrorBanner message={actionError} />
        {error ? (
          <ErrorBanner
            message={error}
            onRetry={() => {
              void refresh();
            }}
          />
        ) : null}

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator
              size="small"
              color={colors.primary}
              accessibilityLabel="Loading notifications"
            />
            <Text style={styles.loadingText}>Loading notifications…</Text>
          </View>
        ) : notifications.length === 0 ? (
          error ? null : (
            <EmptyState
              icon="notifications-outline"
              title="You're all caught up"
              message="New offers, messages and listing updates will appear here."
            />
          )
        ) : (
          <>
            {renderGroup('Today', today)}
            {renderGroup('Earlier', earlier)}
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  page: {
    width: '100%',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heading: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  markAll: {
    alignSelf: 'flex-end',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  markAllText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.primary,
  },
  markAllDisabled: {
    color: colors.textMuted,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxxl,
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  group: {
    marginBottom: spacing.lg,
  },
  groupTitle: {
    marginLeft: 2,
    marginBottom: spacing.xs,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  list: {
    gap: 7,
  },
  card: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: 11,
    ...shadows.card,
  },
  cardUnread: {
    borderColor: colors.primary,
  },
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  cardDetail: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.md,
    color: colors.textMuted,
  },
  cardTime: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  newLabel: {
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
  reserveActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    minHeight: 28,
    minWidth: 70,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  declineButton: {
    backgroundColor: colors.textMuted,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.background,
  },
  acceptText: {
    color: colors.background,
  },
  declineText: {
    color: colors.background,
  },
  pressed: {
    opacity: 0.75,
  },
}));
