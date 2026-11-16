import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../lib/animations';

export interface HeroBackdropProps {
  /** First colour of the drifting background. */
  colorA: string;
  /** Second colour of the drifting background. */
  colorB: string;
  /** Loop duration in ms. Defaults to 8000. */
  duration?: number;
  /** Pause the loop (e.g. screen not focused). Defaults to true. */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Animated hero backdrop: cross-fades between two colours on a slow loop so the
 * hero area gently shifts from teal to deep navy. Only opacity is animated.
 */
export function HeroBackdrop({ colorA, colorB, duration = 8000, active = true, style }: HeroBackdropProps) {
  const reduced = useReducedMotion();
  const opacityA = useRef(new Animated.Value(1)).current;
  const opacityB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced || !active) {
      opacityA.setValue(1);
      opacityB.setValue(0);
      return;
    }
    const swap = Animated.parallel([
      Animated.timing(opacityA, { toValue: 0, duration, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
      Animated.timing(opacityB, { toValue: 1, duration, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
    ]);
    const swapBack = Animated.parallel([
      Animated.timing(opacityB, { toValue: 0, duration, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
      Animated.timing(opacityA, { toValue: 1, duration, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
    ]);
    const loop = Animated.loop(Animated.sequence([swap, swapBack]));
    loop.start();
    return () => loop.stop();
  }, [opacityA, opacityB, duration, reduced, active]);

  const layer = (value: Animated.Value, backgroundColor: string) => (
    <Animated.View pointerEvents="none" style={[{ backgroundColor }, { opacity: value }]} />
  );

  return (
    <Animated.View pointerEvents="none" style={[{ ...style, backgroundColor: colorA }]}>
      {layer(opacityA, colorA)}
      {layer(opacityB, colorB)}
    </Animated.View>
  );
}
