import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform, useColorScheme, type ViewStyle } from 'react-native';
import {
  darkColors,
  darkGradients,
  lightColors,
  lightGradients,
  type ThemeColors,
  type ThemeGradients,
} from '../theme/palettes';
import { loadThemeMode, saveThemeMode, type ThemeMode } from '../utils/storage';

/**
 * Theme provider.
 *
 * Three modes are supported:
 *   system -> follow the OS / browser preference (default)
 *   light  -> always the light palette
 *   dark   -> always the dark palette
 *
 * The stored preference is read before the app tree is allowed to render, so
 * a dark-mode user never sees a flash of the light palette on startup.
 */

export type ResolvedScheme = 'light' | 'dark';

/** Elevation presets. Colours come from the active palette. */
export interface AppShadows {
  card: ViewStyle;
  panel: ViewStyle;
  floating: ViewStyle;
  button: ViewStyle;
}

function buildShadows(colors: ThemeColors, isDark: boolean): AppShadows {
  return {
    card: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.26 : 0.09,
      shadowRadius: 30,
      elevation: 4,
    },
    panel: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: isDark ? 0.3 : 0.12,
      shadowRadius: 60,
      elevation: 6,
    },
    floating: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 13 },
      shadowOpacity: isDark ? 0.5 : 0.18,
      shadowRadius: 38,
      elevation: 8,
    },
    button: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.45 : 0.22,
      shadowRadius: 24,
      elevation: 5,
    },
  };
}

interface ThemeContextValue {
  /** The stored preference (system / light / dark). */
  mode: ThemeMode;
  /** The palette actually in use after resolving "system". */
  scheme: ResolvedScheme;
  isDark: boolean;
  colors: ThemeColors;
  gradients: ThemeGradients;
  shadows: AppShadows;
  /** False until the stored preference has been read. */
  ready: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function setMetaContent(name: string, content: string) {
  if (typeof document === 'undefined') return;
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

/** Keep the browser chrome (and overscroll area) in sync with the app. */
function applyWebTheme(colors: ThemeColors, scheme: ResolvedScheme) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.backgroundColor = colors.background;
  root.style.colorScheme = scheme;
  if (document.body) {
    document.body.style.backgroundColor = colors.background;
    document.body.style.colorScheme = scheme;
  }
  setMetaContent('color-scheme', scheme);
  setMetaContent('theme-color', colors.background);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadThemeMode().then((stored) => {
      if (!active) return;
      if (stored) setModeState(stored);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const scheme: ResolvedScheme =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const gradients = isDark ? darkGradients : lightGradients;
  const shadows = useMemo(() => buildShadows(colors, isDark), [colors, isDark]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void saveThemeMode(next);
  }, []);

  useEffect(() => {
    if (ready) applyWebTheme(colors, scheme);
  }, [ready, colors, scheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, scheme, isDark, colors, gradients, shadows, ready, setMode }),
    [mode, scheme, isDark, colors, gradients, shadows, ready, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside a ThemeProvider.');
  }
  return context;
}
