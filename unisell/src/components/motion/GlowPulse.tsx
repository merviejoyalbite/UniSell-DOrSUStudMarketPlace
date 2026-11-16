import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../lib/animations';

export interface GlowPulseProps {
  /** Glow colour. Defaults to the orange accent used for fresh items. */
  color?: string;
  /** Glow size in dp. Defaults to 26. */
  size?: number;
  /** Only pulse when true. */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Soft pulsing glow used to make fresh listings stand out. Only transform +
 * opacity are animated.
 */
export function GlowPulse({ color = '#F4A261', size = 26, active = true, style }: GlowPulseProps) {
  const opacity = useRef(new Animated.Value(active ? 0.55 : 0)).current;
  const scale = useRef(new Animated.Value(active ? 1 : 0.8)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      scale.setValue(1);
      opacity.setValue(active ? 0.55 : 0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.35, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    );
    if (active) anim.start();
    else {
      scale.setValue(0.8);
      opacity.setValue(0);
    }
    return () => anim.stop();
  }, [active, color, opacity, scale, reduced]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: 0,
          shadowColor: color,
          shadowRadius: 10,
          shadowOpacity: 0.6,
        },
        { transform: [{ scale }], opacity },
        style,
      ]}
    />
  );
}
