import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { createReview, getReviewsForUser } from '../api/reviewsApi';
import type { NewReviewInput, Review, ReviewsState } from '../types';
import { useAuth } from './AuthContext';

/**
 * ReviewsContext owns the signed-in student's received and submitted reviews.
 *
 * The Profile stats and Seller shop read `received`; the review form and the
 * "Rate & review" entries read `submitted` to avoid opening a form twice.
 * Reviews are written through the API layer, which re-checks ownership and the
 * completed-sale rule.
 */

type ReviewsAction =
  | { type: 'LOAD_START' }
  | { type: 'REFRESH_START' }
  | { type: 'LOAD_SUCCESS'; received: Review[]; submitted: Review[] }
  | { type: 'ADD_REVIEW'; review: Review }
  | { type: 'LOAD_ERROR'; message: string }
  | { type: 'RESET' };

const initialState: ReviewsState = {
  received: [],
  submitted: [],
  status: 'idle',
  error: null,
  refreshing: false,
};

function reviewsReducer(
  state: ReviewsState,
  action: ReviewsAction,
): ReviewsState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, status: 'loading', error: null, refreshing: false };
    case 'REFRESH_START':
      return { ...state, refreshing: true, error: null };
    case 'LOAD_SUCCESS':
      return {
        ...state,
        received: action.received,
        submitted: action.submitted,
        status: 'ready',
        error: null,
        refreshing: false,
      };
    case 'ADD_REVIEW':
      return {
        ...state,
        submitted: [action.review, ...state.submitted],
      };
    case 'LOAD_ERROR':
      return {
        ...state,
        status:
          state.received.length > 0 || state.submitted.length > 0
            ? 'ready'
            : 'error',
        error: action.message,
        refreshing: false,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface ReviewsContextValue extends ReviewsState {
  /** Reload received and submitted reviews. */
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  /** Submit a review and add it to the submitted list. */
  addReview: (input: NewReviewInput) => Promise<Review>;
}

const ReviewsContext = createContext<ReviewsContextValue | undefined>(
  undefined,
);

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reviewsReducer, initialState);
  const userId = user?.id;

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!userId) {
        dispatch({ type: 'RESET' });
        return;
      }

      dispatch({ type: options?.silent ? 'REFRESH_START' : 'LOAD_START' });

      try {
        const { received, submitted } = await getReviewsForUser();
        dispatch({ type: 'LOAD_SUCCESS', received, submitted });
      } catch (error) {
        dispatch({
          type: 'LOAD_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Could not load your reviews.',
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

  const addReview = useCallback(async (input: NewReviewInput) => {
    const review = await createReview(input);
    dispatch({ type: 'ADD_REVIEW', review });
    return review;
  }, []);

  const value = useMemo<ReviewsContextValue>(
    () => ({
      ...state,
      refresh,
      addReview,
    }),
    [state, refresh, addReview],
  );

  return (
    <ReviewsContext.Provider value={value}>
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews(): ReviewsContextValue {
  const context = useContext(ReviewsContext);
  if (!context) {
    throw new Error('useReviews must be used inside <ReviewsProvider>.');
  }
  return context;
}
