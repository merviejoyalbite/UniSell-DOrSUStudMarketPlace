import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import { AppButton } from '../components/AppButton';
import { ErrorBanner } from '../components/ErrorBanner';
import { ListingImage } from '../components/ListingImage';
import { RoundIconButton } from '../components/RoundIconButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SegmentedControl } from '../components/SegmentedControl';
import { useAuth } from '../context/AuthContext';
import { useListings } from '../context/ListingsContext';
import { useNotifications } from '../context/NotificationsContext';
import { useReservations } from '../context/ReservationsContext';
import { useReviews } from '../context/ReviewsContext';
import { useToast } from '../context/ToastContext';
import type { RootStackScreenProps } from '../navigation/types';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  layout,
  lineHeights,
  radii,
  spacing,
  useTheme,
  type ThemeColors,
} from '../theme';
import type { Listing, Reservation, ReservationStatus } from '../types';
import { confirmAction } from '../utils/confirm';
import {
  formatMeetupDate,
  formatPeso,
  formatRelativeDate,
  formatStatus,
  getInitials,
} from '../utils/formatters';

type DashboardTab = 'requests' | 'listings' | 'sold';

const DASHBOARD_TABS = [
  { key: 'requests', label: 'Requests' },
  { key: 'listings', label: 'My Listings' },
  { key: 'sold', label: 'Sold' },
] as const;

/** Status pill colours for a reserve request. */
function requestTone(
  status: ReservationStatus,
  colors: ThemeColors,
): { color: string; backgroundColor: string } {
  switch (status) {
    case 'pending':
      return { color: colors.warning, backgroundColor: colors.warningSoft };
    case 'accepted':
      return { color: colors.success, backgroundColor: colors.successSoft };
    case 'declined':
      return { color: colors.danger, backgroundColor: colors.dangerSoft };
    case 'completed':
      return { color: colors.primary, backgroundColor: colors.primaryLight };
    default:
      return { color: colors.textMuted, backgroundColor: colors.surfaceMuted };
  }
}

function requestStateLabel(reservation: Reservation, listing?: Listing): string {
  if (listing?.status === 'sold') return 'Sale completed.';
  if (reservation.status === 'declined') return 'Request declined.';
  if (reservation.status === 'cancelled') return 'Request cancelled.';
  if (reservation.status === 'completed') return 'Sale completed.';
  return `Request ${reservation.status}.`;
}

/**
 * Seller dashboard (Phase 3).
 *
 * Mirrors the Figma "Seller dashboard / Manage your UniSell activity" screen:
 * a pill segmented control with Requests (count), My Listings and Sold, then
 * request cards with Accept/Decline, compact manage rows with Edit / Mark as
 * sold / Delete, and a Sold tab with the total earned.
 *
 * Quantity is intentionally absent from request cards: our listings are single
 * items. Accepting marks the listing reserved through the reservations API,
 * declining leaves it available, and every write re-checks ownership in the
 * service layer.
 */
export function SellerDashboardScreen({
  navigation,
}: RootStackScreenProps<'SellerDashboard'>) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles();
  const { showToast } = useToast();
  const { unreadCount, refresh: refreshNotifications } = useNotifications();
  const {
    listings,
    status: listingsStatus,
    error: listingsError,
    refresh: refreshListings,
    updateListingStatus,
    deleteListing,
  } = useListings();
  const {
    reservations,
    status: requestsStatus,
    error: requestsError,
    refresh: refreshRequests,
    acceptReservation,
    declineReservation,
  } = useReservations();
  const { submitted: submittedReviews } = useReviews();

  const [tab, setTab] = useState<DashboardTab>('requests');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Pull fresh seller data whenever the dashboard is focused. Silent so the
  // screen does not flash a loading state over already-cached cards.
  useFocusEffect(
    useCallback(() => {
      void refreshRequests({ silent: true });
      void refreshNotifications({ silent: true });
    }, [refreshRequests, refreshNotifications]),
  );

  const sellerListings = useMemo(
    () =>
      user ? listings.filter((listing) => listing.sellerId === user.id) : [],
    [listings, user],
  );
  const activeListings = sellerListings.filter(
    (listing) => listing.status !== 'sold',
  );
  const soldListings = sellerListings.filter(
    (listing) => listing.status === 'sold',
  );
  const sellerRequests = useMemo(
    () =>
      user
        ? reservations.filter((reservation) => reservation.sellerId === user.id)
        : [],
    [reservations, user],
  );

  const listingById = useMemo(
    () => new Map(listings.map((listing) => [listing.id, listing])),
    [listings],
  );

  const tabs = useMemo(
    () =>
      DASHBOARD_TABS.map((option) =>
        option.key === 'requests'
          ? { ...option, count: sellerRequests.length }
          : option,
      ),
    [sellerRequests.length],
  );

  const totalEarned = soldListings.reduce(
    (sum, listing) => sum + listing.price,
    0,
  );

  const isLoading =
    (listingsStatus === 'loading' || requestsStatus === 'loading') &&
    listings.length === 0 &&
    reservations.length === 0;
  const loadError = requestsError ?? listingsError;

  function runAction(
    key: string,
    action: () => Promise<void>,
    successMessage: string,
  ) {
    if (busyKey) return;

    setBusyKey(key);
    setActionError(null);

    void (async () => {
      try {
        await action();
        showToast(successMessage);
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : 'Could not update this request. Please try again.',
        );
      } finally {
        setBusyKey(null);
      }
    })();
  }

  function confirmAccept(reservation: Reservation) {
    const listing = listingById.get(reservation.listingId);

    confirmAction({
      title: 'Accept this reserve request?',
      message: `${reservation.buyerName} will meet you at ${
        reservation.meetupSpot
      }.${listing ? ` "${listing.title}"` : ' The item'} will be marked reserved.`,
      confirmLabel: 'Accept request',
      onConfirm: () =>
        runAction(
          `accept-${reservation.id}`,
          async () => {
            await acceptReservation(reservation.id);
          },
          'Reserve request accepted',
        ),
    });
  }

  function confirmDecline(reservation: Reservation) {
    confirmAction({
      title: 'Decline this reserve request?',
      message:
        'The buyer will be told you cannot meet then. They can send a new request later.',
      confirmLabel: 'Decline request',
      destructive: true,
      onConfirm: () =>
        runAction(
          `decline-${reservation.id}`,
          async () => {
            await declineReservation(reservation.id);
          },
          'Reserve request declined',
        ),
    });
  }

  function openListing(listingId: number) {
    navigation.navigate('ListingDetails', { listingId });
  }

  function editListing(listing: Listing) {
    navigation.navigate('Main', {
      screen: 'Post',
      params: { listingId: listing.id },
    });
  }

  function confirmMarkSold(listing: Listing) {
    confirmAction({
      title: 'Mark this item as sold?',
      message: 'It will move to your Sold tab and leave the campus feed.',
      confirmLabel: 'Mark as sold',
      onConfirm: () =>
        runAction(
          `sold-${listing.id}`,
          async () => {
            await updateListingStatus(listing.id, 'sold');
          },
          'Marked as sold',
        ),
    });
  }

  function confirmDelete(listing: Listing) {
    confirmAction({
      title: 'Delete this listing?',
      message: 'It will disappear from the campus feed. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () =>
        runAction(
          `delete-${listing.id}`,
          async () => {
            await deleteListing(listing.id);
          },
          'Listing deleted',
        ),
    });
  }

  function renderRequestCard(reservation: Reservation) {
    const listing = listingById.get(reservation.listingId);
    const tone = requestTone(reservation.status, colors);
    const busy =
      busyKey === `accept-${reservation.id}` ||
      busyKey === `decline-${reservation.id}` ||
      busyKey === `sold-${reservation.id}`;
    const title = listing?.title ?? reservation.listingTitle;

    return (
      <View key={reservation.id} style={styles.requestCard}>
        <View style={styles.personRow}>
          <View style={styles.avatarWrap}>
            <LinearGradient
              colors={[colors.verified, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            />
            <Text style={styles.avatarText}>
              {getInitials(reservation.buyerName)}
            </Text>
          </View>
          <View style={styles.personInfo}>
            <Text style={styles.personName} numberOfLines={1}>
              {reservation.buyerName}
            </Text>
            <Text style={styles.personMeta} numberOfLines={1}>
              {reservation.buyerCourse} · {reservation.buyerYearLevel}
            </Text>
          </View>
          <Text
            style={[
              styles.statusPill,
              { color: tone.color, backgroundColor: tone.backgroundColor },
            ]}
          >
            {formatStatus(reservation.status)}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${title}`}
          disabled={!listing}
          onPress={() => listing && openListing(listing.id)}
          style={({ pressed }) => [
            styles.requestItem,
            pressed && styles.pressed,
          ]}
        >
          {listing ? (
            <ListingImage listing={listing} style={styles.requestThumb} />
          ) : (
            <View style={[styles.requestThumb, styles.thumbFallback]}>
              <Ionicons
                name="image-outline"
                size={22}
                color={colors.textMuted}
              />
            </View>
          )}
          <View style={styles.requestInfo}>
            <Text style={styles.requestTitle} numberOfLines={2}>
              {title}
            </Text>
            <Text style={styles.requestSpot} numberOfLines={1}>
              {reservation.meetupSpot}
            </Text>
            <Text style={styles.requestTime}>
              {formatMeetupDate(reservation.meetupAt)}
            </Text>
          </View>
        </Pressable>

        {reservation.status === 'pending' ? (
          <View style={styles.requestActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Decline ${reservation.buyerName}'s request for ${title}`}
              disabled={busy}
              onPress={() => confirmDecline(reservation)}
              style={({ pressed }) => [
                styles.actionButton,
                styles.declineButton,
                pressed && styles.pressed,
                busy && styles.actionDisabled,
              ]}
            >
              <Text style={styles.declineText}>
                {busyKey === `decline-${reservation.id}`
                  ? 'Declining…'
                  : 'Decline'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Accept ${reservation.buyerName}'s request for ${title}`}
              disabled={busy}
              onPress={() => confirmAccept(reservation)}
              style={({ pressed }) => [
                styles.actionButton,
                styles.acceptButton,
                pressed && styles.pressed,
                busy && styles.actionDisabled,
              ]}
            >
              <Text style={styles.acceptText}>
                {busyKey === `accept-${reservation.id}`
                  ? 'Accepting…'
                  : 'Accept'}
              </Text>
            </Pressable>
          </View>
        ) : reservation.status === 'accepted' &&
          listing &&
          listing.status !== 'sold' ? (
          <View style={styles.requestActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${title}`}
              onPress={() => openListing(reservation.listingId)}
              style={({ pressed }) => [
                styles.actionButton,
                styles.viewButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.viewText}>View item</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Mark ${title} as sold`}
              disabled={busy}
              onPress={() => confirmMarkSold(listing)}
              style={({ pressed }) => [
                styles.actionButton,
                styles.acceptButton,
                pressed && styles.pressed,
                busy && styles.actionDisabled,
              ]}
            >
              <Text style={styles.acceptText}>
                {busyKey === `sold-${reservation.id}`
                  ? 'Saving…'
                  : 'Mark as sold'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.requestState}>
            {requestStateLabel(reservation, listing)}
          </Text>
        )}
      </View>
    );
  }

  function renderManageRow(listing: Listing) {
    const busy =
      busyKey === `sold-${listing.id}` || busyKey === `delete-${listing.id}`;

    return (
      <View key={listing.id} style={styles.manageCard}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open your listing ${listing.title}`}
          onPress={() => openListing(listing.id)}
          style={({ pressed }) => [
            styles.manageMain,
            pressed && styles.pressed,
          ]}
        >
          <ListingImage listing={listing} style={styles.manageThumb} />
          <View style={styles.manageInfo}>
            <Text style={styles.manageTitle} numberOfLines={2}>
              {listing.title}
            </Text>
            <Text style={styles.managePrice}>{formatPeso(listing.price)}</Text>
            <Text style={styles.manageMeta} numberOfLines={1}>
              {formatStatus(listing.status)} · posted{' '}
              {formatRelativeDate(listing.createdAt)}
            </Text>
          </View>
        </Pressable>

        <View style={styles.manageControls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${listing.title}`}
            disabled={busy}
            onPress={() => editListing(listing)}
            style={({ pressed }) => [
              styles.manageButton,
              pressed && styles.pressed,
              busy && styles.actionDisabled,
            ]}
          >
            <Text style={styles.manageButtonText}>Edit</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Mark ${listing.title} as sold`}
            disabled={busy}
            onPress={() => confirmMarkSold(listing)}
            style={({ pressed }) => [
              styles.manageButton,
              styles.manageSoldButton,
              pressed && styles.pressed,
              busy && styles.actionDisabled,
            ]}
          >
            <Text style={styles.manageSoldText}>Mark as sold</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete ${listing.title}`}
            disabled={busy}
            onPress={() => confirmDelete(listing)}
            style={({ pressed }) => [
              styles.manageButton,
              styles.manageDeleteButton,
              pressed && styles.pressed,
              busy && styles.actionDisabled,
            ]}
          >
            <Text style={styles.manageDeleteText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const requestsContent = (
    <View style={styles.content}>
      <ErrorBanner message={actionError} />
      {sellerRequests.length === 0 ? (
        <Text style={styles.emptyFeed}>No reserve requests yet.</Text>
      ) : (
        sellerRequests.map(renderRequestCard)
      )}
    </View>
  );

  const listingsContent = (
    <View style={styles.content}>
      <ErrorBanner message={actionError} />
      {activeListings.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>You have no active listings.</Text>
          <Text style={styles.emptyBody}>
            Post an item and it will show up here for you to manage.
          </Text>
          <AppButton
            label="Post an item"
            icon="add"
            variant="accent"
            onPress={() => navigation.navigate('Main', { screen: 'Post' })}
            style={styles.emptyAction}
          />
        </View>
      ) : (
        activeListings.map(renderManageRow)
      )}
    </View>
  );

  const soldContent = (
    <View style={styles.content}>
      <ErrorBanner message={actionError} />
      {soldListings.length === 0 ? (
        <Text style={styles.emptyFeed}>No sold listings yet.</Text>
      ) : (
        soldListings.map((listing) => {
          const sale = sellerRequests.find(
            (reservation) =>
              reservation.listingId === listing.id &&
              (reservation.status === 'accepted' ||
                reservation.status === 'completed'),
          );
          const reviewed = submittedReviews.some(
            (review) =>
              review.listingId === listing.id &&
              review.reviewerId === user?.id,
          );

          return (
            <View key={listing.id} style={styles.manageCard}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open sold listing ${listing.title}`}
                onPress={() => openListing(listing.id)}
                style={({ pressed }) => [
                  styles.manageMain,
                  pressed && styles.pressed,
                ]}
              >
                <ListingImage listing={listing} style={styles.manageThumb} />
                <View style={styles.manageInfo}>
                  <Text style={styles.manageTitle} numberOfLines={2}>
                    {listing.title}
                  </Text>
                  <Text style={styles.managePrice}>
                    {formatPeso(listing.price)}
                  </Text>
                  <Text style={styles.manageMeta}>Sale completed</Text>
                </View>
                <Text style={styles.soldStamp}>Sold</Text>
              </Pressable>

              {sale ? (
                <View style={styles.soldActions}>
                  {reviewed ? (
                    <Text style={styles.soldReviewNote}>
                      You reviewed this sale.
                    </Text>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Rate ${sale.buyerName} for ${listing.title}`}
                      onPress={() =>
                        navigation.navigate('Review', {
                          listingId: listing.id,
                        })
                      }
                      style={({ pressed }) => [
                        styles.rateBuyerButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name="star-outline"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={styles.rateBuyerText}>Rate buyer</Text>
                    </Pressable>
                  )}
                </View>
              ) : null}
            </View>
          );
        })
      )}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total earned</Text>
        <Text style={styles.summaryValue}>{formatPeso(totalEarned)}</Text>
        <Text style={styles.summaryBody}>
          From {soldListings.length} completed campus{' '}
          {soldListings.length === 1 ? 'sale' : 'sales'}
        </Text>
      </View>
    </View>
  );

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
              Seller dashboard
            </Text>
            <Text style={styles.subtitle}>Manage your UniSell activity</Text>
          </View>
          <RoundIconButton
            icon="notifications-outline"
            accessibilityLabel={
              unreadCount > 0
                ? `Open notifications, ${unreadCount} unread`
                : 'Open notifications'
            }
            onPress={() => navigation.navigate('Notifications')}
            size={44}
            dot={unreadCount > 0}
          />
        </View>

        <SegmentedControl
          options={tabs}
          value={tab}
          onChange={setTab}
          accessibilityLabel="Seller dashboard view"
          style={styles.tabs}
        />

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator
              size="small"
              color={colors.primary}
              accessibilityLabel="Loading seller dashboard"
            />
            <Text style={styles.loadingText}>Loading your activity…</Text>
          </View>
        ) : (
          <>
            {loadError && !actionError ? (
              <View style={styles.bannerWrap}>
                <ErrorBanner
                  message={loadError}
                  onRetry={() => {
                    void refreshRequests();
                    void refreshListings();
                  }}
                />
              </View>
            ) : null}
            {tab === 'requests'
              ? requestsContent
              : tab === 'listings'
                ? listingsContent
                : soldContent}
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
    marginBottom: spacing.lg,
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
  tabs: {
    marginBottom: spacing.lg,
  },
  bannerWrap: {
    marginBottom: spacing.md,
  },
  content: {
    gap: 11,
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
  emptyFeed: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.md,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    ...shadows.card,
  },
  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.text,
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: spacing.lg,
  },
  requestCard: {
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: 13,
    ...shadows.card,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.onPrimary,
  },
  personInfo: {
    flex: 1,
    minWidth: 0,
  },
  personName: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  personMeta: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.verified,
  },
  statusPill: {
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    overflow: 'hidden',
  },
  requestItem: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    padding: 9,
  },
  requestThumb: {
    width: 60,
    height: 58,
    borderRadius: 12,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  requestInfo: {
    flex: 1,
    minWidth: 0,
  },
  requestTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  requestSpot: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
  requestTime: {
    marginTop: 3,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.primary,
  },
  requestActions: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
  },
  declineButton: {
    borderColor: colors.danger,
    backgroundColor: colors.surface,
  },
  declineText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.danger,
  },
  acceptButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  acceptText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.onPrimary,
  },
  viewButton: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  viewText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.primary,
  },
  actionDisabled: {
    opacity: 0.55,
  },
  requestState: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  manageCard: {
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: 13,
    ...shadows.card,
  },
  manageMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  manageThumb: {
    width: 66,
    height: 66,
    borderRadius: 14,
  },
  manageInfo: {
    flex: 1,
    minWidth: 0,
  },
  manageTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  managePrice: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.primary,
  },
  manageMeta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
  manageControls: {
    marginTop: 11,
    flexDirection: 'row',
    gap: 8,
  },
  manageButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
  },
  manageButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.text,
  },
  manageSoldButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  manageSoldText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.onPrimary,
  },
  manageDeleteButton: {
    borderColor: colors.danger,
    backgroundColor: colors.surface,
  },
  manageDeleteText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.danger,
  },
  soldStamp: {
    borderRadius: radii.pill,
    backgroundColor: colors.successSoft,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.success,
    overflow: 'hidden',
  },
  soldActions: {
    marginTop: spacing.sm,
  },
  rateBuyerButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.chip,
    paddingHorizontal: spacing.md,
  },
  rateBuyerText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.primary,
  },
  soldReviewNote: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  summaryCard: {
    alignItems: 'center',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...shadows.card,
  },
  summaryLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  summaryValue: {
    marginVertical: 4,
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.primary,
  },
  summaryBody: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
}));
