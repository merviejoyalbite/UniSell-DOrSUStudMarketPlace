import {
  Easing,
  Animated,
  AccessibilityInfo,
  Platform,
  Pressable,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { useTheme } from '../theme';
import { createThemedStyles } from '../theme';

/** Shared animation duration constants (ms). */
export const ANIM_DURATION = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

/** Shared easing curve: fast-out, slow-in cubic. */
export const ANIM_EASING = Easing.out(Easing.cubic);

/** Spring config for the heart pop animation. */
export const HEART_POP_SPRING = {
  damping: 18,
  stiffness: 320,
  mass: 0.9,
};

/** Web-only matchMedia check for prefers-reduced-motion. */
async function matchMediaReducedMotion(): Promise<boolean> {
  if (typeof matchMedia === 'undefined') return false;
  return new Promise((resolve) => {
    const mql = matchMedia('(prefers-reduced-motion: reduce)');
    resolve(mql.matches);
    const handler = () => resolve(mql.matches);
    mql.addEventListener?.('change', handler);
  });
}

/** Whether the user prefers reduced motion. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    async function check() {
      if (!mounted) return;
      try {
        const isReduce =
          Platform.OS === 'web'
            ? await matchMediaReducedMotion()
            : await AccessibilityInfo.isReduceMotionEnabled();
        setReduced(!!isReduce);
      } catch {
        setReduced(false);
      }
    }

    check();
    return () => {
      mounted = false;
    };
  }, []);

  return reduced;
}

/**
 * FadeInView: fades content in on mount with an optional slight slide-up.
 * Respects reduced motion (falls back to instant opacity: 1).
 */
export function FadeInView({
  children,
  slideUp = 12,
  duration = ANIM_DURATION.normal,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  slideUp?: number;
  duration?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [fade] = useState(new Animated.Value(0));
  const [slide] = useState(new Animated.Value(slideUp));
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      Animated.timing(fade, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true,
      }).start();
      Animated.timing(slide, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration,
        delay,
        easing: ANIM_EASING,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration,
        delay,
        easing: ANIM_EASING,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide, duration, delay, reduced]);

  return (
    <Animated.View
      style={[
        {
          opacity: fade,
          transform: [{ translateY: slide }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * PressableScale: scales down to 0.97 on press and back to 1 on release.
 * Respects reduced motion (instant scale change).
 */
export function PressableScale({
  children,
  onPress,
  scale = 0.97,
  duration = ANIM_DURATION.fast,
  disabled = false,
  style,
  ...rest
}: {
  children: React.ReactNode;
  onPress?: () => void;
  scale?: number;
  duration?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
} & Omit<React.ComponentPropsWithoutRef<typeof Pressable>, 'style'>) {
  const [scaleAnim] = useState(new Animated.Value(1));
  const reduced = useReducedMotion();
  const isDisabled = disabled === true;

  const handlePressIn = () => {
    if (isDisabled) return;
    if (reduced) {
      scaleAnim.setValue(scale);
    } else {
      Animated.timing(scaleAnim, {
        toValue: scale,
        duration,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (isDisabled) return;
    if (reduced) {
      scaleAnim.setValue(1);
    } else {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <Animated.View
      style={[{ transform: [{ scale: scaleAnim }] }]}
    >
      <Pressable
        accessible
        accessibilityRole="button"
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={isDisabled}
        style={style}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/**
 * useHeartPop: returns an Animated.Value that springs 1 -> 1.3 -> 1 when
 * trigger() is called. Use for the favorite heart button.
 */
export function useHeartPop() {
  const [pop] = useState(new Animated.Value(1));
  const reduced = useReducedMotion();

  function trigger() {
    if (reduced) {
      pop.setValue(1);
      return;
    }
    Animated.sequence([
      Animated.spring(pop, {
        toValue: 1.3,
        ...HEART_POP_SPRING,
        useNativeDriver: true,
      }),
      Animated.spring(pop, {
        toValue: 1,
        ...HEART_POP_SPRING,
        useNativeDriver: true,
      }),
    ]).start();
  }

  return { pop, trigger };
}

/**
 * CrossFadeGrid: cross-fades children when a key changes (e.g. category switch).
 * Fades out current, then fades in next.
 */
export function CrossFadeGrid({
  children,
  key,
  durationOut = 120,
  durationIn = 200,
}: {
  children: React.ReactNode;
  key: string | number;
  durationOut?: number;
  durationIn?: number;
}) {
  const [fade] = useState(new Animated.Value(1));
  const [prevKey, setPrevKey] = useState(key);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      fade.setValue(1);
      setPrevKey(key);
      return;
    }
    if (key !== prevKey) {
      Animated.timing(fade, {
        toValue: 0,
        duration: durationOut,
        easing: ANIM_EASING,
        useNativeDriver: true,
      }).start(() => {
        setPrevKey(key);
        Animated.timing(fade, {
          toValue: 1,
          duration: durationIn,
          easing: ANIM_EASING,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [key, prevKey, fade, durationOut, durationIn, reduced]);

  return <Animated.View style={{ opacity: fade }}>{children}</Animated.View>;
}

/**
 * BellShake: shakes once when triggered (new notification).
 */
export function useBellShake() {
  const [shake] = useState(new Animated.Value(0));
  const reduced = useReducedMotion();

  function trigger() {
    if (reduced) return;
    Animated.sequence([
      Animated.timing(shake, {
        toValue: -6,
        duration: 60,
        easing: ANIM_EASING,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 6,
        duration: 120,
        easing: ANIM_EASING,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 0,
        duration: 60,
        easing: ANIM_EASING,
        useNativeDriver: true,
      }),
    ]).start();
  }

  return { shake, trigger };
}
