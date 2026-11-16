import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from '../../lib/animations';

export interface ShimmerSweepProps {
  /** Width of the sweeping highlight, in dp. */
  width?: number;
  /** Loop duration in ms. Defaults to 2400. */
  duration?: number;
  /** Highlight colours (gradient). */
  colors?: string[];
  style?: StyleProp<ViewStyle>;
}

/**
 * Soft light sweep that glides across a region on a loop. Fades in and out as
 * it travels so it reads as a moving highlight rather than a steady shape.
 * Themed for hero CTAs.
 */
export function ShimmerSweep({
  width = 44,
  duration = 2400,
  colors = ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.45)', 'rgba(255, 255, 255, 0)'],
  style,
}: ShimmerSweepProps) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      progress.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(progress, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, duration, reduced]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.15, 0.5, 0.85, 1],
    outputRange: [0, 1, 1, 1, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width,
          opacity,
        },
        { transform: [{ translateX }] },
        style,
      ]}
    >
      <LinearGradient
        colors={colors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1, borderRadius: 999 }}
      />
    </Animated.View>
  );
}
