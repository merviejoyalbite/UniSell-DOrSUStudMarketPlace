import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { ErrorState } from '../components/ErrorState';
import { ListingCard } from '../components/ListingCard';
import { LoadingState } from '../components/LoadingState';
import { OfflineBanner } from '../components/OfflineBanner';
import { RoundIconButton } from '../components/RoundIconButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SearchFiltersSheet } from '../components/SearchFiltersSheet';
import { SearchPill } from '../components/SearchPill';
import { useListings } from '../context/ListingsContext';
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
import type { CategoryFilter, ConditionFilter } from '../utils/listings';
import { filterListings } from '../utils/listings';

/**
 * Search and filter.
 *
 * Restyled in Phase 2 to the Figma search frame: a compact header with a back
 * button, an editable search pill and a filter trigger, then a "Search results"
 * heading with the live count. The category, condition and sold filters live in
 * the bottom filter sheet, matching Figma.
 *
 * Filtering is still done in memory with `filterListings()`, a pure function in
 * src/utils/listings.ts. With only 18 demo listings this is instant and avoids
 * extra requests for every keystroke. The adaptive 1–4 column card grid is
 * kept from the rest of the app.
 */
export function SearchScreen({ navigation }: MainTabScreenProps<'Search'>) {
  const tabBarBottomInset = useTabBarBottomInset();
  const { colors } = useTheme();
  const styles = useStyles();
  const { columns, gridGap, pagePadding, width, isMobile } = useBreakpoint();
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

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('All');
  const [condition, setCondition] = useState<ConditionFilter>('All');
  const [showSold, setShowSold] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const results = useMemo(
    () =>
      filterListings(listings, {
        query,
        category,
        condition,
        includeSold: showSold,
      }),
    [listings, query, category, condition, showSold],
  );

  const activeFilterCount =
    (category === 'All' ? 0 : 1) +
    (condition === 'All' ? 0 : 1) +
    (showSold ? 1 : 0);
  const hasFilters = query.trim().length > 0 || activeFilterCount > 0;
  const isLoading = status === 'loading' || status === 'idle';
  const showErrorBanner = Boolean(error) && listings.length > 0;

  const resultLabel = `${results.length} ${
    results.length === 1 ? 'campus find' : 'campus finds'
  } for “${query.trim() || 'all'}”`;

  function resetFilters() {
    setCategory('All');
    setCondition('All');
    setShowSold(false);
  }

  function clearAll() {
    setQuery('');
    resetFilters();
  }

  const header = (
    <View>
      <View style={styles.searchHeader}>
        <RoundIconButton
          icon="arrow-back"
          size={44}
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
        />
        <SearchPill
          placeholder="Search campus finds..."
          accessibilityLabel="Search listings"
          value={query}
          onChangeText={setQuery}
          autoFocus
          style={styles.searchPill}
        />
        <RoundIconButton
          icon="funnel-outline"
          size={44}
          accessibilityLabel="Open filters"
          dot={activeFilterCount > 0}
          onPress={() => setFiltersOpen(true)}
        />
      </View>

      {source === 'fallback' ? <OfflineBanner /> : null}
      {showErrorBanner ? <ErrorBanner message={error} /> : null}

      <View style={styles.resultsHeading}>
        <View style={styles.resultsHeadingText}>
          <Text accessibilityRole="header" style={styles.title}>
            Search results
          </Text>
          <Text
            style={styles.resultText}
            accessibilityLiveRegion="polite"
            accessibilityLabel={`${results.length} ${
              results.length === 1 ? 'campus find' : 'campus finds'
            }${query.trim() ? ` for ${query.trim()}` : ''}`}
          >
            {resultLabel}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          onPress={() => setFiltersOpen(true)}
          style={({ pressed }) => [
            styles.filtersButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.filtersText}>
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const empty = isLoading ? (
    <LoadingState />
  ) : status === 'error' && listings.length === 0 ? (
    <ErrorState message={error} onRetry={() => void refresh()} />
  ) : listings.length === 0 ? (
    <EmptyState
      icon="storefront-outline"
      title="No listings yet"
      message="Be the first to post a campus item."
      actionLabel="Post an item"
      onAction={() => navigation.navigate('Post')}
    />
  ) : (
    <EmptyState
      icon="search-outline"
      title="No matches"
      message="No listings match these filters. Try resetting them."
      actionLabel={hasFilters ? 'Clear filters' : undefined}
      onAction={hasFilters ? clearAll : undefined}
    />
  );

  return (
    <ScreenContainer padded={false}>
      <FlatList
        key={`search-${columns}-${query}-${category}-${condition}-${showSold}`}
        data={results}
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
              { maxWidth: columns > 1 ? '50%' : '100%', marginBottom: gridGap },
            ]}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
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
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh({ silent: true })}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      <SearchFiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        category={category}
        onCategoryChange={setCategory}
        condition={condition}
        onConditionChange={setCondition}
        showSold={showSold}
        onToggleSold={() => setShowSold((current) => !current)}
        onReset={resetFilters}
        resultCount={results.length}
      />
    </ScreenContainer>
  );
}

const useStyles = createThemedStyles((colors) => ({
  content: {
    paddingTop: spacing.sm,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchPill: {
    flex: 1,
  },
  resultsHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: 2,
  },
  resultsHeadingText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  resultText: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  filtersButton: {
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  filtersText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.8,
  },
  column: {
    justifyContent: 'flex-start',
  },
  card: {
    flexGrow: 0,
    flexShrink: 0,
  },
}));
