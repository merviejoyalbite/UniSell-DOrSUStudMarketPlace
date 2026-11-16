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
  acceptReservation as acceptReservationRequest,
  cancelReservation as cancelReservationRequest,
  createReservation as createReservationRequest,
  declineReservation as declineReservationRequest,
  getReservationsForUser,
} from '../api/reservationsApi';
import type {
  NewReservationInput,
  Reservation,
  ReservationsState,
} from '../types';
import { useAuth } from './AuthContext';
import { useListings } from './ListingsContext';

/**
 * ReservationsContext owns the signed-in student's reserve requests:
 *   - requests they sent as a buyer;
 *   - requests on the listings they sell.
 *
 * The buyer reserve flow and the seller dashboard read the same list, so an
 * accepted request immediately updates the listing status everywhere. Screens
 * never call the API directly.
 */

type ReservationsAction =
  | { type: 'LOAD_START' }
  | { type: 'REFRESH_START' }
  | { type: 'LOAD_SUCCESS'; reservations: Reservation[] }
  | { type: 'LOAD_ERROR'; message: string }
  | { type: 'ADD_RESERVATION'; reservation: Reservation }
  | { type: 'UPDATE_RESERVATION'; reservation: Reservation }
  | { type: 'RESET' };

const initialState: ReservationsState = {
  reservations: [],
  status: 'idle',
  error: null,
  refreshing: false,
};

function reservationsReducer(
  state: ReservationsState,
  action: ReservationsAction,
): ReservationsState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, status: 'loading', error: null, refreshing: false };
    case 'REFRESH_START':
      // Keep existing cards visible while the silent reload runs.
      return { ...state, refreshing: true, error: null };
    case 'LOAD_SUCCESS':
      return {
        ...state,
        reservations: action.reservations,
        status: 'ready',
        error: null,
        refreshing: false,
      };
    case 'LOAD_ERROR':
      return {
        ...state,
        status: state.reservations.length > 0 ? 'ready' : 'error',
        error: action.message,
        refreshing: false,
      };
    case 'ADD_RESERVATION':
      return {
        ...state,
        reservations: [
          action.reservation,
          ...state.reservations.filter(
            (reservation) => reservation.id !== action.reservation.id,
          ),
        ],
      };
    case 'UPDATE_RESERVATION':
      return {
        ...state,
        reservations: state.reservations.map((reservation) =>
          reservation.id === action.reservation.id
            ? action.reservation
            : reservation,
        ),
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface ReservationsContextValue extends ReservationsState {
  /** Reload the buyer + seller request lists. */
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  /** POST a pending request for a listing the student does not own. */
  createReservation: (
    listingId: number,
    input: NewReservationInput,
  ) => Promise<Reservation>;
  /** Seller-only: accept a pending request and mark the listing reserved. */
  acceptReservation: (id: number) => Promise<Reservation>;
  /** Seller-only: decline a pending request. */
  declineReservation: (id: number) => Promise<Reservation>;
  /** Buyer-only: cancel their own pending request. */
  cancelReservation: (id: number) => Promise<Reservation>;
}

const ReservationsContext = createContext<ReservationsContextValue | undefined>(
  undefined,
);

export function ReservationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { refresh: refreshListings } = useListings();
  const [state, dispatch] = useReducer(reservationsReducer, initialState);
  const userId = user?.id;

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!userId) {
        dispatch({ type: 'RESET' });
        return;
      }

      dispatch({ type: options?.silent ? 'REFRESH_START' : 'LOAD_START' });

      try {
        const reservations = await getReservationsForUser();
        dispatch({ type: 'LOAD_SUCCESS', reservations });
      } catch (error) {
        dispatch({
          type: 'LOAD_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Could not load your reserve requests.',
        });
      }
    },
    [userId],
  );

  // Load when a student signs in, clear when they sign out. The provider sits
  // above the navigator, so this is the only place that needs to react to auth.
  useEffect(() => {
    if (!userId) {
      dispatch({ type: 'RESET' });
      return;
    }

    void refresh();
  }, [userId, refresh]);

  const createReservation = useCallback(
    async (listingId: number, input: NewReservationInput) => {
      const reservation = await createReservationRequest(listingId, input);

      // Show the pending card immediately, then reconcile with the server.
      dispatch({ type: 'ADD_RESERVATION', reservation });
      await refresh({ silent: true }).catch(() => undefined);

      return reservation;
    },
    [refresh],
  );

  const acceptReservation = useCallback(
    async (id: number) => {
      const reservation = await acceptReservationRequest(id);

      dispatch({ type: 'UPDATE_RESERVATION', reservation });
      // Accepting holds the item, so every listing surface must switch to the
      // Reserved chip without waiting for a manual refresh.
      await refreshListings({ silent: true }).catch(() => undefined);
      await refresh({ silent: true }).catch(() => undefined);

      return reservation;
    },
    [refresh, refreshListings],
  );

  const declineReservation = useCallback(
    async (id: number) => {
      const reservation = await declineReservationRequest(id);

      dispatch({ type: 'UPDATE_RESERVATION', reservation });
      await refresh({ silent: true }).catch(() => undefined);

      return reservation;
    },
    [refresh],
  );

  const cancelReservation = useCallback(
    async (id: number) => {
      const reservation = await cancelReservationRequest(id);

      dispatch({ type: 'UPDATE_RESERVATION', reservation });
      await refresh({ silent: true }).catch(() => undefined);

      return reservation;
    },
    [refresh],
  );

  const value = useMemo<ReservationsContextValue>(
    () => ({
      ...state,
      refresh,
      createReservation,
      acceptReservation,
      declineReservation,
      cancelReservation,
    }),
    [
      state,
      refresh,
      createReservation,
      acceptReservation,
      declineReservation,
      cancelReservation,
    ],
  );

  return (
    <ReservationsContext.Provider value={value}>
      {children}
    </ReservationsContext.Provider>
  );
}

export function useReservations(): ReservationsContextValue {
  const context = useContext(ReservationsContext);
  if (!context) {
    throw new Error(
      'useReservations must be used inside <ReservationsProvider>.',
    );
  }
  return context;
}
