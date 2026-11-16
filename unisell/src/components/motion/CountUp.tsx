import { Animated, Easing, type TextStyle } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../lib/animations';

export interface AnimatedCountProps {
  value: number;
  /** Count-up duration in ms. Defaults to 900. */
  duration?: number;
  /** Optional formatter, e.g. Intl currency / compact. */
  format?: (value: number) => string;
  style?: TextStyle;
}

/**
 * Numbers that count up when they change (e.g. live listing / saved counters).
 * Only numeric animation is used; layout stays static.
 */
export function AnimatedCount({ value, duration = 900, format, style }: AnimatedCountProps) {
  const reduced = useReducedMotion();
  const animated = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const anim = Animated.timing(animated, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start();
    const listener = animated.addListener(({ value: v }) => setDisplay(v));
    return () => {
      anim.stop();
      animated.removeListener(listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated, value, duration, reduced]);

  const text = format ? format(display) : Math.round(display).toString();

  return <Animated.Text style={[styles.text, style]}>{text}</Animated.Text>;
}

const styles = {
  text: {
    fontVariant: ['tabular-nums'] as const,
  },
};
