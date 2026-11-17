import { useMemo } from 'react';
import {
  Alert,
  FlatList,
  Platform,
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
import { AnimatedCount, EmptyFloat } from '../components/motion';
import { useListings } from '../context/ListingsContext';
import { useToast } from '../context/ToastContext';
import { useTabBarBottomInset } from '../navigation/useTabBarBottomInset';
import type { MainTabScreenProps } from '../navigation/types';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  spacing,
  useBreakpoint,
  useTheme,
} from '../theme';

/**
 * Saved items.
 *
 * Favorites are listing ids in ListingsContext, persisted to AsyncStorage.
 * The screen maps those ids back to the current listings so a removed item
 * never leaves a broken card behind. The Figma layout adds a compact top bar
 * (back, title, notifications), an "Items you've hearted" heading with a
 * "Clear all" action, and the shared responsive listing grid.
 */
export function FavoritesScreen({ navigation }: MainTabScreenProps<'Favorites'>) {
  const tabBarBottomInset = useTabBarBottomInset();
  const { colors } = useTheme();
  const styles = useStyles();
  const { columns, gridGap, pagePadding, width, isMobile } = useBreakpoint();
  const { showToast } = useToast();
  const {
    listings,
    favorites,
    status,
    source,
    error,
    refreshing,
    refresh,
    toggleFavorite,
    clearFavorites,
  } = useListings();

  const savedListings = useMemo(
    () => listings.filter((listing) => favorites.includes(listing.id)),
    [listings, favorites],
  );

  const isLoading = status === 'loading' || status === 'idle';
  const showErrorBanner = Boolean(error) && listings.length > 0;
  const hasUnavailableFavorites =
    favorites.length > 0 && savedListings.length === 0 && status === 'ready';
  const hasFavorites = favorites.length > 0;

  const savedCount = savedListings.length;

  function handleClearAll() {
    if (!hasFavorites) return;

    const clear = () => {
      clearFavorites();
      showToast('Saved items cleared');
    };

    // `Alert` is a no-op on React Native Web, so confirm with the browser.
    if (Platform.OS === 'web') {
      const confirm = (
        globalThis as { confirm?: (message: string) => boolean }
      ).confirm;
      if (typeof confirm === 'function') {
        if (confirm('Remove all saved items?')) clear();
        return;
      }
    }

    Alert.alert(
      'Clear saved items?',
      'All saved items will be removed from this list.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear all', style: 'destructive', onPress: clear },
      ],
    );
  }

  const header = (
    <View>
      <View style={styles.topBar}>
        <RoundIconButton
          icon="arrow-back"
          size={48}
          accessibilityLabel="Go back to home"
          onPress={() => navigation.navigate('Home')}
        />
        <View style={styles.topBarText}>
          <Text accessibilityRole="header" style={styles.title}>
            Saved items
          </Text>
          <AnimatedCount
            value={savedCount}
            style={styles.subtitle}
            format={(n) => `${Math.round(n)} campus ${Math.round(n) === 1 ? 'find' : 'finds'}`}
          />
        </View>
        <RoundIconButton
          icon="ellipsis-horizontal"
          size={44}
          accessibilityLabel="Open notifications"
          onPress={() => navigation.navigate('Notifications')}
        />
      </View>

      {hasFavorites ? (
        <View style={styles.headingRow}>
          <Text style={styles.headingLabel}>Items you’ve hearted</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear all saved items"
            onPress={handleClearAll}
            hitSlop={6}
            style={({ pressed }) => [
              styles.clearButton,
              pressed && styles.clearPressed,
            ]}
          >
            <Text style={styles.clearText}>Clear all</Text>
          </Pressable>
        </View>
      ) : null}

      {source === 'fallback' ? (
        <View style={styles.bannerGap}>
          <OfflineBanner />
        </View>
      ) : null}
      {showErrorBanner ? <ErrorBanner message={error} /> : null}
    </View>
  );

  const empty = isLoading ? (
    <LoadingState message="Loading your saved items…" />
  ) : status === 'error' && listings.length === 0 ? (
    <ErrorState message={error} onRetry={() => void refresh()} />
  ) : hasUnavailableFavorites ? (
    <EmptyState
      icon="heart-dislike-outline"
      title={
        favorites.length === 1
          ? 'This listing is no longer available'
          : 'These listings are no longer available'
      }
      message="The seller may have removed them. Browse the feed for something new."
      actionLabel="Browse fresh finds"
      onAction={() => navigation.navigate('Home')}
    />
  ) : (
    <EmptyFloat>
      <EmptyState
        icon="heart-outline"
        accent={colors.favorite}
        title="Nothing saved yet."
        message="Tap the heart on any item."
        actionLabel="Browse fresh finds"
        onAction={() => navigation.navigate('Home')}
      />
    </EmptyFloat>
  );

  return (
    <ScreenContainer padded={false}>
      <FlatList
        key={`saved-${columns}`}
        data={savedListings}
        keyExtractor={(item) => String(item.id)}
        numColumns={columns}
        renderItem={({ item, index }) => (
          <ListingCard
            listing={item}
            index={index}
            isFavorite
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

const useStyles = createThemedStyles((colors) => ({
  content: {
    paddingTop: spacing.xs,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  topBarText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: 2,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  headingLabel: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  clearButton: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRadius: spacing.xs,
  },
  clearPressed: {
    opacity: 0.7,
  },
  clearText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.danger,
  },
  bannerGap: {
    marginTop: spacing.xs,
  },
  column: {
    justifyContent: 'flex-start',
  },
  card: {
    flexGrow: 0,
    flexShrink: 0,
  },
}));
