import { Animated, Easing, type StyleProp, type ViewStyle, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../lib/animations';

export interface BobbingViewProps {
  children?: React.ReactNode;
  /** Upward amplitude in dp. Defaults to 4. */
  amplitude?: number;
  /** Loop duration in ms. Defaults to 2500. */
  duration?: number;
  /** Set false to pause the loop (e.g. screen not focused). */
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Gentle vertical bob (float) for floating affordances such as the orange
 * "Sell" button. Only transform is animated.
 */
export function BobbingView({ children, amplitude = 4, duration = 2500, enabled = true, style }: BobbingViewProps) {
  const y = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!enabled || reduced) {
      y.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.timing(y, { toValue: amplitude, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [enabled, reduced, amplitude, duration, y]);

  return (
    <Animated.View style={[{ transform: [{ translateY: y }] }, style]}>
      {children}
    </Animated.View>
  );
}

export interface PulseRingProps {
  color: string;
  size?: number;
  /** Run the loop (e.g. screen not focused). Defaults to true. */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Soft pulsing ring that expands and fades out. Decorative halo for the
 * floating Sell button. Only transform + opacity are animated.
 */
export function PulseRing({ color, size = 72, active = true, style }: PulseRingProps) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !active) {
      scale.setValue(1);
      opacity.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.35, duration: 2200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 2200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [scale, opacity, reduced, active]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: -size / 2 + 8,
          left: -size / 2 + 8,
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color,
          opacity: 0,
        },
        { transform: [{ scale }], opacity },
        style,
      ]}
    />
  );
}
