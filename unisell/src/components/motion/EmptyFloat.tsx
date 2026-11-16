import { Animated, Easing, type StyleProp, type ViewStyle, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../lib/animations';

export interface EmptyFloatProps {
  children?: React.ReactNode;
  /** Vertical bob amplitude in dp. Defaults to 8. */
  amplitude?: number;
  /** Loop duration in ms. Defaults to 3200. */
  duration?: number;
  /** Pause the loop (e.g. screen not focused). Defaults to true. */
  active?: boolean;
  /** Visual style for the floating wrapper (e.g. margin). */
  style?: StyleProp<ViewStyle>;
}

/**
 * Gentle looping float for empty-state illustrations (bobbing box / heart).
 * Only transform is animated. The text itself already fades in via FadeInView.
 */
export function EmptyFloat({ children, amplitude = 8, duration = 3200, active = true, style }: EmptyFloatProps) {
  const y = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!active || reduced) {
      y.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.timing(y, { toValue: amplitude, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [y, amplitude, duration, reduced, active]);

  return (
    <Animated.View style={[{ transform: [{ translateY: y }] }, style]}>
      {children}
    </Animated.View>
  );
}
