import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { ErrorState } from '../components/ErrorState';
import { ListingGallery } from '../components/ListingGallery';
import { LoadingState } from '../components/LoadingState';
import { OfflineBanner } from '../components/OfflineBanner';
import { ScreenContainer } from '../components/ScreenContainer';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useListings } from '../context/ListingsContext';
import { useMessages } from '../context/MessagesContext';
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
  useBreakpoint,
  useTheme,
} from '../theme';
import { FadeInView } from '../lib/animations';
import { confirmAction } from '../utils/confirm';
import {
  formatMeetupDate,
  formatPeso,
  formatRelativeDate,
  getInitials,
} from '../utils/formatters';
import { getStatusBackground, getStatusColor } from '../utils/listingStatus';
import { canManageListing } from '../utils/permissions';

type OwnerAction = 'sold' | 'reserved' | 'available' | 'delete';

interface LastAction {
  key: OwnerAction;
  action: () => Promise<void>;
  successMessage?: string;
}

/**
 * Listing details, extended with owner-only management actions.
 *
 * On desktop the gallery sits on the left and the details/actions column on
 * the right; phones keep the single-column layout. The listing is read from
 * ListingsContext by id, so the screen works while the feed is still loading.
 *
 * Ownership is decided by `canManageListing(user, listing)`. Non-owners never
 * see the owner controls; the service layer repeats the same check before any
 * PATCH or DELETE, because json-server has no authentication of its own.
 */
export function ListingDetailsScreen({
  navigation,
  route,
}: RootStackScreenProps<'ListingDetails'>) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const styles = useStyles();
  const { isDesktop, pagePadding } = useBreakpoint();
  const {
    listings,
    favorites,
    status,
    source,
    error,
    refresh,
    toggleFavorite,
    updateListingStatus,
    deleteListing,
  } = useListings();
  const { reservations, cancelReservation } = useReservations();
  const { submitted: submittedReviews } = useReviews();
  const { ensureChat } = useMessages();

  const [pendingAction, setPendingAction] = useState<OwnerAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancellingReservation, setCancellingReservation] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const lastAction = useRef<LastAction | null>(null);

  const listing = listings.find((item) => item.id === route.params.listingId);
  const isFavorite = listing ? favorites.includes(listing.id) : false;
  const isOwner = canManageListing(user, listing);
  const isActing = pendingAction !== null;

  // The buyer's current request for this item, if any. Declined and cancelled
  // requests are ignored so the Reserve button becomes available again.
  const myReservation =
    listing && user && !isOwner
      ? reservations.find(
          (reservation) =>
            reservation.listingId === listing.id &&
            reservation.buyerId === user.id &&
            (reservation.status === 'pending' ||
              reservation.status === 'accepted'),
        )
      : undefined;

  // The accepted/completed request that represents this sale, used for the
  // post-sale review entry. Both the buyer and the seller may review the other.
  const saleReservation = listing
    ? reservations.find(
        (reservation) =>
          reservation.listingId === listing.id &&
          (reservation.status === 'accepted' ||
            reservation.status === 'completed'),
      )
    : undefined;
  const isSaleParticipant = Boolean(
    user &&
      saleReservation &&
      (saleReservation.buyerId === user.id ||
        saleReservation.sellerId === user.id),
  );
  const hasReviewedSale = Boolean(
    user &&
      listing &&
      saleReservation &&
      submittedReviews.some(
        (review) =>
          review.listingId === listing.id &&
          review.reservationId === saleReservation.id &&
          review.reviewerId === user.id,
      ),
  );

  async function runAction(
    key: OwnerAction,
    action: () => Promise<void>,
    successMessage?: string,
  ) {
    if (isActing) return;

    lastAction.current = { key, action, successMessage };
    setPendingAction(key);
    setActionError(null);

    try {
      await action();
      if (successMessage) showToast(successMessage);
    } catch (actionFailure) {
      setActionError(
        actionFailure instanceof Error
          ? actionFailure.message
          : 'Could not update this listing. Please try again.',
      );
    } finally {
      setPendingAction(null);
    }
  }

  function retryLastAction() {
    const last = lastAction.current;
    if (last) {
      void runAction(last.key, last.action, last.successMessage);
    }
  }

  const backButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={() => navigation.goBack()}
      style={styles.circleButton}
      hitSlop={8}
    >
      <Ionicons name="arrow-back" size={21} color={colors.text} />
    </Pressable>
  );

  if (!listing) {
    const body =
      status === 'loading' || status === 'idle' ? (
        <LoadingState message="Loading listing…" />
      ) : status === 'error' ? (
        <ErrorState message={error} onRetry={() => void refresh()} />
      ) : (
        <EmptyState
          icon="alert-circle-outline"
          title="This listing is no longer available"
          message="The seller may have deleted it. Head back to the feed for more finds."
          actionLabel="Back to feed"
          onAction={() => navigation.goBack()}
        />
      );

    return (
      <ScreenContainer>
        <View style={styles.simpleTopBar}>{backButton}</View>
        <View style={styles.stateWrap}>{body}</View>
      </ScreenContainer>
    );
  }

  const statusColor = getStatusColor(listing.status, colors);
  const statusBackground = getStatusBackground(listing.status, colors);
  // Keep a narrowed reference for the action handlers below. TypeScript does
  // not carry the early-return narrowing into nested functions.
  const activeListing = listing;
  const statusMessage =
    listing.status === 'sold'
      ? 'This item has been sold.'
      : listing.status === 'reserved' && myReservation?.status !== 'accepted'
        ? 'This item is currently reserved.'
        : null;

  function markStatus(nextStatus: 'sold' | 'reserved' | 'available') {
    const successMessage =
      nextStatus === 'sold'
        ? 'Marked as sold'
        : nextStatus === 'reserved'
          ? 'Marked as reserved'
          : 'Marked as available';

    void runAction(
      nextStatus,
      async () => {
        await updateListingStatus(activeListing.id, nextStatus);
      },
      successMessage,
    );
  }

  function confirmMarkSold() {
    Alert.alert(
      'Mark this item as sold?',
      'Buyers will no longer be able to contact you about it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark as sold', onPress: () => markStatus('sold') },
      ],
    );
  }

  function confirmMarkReserved() {
    Alert.alert(
      'Mark this item as reserved?',
      'It stays visible in the feed with a Reserved chip while you hold it for a buyer.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark as reserved', onPress: () => markStatus('reserved') },
      ],
    );
  }

  function confirmDelete() {
    const isSold = activeListing.status === 'sold';

    Alert.alert(
      isSold ? 'Delete this sold listing?' : 'Delete this listing?',
      isSold
        ? 'This cannot be undone.'
        : 'It will disappear from the campus feed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void runAction('delete', async () => {
              await deleteListing(activeListing.id);
              showToast('Listing deleted');
              navigation.goBack();
            });
          },
        },
      ],
    );
  }

  function openEditForm() {
    navigation.navigate('Main', {
      screen: 'Post',
      params: { listingId: activeListing.id },
    });
  }

  async function openChatWithSeller() {
    if (openingChat) return;

    setOpeningChat(true);
    setActionError(null);

    try {
      const chat = await ensureChat(activeListing.id);
      navigation.navigate('Chat', { chatId: chat.id });
    } catch (chatError) {
      setActionError(
        chatError instanceof Error
          ? chatError.message
          : 'Could not open the conversation. Please try again.',
      );
    } finally {
      setOpeningChat(false);
    }
  }

  function cancelActiveReservation() {
    const reservation = myReservation;
    if (!reservation || cancellingReservation) return;

    confirmAction({
      title: 'Cancel this reserve request?',
      message: 'The seller will no longer see your meetup request.',
      confirmLabel: 'Cancel request',
      destructive: true,
      onConfirm: () => {
        setCancellingReservation(true);
        setActionError(null);

        void (async () => {
          try {
            await cancelReservation(reservation.id);
            showToast('Reserve request cancelled');
          } catch (cancelError) {
            setActionError(
              cancelError instanceof Error
                ? cancelError.message
                : 'Could not cancel your request. Please try again.',
            );
          } finally {
            setCancellingReservation(false);
          }
        })();
      },
    });
  }

  return (
    <FadeInView slideUp={12} delay={50} style={{ flex: 1 }}>
      <ScreenContainer scroll padded={false} maxWidth={layout.maxDetailsWidth}>
      <View
        style={[
          styles.layout,
          isDesktop && styles.layoutDesktop,
          isDesktop && { paddingHorizontal: pagePadding },
        ]}
      >
        <View style={[styles.galleryColumn, isDesktop && styles.galleryColumnDesktop]}>
          <View style={styles.heroWrap}>
            <ListingGallery
              listing={listing}
              height={isDesktop ? 420 : 330}
              style={[styles.hero, isDesktop && styles.heroDesktop]}
            />
            <View style={styles.overlayBar}>
              {backButton}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isFavorite ? 'Remove from saved items' : 'Save this item'
                }
                accessibilityState={{ selected: isFavorite }}
                onPress={() => toggleFavorite(listing.id)}
                style={[styles.circleButton, isFavorite && styles.circleButtonSaved]}
                hitSlop={8}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={21}
                  color={isFavorite ? colors.favorite : colors.text}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={[styles.bodyPanel, isDesktop && styles.bodyPanelDesktop]}>
          {source === 'fallback' ? <OfflineBanner /> : null}
          {error ? <ErrorBanner message={error} /> : null}

          <View style={styles.titleRow}>
            <View style={styles.titleInfo}>
              <View style={styles.tagsRow}>
                <View
                  style={[
                    styles.conditionPill,
                    listing.condition === 'New' && styles.conditionPillNew,
                  ]}
                >
                  <Text
                    style={[
                      styles.conditionText,
                      listing.condition === 'New' && styles.conditionTextNew,
                    ]}
                  >
                    {listing.condition}
                  </Text>
                </View>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryText}>{listing.category}</Text>
                </View>
                {listing.status !== 'available' ? (
                  <StatusBadge status={listing.status} />
                ) : null}
              </View>

              <Text accessibilityRole="header" style={styles.title}>
                {listing.title}
              </Text>
            </View>
            <Text style={styles.price}>{formatPeso(listing.price)}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={15} color={colors.textMuted} />
            <Text style={styles.metaText}>
              Posted {formatRelativeDate(listing.createdAt)}
            </Text>
          </View>

          {statusMessage ? (
            <View style={[styles.statusNotice, { backgroundColor: statusBackground }]}>
              <Ionicons
                name={listing.status === 'sold' ? 'close-circle' : 'time'}
                size={18}
                color={statusColor}
              />
              <Text style={[styles.statusNoticeText, { color: statusColor }]}>
                {statusMessage}
              </Text>
            </View>
          ) : null}

          {myReservation ? (
            <View
              style={[
                styles.reservationCard,
                myReservation.status === 'accepted'
                  ? styles.reservationCardAccepted
                  : styles.reservationCardPending,
              ]}
            >
              <View
                style={[
                  styles.reservationIcon,
                  myReservation.status === 'accepted'
                    ? styles.reservationIconAccepted
                    : styles.reservationIconPending,
                ]}
              >
                <Ionicons
                  name={
                    myReservation.status === 'accepted'
                      ? 'checkmark-circle'
                      : 'time'
                  }
                  size={20}
                  color={
                    myReservation.status === 'accepted'
                      ? colors.success
                      : colors.warning
                  }
                />
              </View>
              <View style={styles.reservationBody}>
                <Text
                  style={[
                    styles.reservationTitle,
                    {
                      color:
                        myReservation.status === 'accepted'
                          ? colors.success
                          : colors.warning,
                    },
                  ]}
                >
                  {myReservation.status === 'accepted'
                    ? 'Reservation accepted'
                    : 'Reservation pending'}
                </Text>
                <Text style={styles.reservationText}>
                  {myReservation.status === 'accepted'
                    ? `Meet ${listing.sellerName} at ${myReservation.meetupSpot}.`
                    : `Waiting for ${listing.sellerName} to accept your meetup request.`}
                </Text>
                <Text style={styles.reservationMeta}>
                  {formatMeetupDate(myReservation.meetupAt)} ·{' '}
                  {myReservation.meetupSpot}
                </Text>
                {myReservation.status === 'pending' ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cancel reserve request"
                    disabled={cancellingReservation}
                    onPress={cancelActiveReservation}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.cancelLink,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.cancelLinkText}>
                      {cancellingReservation
                        ? 'Cancelling…'
                        : 'Cancel request'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Description
            </Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Meetup preferences
            </Text>
            <View style={styles.meetupChips}>
              <View style={styles.meetupChip}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={colors.primary}
                />
                <Text style={styles.meetupChipText}>{listing.meetupSpot}</Text>
              </View>
            </View>
          </View>

          <View style={styles.safetyCard}>
            <View style={styles.safetyIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={19}
                color={colors.primary}
              />
            </View>
            <View style={styles.safetyText}>
              <Text style={styles.safetyTitle}>Safe campus meet-up</Text>
              <Text style={styles.safetyBody}>
                Meet at {listing.meetupSpot}. Inspect the item before paying.
              </Text>
            </View>
          </View>

          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatarWrap}>
              <LinearGradient
                colors={[colors.verified, colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sellerAvatarGradient}
              />
              <Text style={styles.sellerAvatarText}>
                {getInitials(listing.sellerName)}
              </Text>
            </View>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>{listing.sellerName}</Text>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.verified}
                  accessibilityLabel="Verified DOrSU student"
                />
              </View>
              <Text style={styles.sellerMeta}>
                {listing.sellerCourse} · {listing.sellerYearLevel}
              </Text>
            </View>
          </View>

          {isOwner ? (
            <View style={styles.ownerActions}>
              <View style={styles.ownerNotice}>
                <Ionicons
                  name="storefront-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.ownerNoticeText}>
                  This is your listing. Only you can see these controls.
                </Text>
              </View>

              {listing.status === 'sold' ? (
                <>
                  <AppButton
                    label="Delete listing"
                    icon="trash-outline"
                    variant="danger"
                    disabled={isActing}
                    loading={pendingAction === 'delete'}
                    onPress={confirmDelete}
                  />
                  <AppButton
                    label="Mark as available again"
                    icon="refresh-outline"
                    variant="secondary"
                    disabled={isActing}
                    loading={pendingAction === 'available'}
                    onPress={() => markStatus('available')}
                  />
                </>
              ) : (
                <>
                  <AppButton
                    label="Mark as sold"
                    icon="checkmark-done-outline"
                    variant="success"
                    disabled={isActing}
                    loading={pendingAction === 'sold'}
                    onPress={confirmMarkSold}
                  />
                  {listing.status === 'reserved' ? (
                    <AppButton
                      label="Mark as available"
                      icon="refresh-outline"
                      variant="secondary"
                      disabled={isActing}
                      loading={pendingAction === 'available'}
                      onPress={() => markStatus('available')}
                    />
                  ) : (
                    <AppButton
                      label="Mark as reserved"
                      icon="time-outline"
                      variant="warning"
                      disabled={isActing}
                      loading={pendingAction === 'reserved'}
                      onPress={confirmMarkReserved}
                    />
                  )}
                  <AppButton
                    label="Edit listing"
                    icon="create-outline"
                    variant="secondary"
                    disabled={isActing}
                    onPress={openEditForm}
                  />
                  <AppButton
                    label="Delete listing"
                    icon="trash-outline"
                    variant="dangerOutline"
                    disabled={isActing}
                    loading={pendingAction === 'delete'}
                    onPress={confirmDelete}
                  />
                </>
              )}

              <ErrorBanner
                message={actionError}
                onRetry={lastAction.current ? retryLastAction : undefined}
              />
            </View>
          ) : (
            <View style={styles.buyerActions}>
              {!myReservation && listing.status === 'available' ? (
                <AppButton
                  label="Reserve"
                  icon="calendar-outline"
                  onPress={() =>
                    navigation.navigate('Reserve', {
                      listingId: listing.id,
                    })
                  }
                  fullWidth
                />
              ) : null}
              <AppButton
                label="Message seller"
                icon="chatbubble-outline"
                variant="secondary"
                disabled={openingChat}
                loading={openingChat}
                onPress={() => {
                  void openChatWithSeller();
                }}
                fullWidth
              />
              <AppButton
                label={isFavorite ? 'Saved to favorites' : 'Save this item'}
                icon={isFavorite ? 'heart' : 'heart-outline'}
                variant={
                  isFavorite || (!myReservation && listing.status === 'available')
                    ? 'secondary'
                    : 'primary'
                }
                onPress={() => toggleFavorite(listing.id)}
                fullWidth
              />
              <ErrorBanner message={actionError} />
            </View>
          )}

          {listing.status === 'sold' && isSaleParticipant ? (
            <View style={styles.reviewEntry}>
              {hasReviewedSale ? (
                <View style={styles.reviewDone}>
                  <Ionicons name="star" size={18} color={colors.rating} />
                  <Text style={styles.reviewDoneText}>
                    You reviewed this sale.
                  </Text>
                </View>
              ) : (
                <AppButton
                  label={
                    saleReservation?.sellerId === user?.id
                      ? 'Rate buyer'
                      : 'Rate & review'
                  }
                  icon="star-outline"
                  variant="secondary"
                  onPress={() =>
                    navigation.navigate('Review', { listingId: listing.id })
                  }
                  fullWidth
                />
              )}
            </View>
          ) : null}
        </View>
      </View>
    </ScreenContainer>
    </FadeInView>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  simpleTopBar: {
    height: 44,
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  stateWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  layout: {
    flex: 1,
  },
  layoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  galleryColumn: {
    width: '100%',
  },
  galleryColumnDesktop: {
    flex: 1,
    minWidth: 0,
  },
  heroWrap: {
    position: 'relative',
  },
  hero: {
    width: '100%',
  },
  heroDesktop: {
    borderRadius: radii.lg,
  },
  overlayBar: {
    position: 'absolute',
    top: 20,
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  circleButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  circleButtonSaved: {
    backgroundColor: colors.favoriteSoft,
  },
  bodyPanel: {
    zIndex: 3,
    marginTop: -2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderBottomWidth: 0,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: 22,
    paddingHorizontal: spacing.lg + 4,
    paddingBottom: spacing.xxxl,
    ...shadows.card,
  },
  bodyPanelDesktop: {
    flex: 1,
    minWidth: 0,
    marginTop: 0,
    borderWidth: 1,
    borderBottomWidth: 1,
    borderRadius: radii.xl,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg - 2,
  },
  titleInfo: {
    flex: 1,
    minWidth: 0,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  conditionPill: {
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  conditionPillNew: {
    backgroundColor: colors.successSoft,
  },
  conditionText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.primary,
  },
  conditionTextNew: {
    color: colors.success,
  },
  categoryPill: {
    borderRadius: radii.pill,
    backgroundColor: colors.categoryTag,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  categoryText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.categoryTagText,
  },
  title: {
    marginTop: spacing.sm + 1,
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl - 1,
    lineHeight: lineHeights.xl,
    color: colors.text,
  },
  price: {
    flexShrink: 0,
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.primary,
  },
  metaRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metaText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  statusNotice: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  statusNoticeText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  reservationCard: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  reservationCardPending: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
  },
  reservationCardAccepted: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  reservationIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  reservationIconPending: {
    backgroundColor: colors.surface,
  },
  reservationIconAccepted: {
    backgroundColor: colors.surface,
  },
  reservationBody: {
    flex: 1,
    minWidth: 0,
  },
  reservationTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  reservationText: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  reservationMeta: {
    marginTop: 3,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
  cancelLink: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    minHeight: 28,
    justifyContent: 'center',
  },
  cancelLinkText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.danger,
  },
  pressed: {
    opacity: 0.75,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.textMuted,
  },
  meetupChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  meetupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  meetupChipText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.primary,
  },
  safetyCard: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  safetyIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyText: {
    flex: 1,
  },
  safetyTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.primary,
  },
  safetyBody: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.primary,
  },
  sellerCard: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  sellerAvatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  sellerAvatarGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sellerAvatarText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.onPrimary,
  },
  sellerInfo: {
    flex: 1,
    minWidth: 0,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sellerName: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  sellerMeta: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  ownerActions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  buyerActions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  reviewEntry: {
    marginTop: spacing.md,
  },
  reviewDone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  reviewDoneText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  ownerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
  },
  ownerNoticeText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.primary,
  },
}));
