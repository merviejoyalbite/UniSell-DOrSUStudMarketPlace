import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { ErrorBanner } from '../components/ErrorBanner';
import { ListingActionsSheet } from '../components/ListingActionsSheet';
import { ListingCard } from '../components/ListingCard';
import { ListingImage } from '../components/ListingImage';
import { OfflineBanner } from '../components/OfflineBanner';
import { RoundIconButton } from '../components/RoundIconButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SegmentedControl } from '../components/SegmentedControl';
import { ThemeSwitch } from '../components/ThemeSwitch';
import { useAuth } from '../context/AuthContext';
import { useListings } from '../context/ListingsContext';
import { useReviews } from '../context/ReviewsContext';
import { useToast } from '../context/ToastContext';
import { useTabBarBottomInset } from '../navigation/useTabBarBottomInset';
import type { MainTabScreenProps } from '../navigation/types';
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
import type { Listing, ListingStatus, Review } from '../types';
import {
  formatAverageRating,
  formatPeso,
  formatRelativeDate,
  formatReviewCount,
  formatReviewDate,
  formatStars,
  formatStatus,
  getInitials,
} from '../utils/formatters';
import { FadeInView } from '../lib/animations';
import { confirmAction } from '../utils/confirm';
import { getStatusBackground, getStatusColor } from '../utils/listingStatus';
import { canManageListing } from '../utils/permissions';

type ProfileTab = 'profile' | 'shop';
type ProfilePanel = 'menu' | 'listings' | 'reviews';
type ListingFilter = 'active' | 'sold' | 'all';
type ProfileActionKey = 'sold' | 'reserved' | 'available' | 'delete' | 'deleteAll';

const PROFILE_TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'shop', label: 'Seller shop' },
] as const;

interface LastAction {
  key: ProfileActionKey;
  action: () => Promise<void>;
  successMessage?: string;
}

interface MenuRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

/** One row in the Figma profile menu card. */
function MenuRow({ icon, label, onPress }: MenuRowProps) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
    >
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

interface FilterSegmentProps {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}

/** Small segmented control for Active / Sold / All. */
function FilterSegment({ label, count, active, onPress }: FilterSegmentProps) {
  const styles = useStyles();

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      aria-selected={active}
      accessibilityLabel={`${label}, ${count} ${
        count === 1 ? 'listing' : 'listings'
      }`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterSegment,
        active && styles.filterSegmentActive,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.filterSegmentText,
          active && styles.filterSegmentTextActive,
        ]}
      >
        {label}
      </Text>
      <View
        style={[styles.filterCount, active && styles.filterCountActive]}
      >
        <Text
          style={[
            styles.filterCountText,
            active && styles.filterCountTextActive,
          ]}
        >
          {count}
        </Text>
      </View>
    </Pressable>
  );
}

interface MyListingRowProps {
  listing: Listing;
  onPress: () => void;
  onMore: () => void;
  onDelete: () => void;
  /** Sold rows show a visible delete shortcut in addition to the menu. */
  showDelete: boolean;
  busy: boolean;
}

/** Compact version of a listing card for the signed-in student's own posts. */
function MyListingRow({
  listing,
  onPress,
  onMore,
  onDelete,
  showDelete,
  busy,
}: MyListingRowProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const statusColor = getStatusColor(listing.status, colors);
  const statusBackground = getStatusBackground(listing.status, colors);

  return (
    <View style={styles.listingRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open your listing ${listing.title}, ${
          listing.category
        }, ${listing.condition}, ${formatPeso(listing.price)}, ${formatStatus(
          listing.status,
        )}, posted ${formatRelativeDate(listing.createdAt)}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.listingRowMain,
          pressed && styles.listingRowPressed,
        ]}
      >
        <ListingImage listing={listing} style={styles.thumbnail} />

        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle} numberOfLines={2}>
            {listing.title}
          </Text>
          <Text style={styles.listingMeta}>
            {listing.category} · {listing.condition}
          </Text>
          <View style={styles.listingBottomRow}>
            <Text style={styles.listingPrice}>{formatPeso(listing.price)}</Text>
            <View
              style={[styles.statusPill, { backgroundColor: statusBackground }]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {formatStatus(listing.status)}
              </Text>
            </View>
            <Text style={styles.listingDate}>
              {formatRelativeDate(listing.createdAt)}
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.listingActions}>
        {showDelete ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete your sold listing ${listing.title}`}
            disabled={busy}
            onPress={onDelete}
            hitSlop={8}
            style={({ pressed }) => [
              styles.rowAction,
              styles.rowActionDanger,
              pressed && styles.pressed,
              busy && styles.rowActionDisabled,
            ]}
          >
            <Ionicons name="trash-outline" size={17} color={colors.danger} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Manage your listing ${listing.title}`}
          disabled={busy}
          onPress={onMore}
          hitSlop={8}
          style={({ pressed }) => [
            styles.rowAction,
            pressed && styles.pressed,
            busy && styles.rowActionDisabled,
          ]}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={18}
            color={colors.textMuted}
          />
        </Pressable>
      </View>
    </View>
  );
}

interface ReviewCardProps {
  review: Review;
  /** `received` shows the reviewer; `submitted` shows the reviewee. */
  mode: 'received' | 'submitted';
  /** Listing title shown under the name, when the listing still exists. */
  listingTitle?: string;
}

/** Compact review row shared by the Seller shop and My reviews panel. */
function ReviewCard({ review, mode, listingTitle }: ReviewCardProps) {
  const styles = useStyles();
  const name =
    mode === 'received' ? review.reviewerName : review.revieweeName;
  const detail =
    review.comment.trim() ||
    (review.tags.length > 0 ? review.tags.join(', ') : 'No comment.');

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewAvatar}>
        <Text style={styles.reviewAvatarText}>{getInitials(name)}</Text>
      </View>
      <View style={styles.reviewBody}>
        <View style={styles.reviewTopRow}>
          <Text style={styles.reviewName} numberOfLines={1}>
            {name}
          </Text>
          <Text
            accessibilityLabel={`${review.rating} out of 5 stars`}
            style={styles.reviewStars}
          >
            {formatStars(review.rating)}
          </Text>
        </View>
        {listingTitle ? (
          <Text style={styles.reviewListing} numberOfLines={1}>
            {listingTitle}
          </Text>
        ) : null}
        <Text style={styles.reviewComment} numberOfLines={3}>
          {detail}
        </Text>
        <Text style={styles.reviewDate}>
          {formatReviewDate(review.createdAt)}
        </Text>
      </View>
    </View>
  );
}

/**
 * Phase 2 — Profile.
 *
 * Matches the Figma profile frame: gradient avatar with a verified check, name,
 * course · year, school email and three stats; a Profile | Seller shop
 * segmented control; a menu card with the verified footer; and the Seller shop
 * tab with active listings and recent reviews.
 *
 * My Listings stays as a sub-view so every owner action keeps using the same
 * context functions as Listing Details. The API service layer re-checks
 * ownership before writing.
 *
 * The student ID is intentionally not displayed anywhere on this screen.
 */
export function ProfileScreen({
  navigation,
  route,
}: MainTabScreenProps<'Profile'>) {
  const tabBarBottomInset = useTabBarBottomInset();
  const { colors } = useTheme();
  const styles = useStyles();
  const { width, columns, gridGap, isMobile } = useBreakpoint();
  const { user, signOut } = useAuth();
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
    deleteListings,
  } = useListings();
  const {
    received: receivedReviews,
    submitted: submittedReviews,
    status: reviewsStatus,
    error: reviewsError,
    refresh: refreshReviews,
  } = useReviews();
  const { showToast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileTab, setProfileTab] = useState<ProfileTab>('profile');
  const [panel, setPanel] = useState<ProfilePanel>('menu');
  const [filter, setFilter] = useState<ListingFilter>('active');
  const [menuListing, setMenuListing] = useState<Listing | null>(null);
  const [pendingAction, setPendingAction] = useState<ProfileActionKey | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const lastAction = useRef<LastAction | null>(null);
  const handledProfileNonce = useRef<number | null>(null);

  // Deep links (e.g. "New review received") can open the shop or My reviews.
  useEffect(() => {
    const params = route.params;
    if (!params) return;

    const nonce = params.nonce ?? null;
    if (nonce === null || handledProfileNonce.current === nonce) return;

    handledProfileNonce.current = nonce;
    if (params.panel) {
      setPanel(params.panel);
      setProfileTab('profile');
    } else if (params.tab) {
      setProfileTab(params.tab);
    }
  }, [route.params]);

  if (!user) return null;

  const myListings = listings.filter((listing) =>
    canManageListing(user, listing),
  );
  const activeListings = myListings.filter(
    (listing) => listing.status !== 'sold',
  );
  const soldListings = myListings.filter(
    (listing) => listing.status === 'sold',
  );
  const visibleListings =
    filter === 'sold'
      ? soldListings
      : filter === 'all'
        ? myListings
        : activeListings;

  const isLoading = status === 'loading' || status === 'idle';
  const hasLoadError = status === 'error';
  const showErrorBanner = Boolean(error) && listings.length > 0;
  const listingCount = isLoading ? '—' : String(myListings.length);
  const soldCount = isLoading ? '—' : String(soldListings.length);
  const reviewsFailed = reviewsStatus === 'error';
  const reviewsErrorText =
    reviewsError ?? 'Could not load your reviews. Please try again.';
  const isBusy = pendingAction !== null;
  const firstName = user.name.trim().split(/\s+/)[0] || 'Your';

  // The shop grid uses the shared ListingCard inside the 720px profile column.
  const shopColumns = Math.min(columns, 3);
  const availableWidth = width;
  const shopContentWidth =
    Math.min(availableWidth, layout.maxFormWidth) - 34;
  const shopCardWidth =
    (shopContentWidth - gridGap * (shopColumns - 1)) / shopColumns;

  async function runAction(
    key: ProfileActionKey,
    action: () => Promise<void>,
    successMessage?: string,
  ) {
    if (isBusy) return;

    lastAction.current = { key, action, successMessage };
    setPendingAction(key);
    setActionError(null);

    try {
      await action();
      if (successMessage) showToast(successMessage);
      setMenuListing(null);
    } catch (actionFailure) {
      setMenuListing(null);
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
    if (last) void runAction(last.key, last.action, last.successMessage);
  }

  function markStatus(listing: Listing, status: ListingStatus) {
    const successMessage =
      status === 'sold'
        ? 'Marked as sold'
        : status === 'reserved'
          ? 'Marked as reserved'
          : 'Marked as available';

    void runAction(
      status,
      async () => {
        await updateListingStatus(listing.id, status);
      },
      successMessage,
    );
  }

  function confirmMarkSold(listing: Listing) {
    confirmAction({
      title: 'Mark this item as sold?',
      message: 'Buyers will no longer be able to contact you about it.',
      confirmLabel: 'Mark as sold',
      onConfirm: () => markStatus(listing, 'sold'),
    });
  }

  function confirmDelete(listing: Listing) {
    const isSold = listing.status === 'sold';

    confirmAction({
      title: isSold ? 'Delete this sold listing?' : 'Delete this listing?',
      message: isSold
        ? 'This cannot be undone.'
        : 'It will disappear from the campus feed.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => {
        void runAction('delete', async () => {
          await deleteListing(listing.id);
          showToast('Listing deleted');
        });
      },
    });
  }

  function deleteAllSold() {
    const count = soldListings.length;
    if (count === 0) return;

    void runAction('deleteAll', async () => {
      await deleteListings(soldListings.map((listing) => listing.id));
      showToast(`${count} sold ${count === 1 ? 'listing' : 'listings'} deleted`);
    });
  }

  function confirmDeleteAllSold() {
    if (soldListings.length === 0) return;

    confirmAction({
      title: 'Delete all sold listings?',
      message: `This will permanently delete ${soldListings.length} sold ${
        soldListings.length === 1 ? 'listing' : 'listings'
      }. This cannot be undone.`,
      confirmLabel: 'Delete all',
      destructive: true,
      onConfirm: deleteAllSold,
    });
  }

  function editListing(listing: Listing) {
    setMenuListing(null);
    navigation.navigate('Post', { listingId: listing.id });
  }

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
    } finally {
      setIsLoggingOut(false);
    }
  }

  function confirmLogout() {
    confirmAction({
      title: 'Log out of UniSell?',
      message: 'You can sign back in with your school email anytime.',
      confirmLabel: 'Log out',
      destructive: true,
      onConfirm: () => void handleLogout(),
    });
  }

  const hero = (
    <View style={styles.hero}>
      <RoundIconButton
        icon="settings-outline"
        size={44}
        accessibilityLabel="Profile settings"
        onPress={() => navigation.navigate('Settings')}
        style={styles.heroSettings}
      />

      <View style={styles.avatarWrap}>
        <View style={styles.avatarCircle}>
          <LinearGradient
            colors={['#4A90D9', '#1F7A72']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          />
          {user.photo ? (
            <Image
              source={{ uri: user.photo }}
              contentFit="cover"
              transition={150}
              style={styles.avatarImage}
              accessibilityLabel={`${user.name}'s profile photo`}
            />
          ) : (
            <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
          )}
        </View>
        <View style={styles.avatarCheck}>
          <Ionicons name="checkmark" size={13} color={colors.white} />
        </View>
      </View>

      <Text accessibilityRole="header" style={styles.name}>
        {user.name}
      </Text>
      <Text style={styles.courseYear}>
        {user.course} · {user.yearLevel}
      </Text>
      <Text style={styles.email}>{user.email}</Text>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {reviewsFailed ? '—' : formatAverageRating(receivedReviews)}
          </Text>
          <Text style={styles.statLabel}>
            {reviewsFailed
              ? 'Reviews'
              : formatReviewCount(receivedReviews.length)}
          </Text>
        </View>
        <View style={[styles.statItem, styles.statDivider]}>
          <Text style={styles.statValue}>{soldCount}</Text>
          <Text style={styles.statLabel}>
            {soldListings.length === 1 ? 'Item sold' : 'Items sold'}
          </Text>
        </View>
        <View style={[styles.statItem, styles.statDivider]}>
          <Text style={styles.statValue}>{listingCount}</Text>
          <Text style={styles.statLabel}>Listings</Text>
        </View>
      </View>
    </View>
  );

  const menuCard = (
    <View style={styles.menuCard}>
      <MenuRow
        icon="create-outline"
        label="Edit profile"
        onPress={() => navigation.navigate('EditProfile')}
      />
      <MenuRow
        icon="grid-outline"
        label="My Listings"
        onPress={() => setPanel('listings')}
      />
      <MenuRow
        icon="storefront-outline"
        label="Seller dashboard"
        onPress={() => navigation.navigate('SellerDashboard')}
      />
      <MenuRow
        icon="heart-outline"
        label="Saved"
        onPress={() => navigation.navigate('Favorites')}
      />
      <MenuRow
        icon="star-outline"
        label="My reviews"
        onPress={() => setPanel('reviews')}
      />
      <MenuRow
        icon="notifications-outline"
        label="Notifications"
        onPress={() => navigation.navigate('Notifications')}
      />
      <MenuRow
        icon="settings-outline"
        label="Settings"
        onPress={() => navigation.navigate('Settings')}
      />
      <MenuRow
        icon="log-out-outline"
        label="Log out"
        onPress={confirmLogout}
      />

      <View style={styles.verifiedNote}>
        <View style={styles.verifiedCheck}>
          <Ionicons name="checkmark" size={18} color={colors.onSuccess} />
        </View>
        <View style={styles.verifiedText}>
          <Text style={styles.verifiedTitle}>Verified DOrSU student</Text>
          <Text style={styles.verifiedBody}>
            School email and student ID confirmed
          </Text>
        </View>
      </View>
    </View>
  );

  const appearanceCard = (
    <View style={styles.appearanceCard}>
      <View style={styles.appearanceHeader}>
        <View style={styles.appearanceIcon}>
          <Ionicons name="contrast-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.appearanceText}>
          <Text style={styles.appearanceTitle}>Appearance</Text>
          <Text style={styles.appearanceHint}>
            Follow your device or pick a theme.
          </Text>
        </View>
      </View>
      <ThemeSwitch />
    </View>
  );

  const listingsPanel = (
    <View style={styles.panel}>
      <View style={styles.panelTopBar}>
        <RoundIconButton
          icon="arrow-back"
          size={44}
          accessibilityLabel="Back to profile"
          onPress={() => setPanel('menu')}
        />
        <View style={styles.panelTitleBlock}>
          <Text accessibilityRole="header" style={styles.panelTitle}>
            My listings
          </Text>
          <Text style={styles.panelSubtitle}>
            {isLoading
              ? 'Loading your posts…'
              : myListings.length === 0
                ? 'Items you post will appear here.'
                : `${activeListings.length} active · ${soldListings.length} sold`}
          </Text>
        </View>
        {!isLoading && myListings.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Post new listing"
            onPress={() => navigation.navigate('Post')}
            style={({ pressed }) => [
              styles.postNew,
              pressed && styles.pressed,
            ]}
            hitSlop={8}
          >
            <Ionicons
              name="add-circle-outline"
              size={17}
              color={colors.primary}
            />
            <Text style={styles.postNewText}>Post new</Text>
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.sectionState}>
          <ActivityIndicator
            size="small"
            color={colors.primary}
            accessibilityLabel="Loading your listings"
          />
          <Text style={styles.sectionStateText}>Loading your listings…</Text>
        </View>
      ) : hasLoadError ? (
        <View style={styles.sectionState}>
          <Ionicons
            name="cloud-offline-outline"
            size={26}
            color={colors.danger}
          />
          <Text style={styles.sectionStateTitle}>
            Could not load your listings
          </Text>
          <Text style={styles.sectionStateText}>
            {error ?? 'Check the mock API and try again.'}
          </Text>
          <AppButton
            label="Try again"
            variant="secondary"
            onPress={() => void refresh()}
            style={styles.sectionStateAction}
          />
        </View>
      ) : myListings.length === 0 ? (
        <View style={styles.sectionState}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="storefront-outline"
              size={30}
              color={colors.primary}
            />
          </View>
          <Text style={styles.sectionStateTitle}>No listings yet</Text>
          <Text style={styles.sectionStateText}>
            Turn a textbook, uniform or gadget you no longer use into another
            student's next find.
          </Text>
          <AppButton
            label="Post your first item"
            icon="add"
            variant="accent"
            onPress={() => navigation.navigate('Post')}
            style={styles.sectionStateAction}
          />
        </View>
      ) : (
        <>
          <View
            accessibilityRole="tablist"
            accessibilityLabel="Filter my listings"
            style={styles.filterBar}
          >
            <FilterSegment
              label="Active"
              count={activeListings.length}
              active={filter === 'active'}
              onPress={() => setFilter('active')}
            />
            <FilterSegment
              label="Sold"
              count={soldListings.length}
              active={filter === 'sold'}
              onPress={() => setFilter('sold')}
            />
            <FilterSegment
              label="All"
              count={myListings.length}
              active={filter === 'all'}
              onPress={() => setFilter('all')}
            />
          </View>

          {actionError ? (
            <ErrorBanner
              message={actionError}
              onRetry={lastAction.current ? retryLastAction : undefined}
            />
          ) : null}

          {filter === 'sold' && soldListings.length > 0 ? (
            <View style={styles.deleteAllRow}>
              <View style={styles.deleteAllText}>
                <Text style={styles.deleteAllTitle}>
                  Sold listings stay out of the feed
                </Text>
                <Text style={styles.deleteAllBody}>
                  Delete them when you no longer need the record.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete all ${soldListings.length} sold listings`}
                disabled={isBusy}
                onPress={confirmDeleteAllSold}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.deleteAllButton,
                  pressed && styles.pressed,
                  isBusy && styles.rowActionDisabled,
                ]}
              >
                {pendingAction === 'deleteAll' ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.danger}
                    accessibilityLabel="Deleting sold listings"
                  />
                ) : (
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={colors.danger}
                  />
                )}
                <Text style={styles.deleteAllButtonText}>
                  Delete all sold listings ({soldListings.length})
                </Text>
              </Pressable>
            </View>
          ) : null}

          {visibleListings.length === 0 ? (
            <View style={styles.sectionState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={
                    filter === 'sold'
                      ? 'checkmark-done-outline'
                      : 'storefront-outline'
                  }
                  size={30}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.sectionStateTitle}>
                {filter === 'sold' ? 'No sold listings' : 'No active listings'}
              </Text>
              <Text style={styles.sectionStateText}>
                {filter === 'sold'
                  ? 'Items you mark as sold will appear here.'
                  : 'Mark a listing as available to see it here again.'}
              </Text>
            </View>
          ) : (
            <View style={styles.listings}>
              {visibleListings.map((listing) => (
                <MyListingRow
                  key={listing.id}
                  listing={listing}
                  busy={isBusy}
                  showDelete={listing.status === 'sold'}
                  onPress={() =>
                    navigation.navigate('ListingDetails', {
                      listingId: listing.id,
                    })
                  }
                  onMore={() => setMenuListing(listing)}
                  onDelete={() => confirmDelete(listing)}
                />
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );

  const reviewsPanel = (
    <View style={styles.panel}>
      <View style={styles.panelTopBar}>
        <RoundIconButton
          icon="arrow-back"
          size={44}
          accessibilityLabel="Back to profile"
          onPress={() => setPanel('menu')}
        />
        <View style={styles.panelTitleBlock}>
          <Text accessibilityRole="header" style={styles.panelTitle}>
            My reviews
          </Text>
          <Text style={styles.panelSubtitle}>
            Reviews you submitted after completed sales
          </Text>
        </View>
        <View style={styles.reviewCountPill}>
          <Text style={styles.reviewCountText}>{submittedReviews.length}</Text>
        </View>
      </View>

      {reviewsFailed ? (
        <ErrorBanner
          message={reviewsErrorText}
          onRetry={() => {
            void refreshReviews();
          }}
        />
      ) : null}

      {submittedReviews.length === 0 ? (
        <View style={styles.sectionState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="star-outline" size={30} color={colors.primary} />
          </View>
          <Text style={styles.sectionStateTitle}>
            {reviewsFailed ? 'Reviews unavailable' : 'No reviews yet'}
          </Text>
          <Text style={styles.sectionStateText}>
            {reviewsFailed
              ? 'Your reviews could not be loaded. Try again above.'
              : 'You have not reviewed a completed sale yet.'}
          </Text>
        </View>
      ) : (
        <View style={styles.reviewsList}>
          {submittedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              mode="submitted"
              listingTitle={
                listings.find((item) => item.id === review.listingId)?.title
              }
            />
          ))}
        </View>
      )}
    </View>
  );

  const sellerShop = (
    <View style={styles.shop}>
      <View style={styles.shopHeading}>
        <View style={styles.shopHeadingText}>
          <Text accessibilityRole="header" style={styles.shopTitle}>
            {firstName}’s active listings
          </Text>
          <Text style={styles.shopSubtitle}>
            {isLoading
              ? 'Loading your shop…'
              : `${activeListings.length} ${
                  activeListings.length === 1 ? 'item' : 'items'
                } available`}
          </Text>
        </View>
        <Text style={styles.shopRating}>
          {reviewsFailed
            ? '★ —'
            : `★ ${formatAverageRating(receivedReviews)} · ${receivedReviews.length}`}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open seller dashboard to manage requests"
        onPress={() => navigation.navigate('SellerDashboard')}
        style={({ pressed }) => [
          styles.shopManage,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="clipboard-outline" size={16} color={colors.primary} />
        <Text style={styles.shopManageText}>Manage requests</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.primary} />
      </Pressable>

      {isLoading ? (
        <View style={styles.sectionState}>
          <ActivityIndicator
            size="small"
            color={colors.primary}
            accessibilityLabel="Loading your shop"
          />
          <Text style={styles.sectionStateText}>Loading your shop…</Text>
        </View>
      ) : hasLoadError ? (
        <View style={styles.sectionState}>
          <Ionicons
            name="cloud-offline-outline"
            size={26}
            color={colors.danger}
          />
          <Text style={styles.sectionStateTitle}>Could not load your shop</Text>
          <Text style={styles.sectionStateText}>
            {error ?? 'Check the mock API and try again.'}
          </Text>
          <AppButton
            label="Try again"
            variant="secondary"
            onPress={() => void refresh()}
            style={styles.sectionStateAction}
          />
        </View>
      ) : activeListings.length === 0 ? (
        <View style={styles.sectionState}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="storefront-outline"
              size={30}
              color={colors.primary}
            />
          </View>
          <Text style={styles.sectionStateTitle}>No active listings</Text>
          <Text style={styles.sectionStateText}>
            Items you post will appear in your shop.
          </Text>
          <AppButton
            label="Post an item"
            icon="add"
            variant="accent"
            onPress={() => navigation.navigate('Post')}
            style={styles.sectionStateAction}
          />
        </View>
      ) : (
        <View style={[styles.shopGrid, { gap: gridGap }]}>
          {activeListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isFavorite={favorites.includes(listing.id)}
              showFavorite={false}
              onToggleFavorite={() => toggleFavorite(listing.id)}
              onPress={() =>
                navigation.navigate('ListingDetails', {
                  listingId: listing.id,
                })
              }
              style={{ width: shopCardWidth }}
            />
          ))}
        </View>
      )}

      <Text style={styles.reviewsTitle}>Recent reviews</Text>
      {reviewsFailed ? (
        <ErrorBanner
          message={reviewsErrorText}
          onRetry={() => {
            void refreshReviews();
          }}
        />
      ) : null}
      {receivedReviews.length === 0 ? (
        <View style={styles.reviewsEmpty}>
          <Text style={styles.reviewsEmptyText}>
            {reviewsFailed ? 'Reviews unavailable.' : 'No reviews yet.'}
          </Text>
        </View>
      ) : (
        <View style={styles.reviewsList}>
          {receivedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              mode="received"
              listingTitle={
                listings.find((item) => item.id === review.listingId)?.title
              }
            />
          ))}
        </View>
      )}
    </View>
  );

  return (
    <FadeInView slideUp={12} delay={50} style={{ flex: 1 }}>
      <ScreenContainer
        scroll
        padded={false}
        bottomInset={isMobile ? tabBarBottomInset : 0}
        maxWidth={layout.maxFormWidth}
      >
        <View style={styles.page}>
        {source === 'fallback' || showErrorBanner ? (
          <View style={styles.bannerWrap}>
            {source === 'fallback' ? <OfflineBanner /> : null}
            {showErrorBanner ? <ErrorBanner message={error} /> : null}
          </View>
        ) : null}

        {hero}

        <SegmentedControl
          options={PROFILE_TABS}
          value={profileTab}
          onChange={setProfileTab}
          accessibilityLabel="Profile view"
          style={styles.tabs}
        />

        {profileTab === 'shop'
          ? sellerShop
          : panel === 'listings'
            ? listingsPanel
            : panel === 'reviews'
              ? reviewsPanel
              : (
                  <>
                    {menuCard}
                    {appearanceCard}
                  </>
                )}

        <ListingActionsSheet
          listing={menuListing}
          visible={menuListing !== null}
          busy={pendingAction !== null}
          onClose={() => setMenuListing(null)}
          onMarkSold={() => {
            const target = menuListing;
            setMenuListing(null);
            if (target) confirmMarkSold(target);
          }}
          onMarkReserved={() => {
            if (menuListing) markStatus(menuListing, 'reserved');
          }}
          onMarkAvailable={() => {
            if (menuListing) markStatus(menuListing, 'available');
          }}
          onEdit={() => {
            if (menuListing) editListing(menuListing);
          }}
          onDelete={() => {
            const target = menuListing;
            setMenuListing(null);
            if (target) confirmDelete(target);
          }}
        />
      </View>
    </ScreenContainer>
    </FadeInView>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  page: {
    width: '100%',
    paddingBottom: spacing.xxxl,
  },
  bannerWrap: {
    gap: spacing.sm,
    paddingHorizontal: 17,
    paddingTop: spacing.sm,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 19,
    position: 'relative',
  },
  heroSettings: {
    position: 'absolute',
    top: 20,
    right: 18,
  },
  avatarWrap: {
    width: 82,
    height: 82,
    position: 'relative',
  },
  avatarCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    backgroundColor: '#1F7A72',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  avatarGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 21,
    lineHeight: 26,
    color: colors.white,
  },
  avatarCheck: {
    position: 'absolute',
    bottom: 1,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.background,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: 11,
    marginBottom: 2,
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
    textAlign: 'center',
  },
  courseYear: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  email: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 17,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  statDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.text,
  },
  statLabel: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  tabs: {
    marginHorizontal: 17,
    marginBottom: 13,
  },
  menuCard: {
    marginHorizontal: 17,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: 13,
    paddingVertical: 7,
    ...shadows.card,
  },
  menuRow: {
    minHeight: 53,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  menuIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  verifiedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingTop: 13,
    paddingBottom: 7,
  },
  verifiedCheck: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    flex: 1,
  },
  verifiedTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  verifiedBody: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  appearanceCard: {
    gap: spacing.md,
    marginHorizontal: 17,
    marginTop: 13,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: 14,
    ...shadows.card,
  },
  appearanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  appearanceIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appearanceText: {
    flex: 1,
  },
  appearanceTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  appearanceHint: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
  panel: {
    paddingHorizontal: 17,
  },
  panelTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  panelTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  panelTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  panelSubtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  shop: {
    paddingHorizontal: 17,
  },
  shopHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: 10,
  },
  shopHeadingText: {
    flex: 1,
    minWidth: 0,
  },
  shopTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  shopSubtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  shopRating: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.primary,
  },
  shopManage: {
    alignSelf: 'flex-start',
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.chip,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  shopManageText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.primary,
  },
  shopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reviewsTitle: {
    marginTop: 17,
    marginBottom: 8,
    marginHorizontal: 2,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  reviewsEmpty: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: 14,
  },
  reviewsEmptyText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  reviewsList: {
    gap: spacing.sm,
  },
  reviewCard: {
    flexDirection: 'row',
    gap: 9,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: 11,
  },
  reviewAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.verified,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  reviewAvatarText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.onPrimary,
  },
  reviewBody: {
    flex: 1,
    minWidth: 0,
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  reviewName: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  reviewStars: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.rating,
  },
  reviewListing: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.primary,
  },
  reviewComment: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  reviewDate: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  reviewCountPill: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  reviewCountText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.primary,
  },
  postNew: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
  },
  postNewText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.primary,
  },
  listings: {
    gap: spacing.sm,
  },
  filterBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: spacing.md,
  },
  filterSegment: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
  },
  filterSegmentActive: {
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  filterSegmentText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  filterSegmentTextActive: {
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
  filterCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
    paddingHorizontal: 5,
  },
  filterCountActive: {
    backgroundColor: colors.primaryLight,
  },
  filterCountText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs - 1,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
  filterCountTextActive: {
    color: colors.primary,
  },
  deleteAllRow: {
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.dangerSoft,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  deleteAllText: {
    gap: 2,
  },
  deleteAllTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  deleteAllBody: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
  deleteAllButton: {
    minHeight: 40,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  deleteAllButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.danger,
  },
  pressed: {
    opacity: 0.75,
  },
  listingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  listingRowMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  listingRowPressed: {
    opacity: 0.84,
  },
  listingActions: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  rowActionDanger: {
    backgroundColor: colors.dangerSoft,
  },
  rowActionDisabled: {
    opacity: 0.45,
  },
  thumbnail: {
    width: 62,
    height: 62,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingInfo: {
    flex: 1,
    minWidth: 0,
  },
  listingTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  listingMeta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
  listingBottomRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  listingPrice: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.primary,
  },
  statusPill: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs - 1,
    lineHeight: lineHeights.xs,
  },
  listingDate: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs - 1,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
  sectionState: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  sectionStateTitle: {
    marginTop: spacing.sm,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.text,
    textAlign: 'center',
  },
  sectionStateText: {
    marginTop: spacing.xs,
    maxWidth: 320,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  sectionStateAction: {
    marginTop: spacing.lg,
    minWidth: 200,
  },
  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
