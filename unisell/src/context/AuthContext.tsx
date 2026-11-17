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
  changePassword as changePasswordRequest,
  loginWithEmail,
  signUpWithEmail,
  updateProfile as updateProfileRequest,
  type SignUpInput,
} from '../api/authApi';
import type {
  AuthState,
  PasswordChangeInput,
  ProfileUpdateInput,
  User,
} from '../types';
import { NOT_SIGNED_IN_ERROR } from '../utils/permissions';
import { clearSession, loadSession, saveSession } from '../utils/storage';

/**
 * AuthContext owns the signed-in student and the restored session.
 *
 * Flow:
 *   App start -> status "loading" -> loadSession()
 *     session found -> status "signedIn"
 *     no session    -> status "signedOut"
 *   Login / Sign Up -> authApi -> saveSession() -> status "signedIn"
 *   Log out -> clearSession() -> status "signedOut"
 */

type AuthAction =
  | { type: 'RESTORE_SESSION'; user: User | null }
  | { type: 'AUTH_SUCCESS'; user: User; remembered?: boolean }
  | { type: 'AUTH_ERROR'; message: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SIGN_OUT' };

const initialState: AuthState = {
  user: null,
  status: 'loading',
  error: null,
  remembered: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_SESSION':
      return {
        user: action.user,
        status: action.user ? 'signedIn' : 'signedOut',
        error: null,
        remembered: Boolean(action.user),
      };
    case 'AUTH_SUCCESS':
      return {
        user: action.user,
        status: 'signedIn',
        error: null,
        remembered: action.remembered ?? false,
      };
    case 'AUTH_ERROR':
      return { ...state, error: action.message };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SIGN_OUT':
      return { user: null, status: 'signedOut', error: null, remembered: false };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  /** PATCH the signed-in user and persist the updated session. */
  updateProfile: (input: ProfileUpdateInput) => Promise<User>;
  /** Optional password change; prototype mock API uses plain text. */
  changePassword: (input: PasswordChangeInput) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore the saved session once, when the provider mounts.
  useEffect(() => {
    let isMounted = true;

    (async () => {
      const user = await loadSession();
      if (isMounted) {
        dispatch({ type: 'RESTORE_SESSION', user });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string, remember = false) => {
    dispatch({ type: 'CLEAR_ERROR' });
    try {
      const user = await loginWithEmail(email, password);
      if (remember) {
        await saveSession(user);
      } else {
        await clearSession();
      }
      dispatch({ type: 'AUTH_SUCCESS', user, remembered: remember });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Login failed. Please try again.';
      dispatch({ type: 'AUTH_ERROR', message });
      throw error;
    }
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    dispatch({ type: 'CLEAR_ERROR' });
    try {
      const user = await signUpWithEmail(input);
      await saveSession(user);
      dispatch({ type: 'AUTH_SUCCESS', user });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not create the account.';
      dispatch({ type: 'AUTH_ERROR', message });
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    dispatch({ type: 'SIGN_OUT' });
  }, []);

  const updateProfile = useCallback(
    async (input: ProfileUpdateInput) => {
      const currentUser = state.user;
      if (!currentUser) throw new Error(NOT_SIGNED_IN_ERROR);

      const updated = await updateProfileRequest(currentUser.id, input);
      if (state.remembered) {
        await saveSession(updated);
      }
      dispatch({ type: 'AUTH_SUCCESS', user: updated, remembered: state.remembered });
      return updated;
    },
    [state.user],
  );

  const changePassword = useCallback(
    async (input: PasswordChangeInput) => {
      const currentUser = state.user;
      if (!currentUser) throw new Error(NOT_SIGNED_IN_ERROR);

      await changePasswordRequest(currentUser.id, input);
    },
    [state.user],
  );

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn,
      signUp,
      signOut,
      updateProfile,
      changePassword,
      clearError,
    }),
    [state, signIn, signUp, signOut, updateProfile, changePassword, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return context;
}
