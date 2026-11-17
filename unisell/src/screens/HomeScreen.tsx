import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { BrandMark } from '../components/BrandMark';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { ErrorState } from '../components/ErrorState';
import { FilterChip } from '../components/FilterChip';
import { ListingCard } from '../components/ListingCard';
import { LoadingState } from '../components/LoadingState';
import { OfflineBanner } from '../components/OfflineBanner';
import { RoundIconButton } from '../components/RoundIconButton';
import { ScreenContainer } from '../components/ScreenContainer';
import {
  AnimatedCount,
  EmptyFloat,
  FloatingShapes,
  PromoMarquee,
  ShimmerSweep,
} from '../components/motion';
import { SearchPill } from '../components/SearchPill';
import { useAuth } from '../context/AuthContext';
import { useListings } from '../context/ListingsContext';
import { useNotifications } from '../context/NotificationsContext';
import { useTabBarBottomInset } from '../navigation/useTabBarBottomInset';
import type { MainTabScreenProps } from '../navigation/types';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  radii,
  spacing,
  useBreakpoint,
  useTheme,
} from '../theme';
import { CATEGORIES, type Category } from '../types';
import { getCategoryMeta } from '../utils/categoryMeta';

type CategoryFilter = Category | 'All';

/**
 * Home feed.
 *
 * The flat list is an adaptive grid: 1 column on narrow phones, 2 from 640px,
 * 3 from 1024px and 4 from 1280px. Its header holds the greeting, search
 * shortcut, category chips and section title, so the whole page scrolls as
 * one surface.
 */
export function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const tabBarBottomInset = useTabBarBottomInset();
  const { colors } = useTheme();
  const styles = useStyles();
  const { columns, gridGap, pagePadding, width, isMobile } = useBreakpoint();
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const { unreadCount, refresh: refreshNotifications } = useNotifications();
  const {
    listings,
    favorites,
    status,
    source,
    error,
    refreshing,
    refresh,
    toggleFavorite,
  } = useListings();

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');

  // Keep the bell dot in sync when the student returns to Home after acting on
  // a request or reading notifications.
  useFocusEffect(
    useCallback(() => {
      void refreshNotifications({ silent: true });
    }, [refreshNotifications]),
  );

  // Sold items leave the marketplace feed by default; they stay in
  // Profile > My listings > Sold for the owner.
  const availableListings = useMemo(
    () => listings,
    [listings],
  );

  const visibleListings = useMemo(
    () =>
      selectedCategory === 'All'
        ? availableListings
        : availableListings.filter(
            (listing) => listing.category === selectedCategory,
          ),
    [availableListings, selectedCategory],
  );

  const firstName = user?.name.trim().split(/\s+/)[0] ?? 'there';
  const isLoading = status === 'loading' || status === 'idle';
  const showErrorBanner = Boolean(error) && listings.length > 0;

  const header = (
    <View style={styles.headerContainer}>
      <FloatingShapes
        shapes={[
          { size: 160, top: -24, left: -36, color: colors.primary, duration: 15000, driftX: 26, driftY: 18 },
          { size: 120, top: 60, left: 132, color: colors.accent, duration: 19000, driftX: -20, driftY: 12 },
        ]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220 }}
        active={isFocused}
      />
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <BrandMark size={48} radius={18} />
          <View style={styles.greetingBlock}>
            <Text style={styles.eyebrow}>Good morning,</Text>
            <Text accessibilityRole="header" style={styles.greeting}>
              Hi, {firstName}!
            </Text>
          </View>
        </View>

        <RoundIconButton
          icon="notifications-outline"
          accessibilityLabel={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : 'Notifications'
          }
          onPress={() => navigation.navigate('Notifications')}
          size={48}
          dot={unreadCount > 0}
        />
      </View>

      <SearchPill
        placeholder="Search campus finds..."
        accessibilityLabel="Search campus finds"
        onPress={() => navigation.navigate('Search')}
        style={styles.search}
      />

      <PromoMarquee
        items={[
          'Every reused item keeps money and materials on campus',
          'Verified DOrSU students only',
          'New finds posted today',
        ]}
        style={{ marginTop: spacing.xs }}
        active={isFocused}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chips, { paddingRight: pagePadding }]}
        style={styles.chipsScroll}
      >
        <FilterChip
          label="All"
          icon="grid-outline"
          active={selectedCategory === 'All'}
          onPress={() => setSelectedCategory('All')}
        />
        {CATEGORIES.map((category) => (
          <FilterChip
            key={category}
            label={category}
            category={category}
            icon={getCategoryMeta(category).icon}
            active={selectedCategory === category}
            onPress={() => setSelectedCategory(category)}
          />
        ))}
      </ScrollView>

      {source === 'fallback' ? <OfflineBanner /> : null}
      {showErrorBanner ? <ErrorBanner message={error} /> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Have something to sell? Sell as a verified DOrSU student. Start selling"
        onPress={() => navigation.navigate('Post')}
        style={({ pressed }) => [
          styles.sellerBanner,
          { position: 'relative' },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.sellerCopy}>
          <Text style={styles.sellerTitle}>Have something to sell?</Text>
          <Text style={styles.sellerSubtitle}>
            Sell as a verified DOrSU student.
          </Text>
        </View>
        <View style={styles.sellerCta}>
          <ShimmerSweep colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.32)', 'rgba(255, 255, 255, 0)']} style={{ borderRadius: radii.pill }} />
          <Text style={styles.sellerCtaText}>Start selling →</Text>
        </View>
      </Pressable>

      <View style={styles.sectionRow}>
        <View style={styles.sectionCopy}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {selectedCategory === 'All' ? 'Fresh finds' : selectedCategory}
          </Text>
          <Text style={styles.sectionMeta}>From students around campus</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="See all listings"
          onPress={() => navigation.navigate('Search')}
          style={styles.seeAll}
          hitSlop={12}
        >
          <Text style={styles.seeAllText}>See all</Text>
        </Pressable>
      </View>
    </View>
  );

  const empty = isLoading ? (
    <LoadingState />
  ) : status === 'error' ? (
    <ErrorState message={error} onRetry={() => void refresh()} />
  ) : (
    <EmptyFloat>
      <EmptyState
        icon="storefront-outline"
        title={selectedCategory === 'All' ? 'No listings yet' : 'Nothing here yet'}
        message={
          selectedCategory === 'All'
            ? 'Be the first to give a campus item a second life.'
            : `No ${selectedCategory.toLowerCase()} have been posted yet. Try another category.`
        }
        actionLabel={selectedCategory === 'All' ? 'Post an item' : 'Show all items'}
        onAction={
          selectedCategory === 'All'
            ? () => navigation.navigate('Post')
            : () => setSelectedCategory('All')
        }
      />
    </EmptyFloat>
  );

  const footer =
    visibleListings.length > 0 ? (
      <View style={styles.sdgNote}>
        <Ionicons name="leaf-outline" size={16} color={colors.primary} />
        <Text style={styles.sdgText}>
          Every reused item keeps money and materials on campus.
        </Text>
      </View>
    ) : undefined;

  return (
    <ScreenContainer padded={false}>
      <FlatList
        key={`home-${columns}-${selectedCategory}`}
        data={visibleListings}
        keyExtractor={(item) => String(item.id)}
        numColumns={columns}
        renderItem={({ item, index }) => (
          <ListingCard
            listing={item}
            index={index}
            isFavorite={favorites.includes(item.id)}
            onPress={() =>
              navigation.navigate('ListingDetails', { listingId: item.id })
            }
            onToggleFavorite={() => toggleFavorite(item.id)}
            style={[
              styles.card,
              { maxWidth: '100%', marginBottom: gridGap },
            ]}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={footer}
        columnWrapperStyle={
          columns > 1
            ? [styles.column, { gap: gridGap, paddingHorizontal: pagePadding }]
            : undefined
        }
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: pagePadding,
            paddingBottom: isMobile ? tabBarBottomInset : spacing.md,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh({ silent: true })}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </ScreenContainer>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  content: {
    paddingTop: spacing.sm,
  },
  headerContainer: {
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  greetingBlock: {
    flexShrink: 1,
  },
  eyebrow: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  greeting: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.text,
  },
  search: {
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.88,
  },
  chipsScroll: {
    marginTop: spacing.md,
  },
  chips: {
    gap: spacing.sm,
  },
  sellerBanner: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: spacing.md,
    ...shadows.card,
  },
  sellerCopy: {
    flex: 1,
    minWidth: 0,
  },
  sellerTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  sellerSubtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  sellerCta: {
    minHeight: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerCtaText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.onPrimary,
    textAlign: 'center',
  },
  sectionRow: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionCopy: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.text,
  },
  sectionMeta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
  seeAll: {
    minHeight: 44,
    justifyContent: 'center',
  },
  seeAllText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.primary,
  },
  column: {
    justifyContent: 'flex-start',
  },
  card: {
    flexGrow: 0,
    flexShrink: 0,
  },
  sdgNote: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  sdgText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.primary,
  },
}));
