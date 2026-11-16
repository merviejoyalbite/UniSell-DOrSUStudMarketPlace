import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';

/**
 * Device persistence helpers.
 *
 * AsyncStorage is an asynchronous key-value store. We only persist the safe
 * user object (never the password) so the session can be restored on launch.
 */

const SESSION_KEY = 'unisell.session';
const FAVORITES_KEY = 'unisell.favorites';
const THEME_KEY = 'unisell.themeMode';

/** User preference for the colour scheme. `system` follows the device. */
export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_MODES: readonly ThemeMode[] = ['system', 'light', 'dark'];

export async function saveSession(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch (error) {
    // A failed write should not block the login itself.
    console.warn('UniSell: could not save the session.', error);
  }
}

export async function loadSession(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const user = JSON.parse(raw) as User;
    // Basic shape check: ignore corrupted or outdated values.
    if (!user || typeof user.id !== 'number' || !user.email) return null;
    return user;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.warn('UniSell: could not clear the session.', error);
  }
}

/**
 * Saved listing ids.
 *
 * Favorites are stored on the device, not on the mock server. They survive
 * app restarts and are shared by accounts on the same device (an acceptable
 * MVP simplification; Phase 5 could namespace the key by user id).
 */
export async function loadFavorites(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (id): id is number => typeof id === 'number' && Number.isFinite(id),
    );
  } catch {
    return [];
  }
}

export async function saveFavorites(favorites: number[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.warn('UniSell: could not save favorites.', error);
  }
}

/**
 * Theme preference.
 *
 * Returns `null` when nothing has been stored yet (or the stored value is not
 * one of the three supported modes), which lets the provider fall back to
 * "system" without treating a corrupt value as a real preference.
 */
export async function loadThemeMode(): Promise<ThemeMode | null> {
  try {
    const raw = await AsyncStorage.getItem(THEME_KEY);
    if (!raw) return null;
    return THEME_MODES.includes(raw as ThemeMode) ? (raw as ThemeMode) : null;
  } catch {
    return null;
  }
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_KEY, mode);
  } catch (error) {
    console.warn('UniSell: could not save the theme preference.', error);
  }
}
