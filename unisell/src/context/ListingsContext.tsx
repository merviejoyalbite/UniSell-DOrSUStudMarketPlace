import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import {
  createListing,
  deleteListing as deleteListingRequest,
  getListings,
  updateListing as updateListingRequest,
  updateListingStatus as updateListingStatusRequest,
} from '../api/listingsApi';
import type {
  Listing,
  ListingStatus,
  ListingsState,
  NewListingInput,
  UpdateListingInput,
} from '../types';
import { loadFavorites, saveFavorites } from '../utils/storage';

/**
 * ListingsContext owns the marketplace data:
 *   - the feed loaded from the mock API (or bundled fallback)
 *   - loading / refreshing / error state
 *   - saved listing ids, persisted with AsyncStorage
 *   - publishing a new listing (Phase 4)
 *
 * Screens read this context and call refresh() / toggleFavorite() /
 * publishListing(). They never fetch directly, which keeps the data flow easy
 * to explain.
 */

type ListingsAction =
  | { type: 'LOAD_START' }
  | { type: 'REFRESH_START' }
  | { type: 'LOAD_SUCCESS'; listings: ListingsState['listings']; source: ListingsState['source'] }
  | { type: 'LOAD_ERROR'; message: string }
  | { type: 'SET_FAVORITES'; favorites: number[] }
  | { type: 'TOGGLE_FAVORITE'; listingId: number }
  | { type: 'CLEAR_FAVORITES' }
  | { type: 'ADD_LISTING'; listing: Listing }
  | { type: 'UPDATE_LISTING'; listing: Listing }
  | { type: 'REMOVE_LISTINGS'; ids: number[] };

const initialState: ListingsState = {
  listings: [],
  status: 'idle',
  source: null,
  error: null,
  favorites: [],
  refreshing: false,
};

function listingsReducer(state: ListingsState, action: ListingsAction): ListingsState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, status: 'loading', error: null, refreshing: false };
    case 'REFRESH_START':
      // Keep the current cards visible while the refresh runs.
      return { ...state, refreshing: true, error: null };
    case 'LOAD_SUCCESS':
      return {
        ...state,
        listings: action.listings,
        source: action.source,
        status: 'ready',
        error: null,
        refreshing: false,
      };
    case 'LOAD_ERROR':
      return {
        ...state,
        status: state.listings.length > 0 ? 'ready' : 'error',
        error: action.message,
        refreshing: false,
      };
    case 'SET_FAVORITES':
      return {
        ...state,
        favorites: Array.from(new Set(action.favorites)),
      };
    case 'TOGGLE_FAVORITE': {
      const saved = state.favorites.includes(action.listingId);
      return {
        ...state,
        favorites: saved
          ? state.favorites.filter((id) => id !== action.listingId)
          : [...state.favorites, action.listingId],
      };
    }
    case 'CLEAR_FAVORITES':
      return { ...state, favorites: [] };
    case 'ADD_LISTING':
      // Put the new card at the top immediately. Filtering the id first makes
      // the reducer safe if the silent refresh returns the same listing.
      return {
        ...state,
        listings: [
          action.listing,
          ...state.listings.filter((listing) => listing.id !== action.listing.id),
        ],
      };
    case 'UPDATE_LISTING':
      return {
        ...state,
        listings: state.listings.map((listing) =>
          listing.id === action.listing.id ? action.listing : listing,
        ),
      };
    case 'REMOVE_LISTINGS': {
      const removed = new Set(action.ids);
      return {
        ...state,
        listings: state.listings.filter((listing) => !removed.has(listing.id)),
        // A deleted listing must also disappear from every Saved list.
        favorites: state.favorites.filter((id) => !removed.has(id)),
      };
    }
    default:
      return state;
  }
}

interface ListingsContextValue extends ListingsState {
  /** Load the feed. `silent` keeps existing cards during pull-to-refresh. */
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  toggleFavorite: (listingId: number) => void;
  /** Remove every saved id (Saved screen "Clear all"). */
  clearFavorites: () => void;
  /** POST a listing, add it to the feed, then quietly reconcile with the API. */
  publishListing: (input: NewListingInput) => Promise<Listing>;
  /** PATCH the editable fields of an owned listing. */
  updateListing: (id: number, input: UpdateListingInput) => Promise<Listing>;
  /** PATCH status/soldAt for an owned listing. */
  updateListingStatus: (
    id: number,
    status: ListingStatus,
  ) => Promise<Listing>;
  /** DELETE one owned listing and clean up the feed + Saved ids. */
  deleteListing: (id: number) => Promise<void>;
  /** DELETE several owned listings (used by “Delete all sold”). */
  deleteListings: (ids: number[]) => Promise<void>;
}

const ListingsContext = createContext<ListingsContextValue | undefined>(undefined);

export function ListingsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(listingsReducer, initialState);

  // Guards the first favorites write so an empty initial array cannot erase
  // ids that are still being read from AsyncStorage.
  const favoritesReady = useRef(false);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    dispatch({ type: options?.silent ? 'REFRESH_START' : 'LOAD_START' });

    try {
      const result = await getListings();
      dispatch({
        type: 'LOAD_SUCCESS',
        listings: result.listings,
        source: result.source,
      });
    } catch (error) {
      dispatch({
        type: 'LOAD_ERROR',
        message:
          error instanceof Error ? error.message : 'Could not load the listings.',
      });
    }
  }, []);

  // Load once when the provider mounts (it sits above the navigator).
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Restore saved ids from the device.
  useEffect(() => {
    let isMounted = true;

    (async () => {
      const favorites = await loadFavorites();
      if (!isMounted) return;
      favoritesReady.current = true;
      dispatch({ type: 'SET_FAVORITES', favorites });
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Persist every favorites change after the initial read.
  useEffect(() => {
    if (!favoritesReady.current) return;
    void saveFavorites(state.favorites);
  }, [state.favorites]);

  const toggleFavorite = useCallback((listingId: number) => {
    dispatch({ type: 'TOGGLE_FAVORITE', listingId });
  }, []);

  const clearFavorites = useCallback(() => {
    dispatch({ type: 'CLEAR_FAVORITES' });
  }, []);

  const publishListing = useCallback(
    async (input: NewListingInput) => {
      const listing = await createListing(input);

      // Update every screen first, then refetch so the feed also picks up any
      // other server changes and clears the offline source flag.
      dispatch({ type: 'ADD_LISTING', listing });
      await refresh({ silent: true });

      return listing;
    },
    [refresh],
  );

  const updateListing = useCallback(
    async (id: number, input: UpdateListingInput) => {
      const updated = await updateListingRequest(id, input);

      // Replace the card immediately so Details, Home, Search and Profile all
      // agree, then reconcile with the server.
      dispatch({ type: 'UPDATE_LISTING', listing: updated });
      await refresh({ silent: true });

      return updated;
    },
    [refresh],
  );

  const updateListingStatus = useCallback(
    async (id: number, status: ListingStatus) => {
      const updated = await updateListingStatusRequest(id, status);

      dispatch({ type: 'UPDATE_LISTING', listing: updated });
      await refresh({ silent: true });

      return updated;
    },
    [refresh],
  );

  const deleteListings = useCallback(
    async (ids: number[]) => {
      const deleted: number[] = [];
      let failure: unknown = null;

      // Delete one at a time so a partial failure still removes the listings
      // that did succeed from the UI.
      for (const id of ids) {
        try {
          await deleteListingRequest(id);
          deleted.push(id);
        } catch (error) {
          failure = error;
          break;
        }
      }

      if (deleted.length > 0) {
        dispatch({ type: 'REMOVE_LISTINGS', ids: deleted });
        // The write already succeeded; a failed refresh must not turn it into
        // an error message, so keep the local removal and try to reconcile.
        await refresh({ silent: true }).catch(() => undefined);
      }

      if (failure) throw failure;
    },
    [refresh],
  );

  const deleteListing = useCallback(
    async (id: number) => {
      await deleteListings([id]);
    },
    [deleteListings],
  );

  const value = useMemo<ListingsContextValue>(
    () => ({
      ...state,
      refresh,
      toggleFavorite,
      clearFavorites,
      publishListing,
      updateListing,
      updateListingStatus,
      deleteListing,
      deleteListings,
    }),
    [
      state,
      refresh,
      toggleFavorite,
      clearFavorites,
      publishListing,
      updateListing,
      updateListingStatus,
      deleteListing,
      deleteListings,
    ],
  );

  return <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>;
}

export function useListings(): ListingsContextValue {
  const context = useContext(ListingsContext);
  if (!context) {
    throw new Error('useListings must be used inside <ListingsProvider>.');
  }
  return context;
}
