import {
  Animated,
  Easing,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  radii,
  spacing,
} from '../theme';
import { ANIM_DURATION, ANIM_EASING, useReducedMotion } from '../lib/animations';

/**
 * Small app-wide toast used after destructive actions such as deleting a
 * listing. A toast is intentionally non-blocking: the screen has already
 * navigated back or updated its counters.
 */

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_DURATION_MS = 2500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useReducedMotion();

  const [slide] = useState(new Animated.Value(20));
  const [opacity] = useState(new Animated.Value(0));

  const showToast = useCallback((nextMessage: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(nextMessage);

    if (reduced) {
      slide.setValue(0);
      opacity.setValue(1);
    } else {
      Animated.parallel([
        Animated.timing(slide, {
          toValue: 0,
          duration: ANIM_DURATION.normal,
          easing: ANIM_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: ANIM_DURATION.normal,
          easing: ANIM_EASING,
          useNativeDriver: true,
        }),
      ]).start();
    }

    timer.current = setTimeout(() => {
      if (reduced) {
        setMessage(null);
        timer.current = null;
      } else {
        Animated.parallel([
          Animated.timing(slide, {
            toValue: 20,
            duration: ANIM_DURATION.fast,
            easing: ANIM_EASING,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: ANIM_DURATION.fast,
            easing: ANIM_EASING,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setMessage(null);
          timer.current = null;
        });
      }
    }, TOAST_DURATION_MS);
  }, [slide, opacity, reduced]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.host,
            { bottom: insets.bottom + spacing.xxl },
            {
              transform: [{ translateY: slide }],
              opacity,
            },
          ]}
        >
          <View
            style={styles.toast}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.text}>{message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside <ToastProvider>.');
  }
  return context;
}

const useStyles = createThemedStyles((colors, shadows) => ({
  host: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    maxWidth: 420,
    borderRadius: radii.pill,
    backgroundColor: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.floating,
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.background,
    textAlign: 'center',
  },
}));
