import { Animated, Easing, Platform, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../lib/animations';

export interface FloatingCardProps {
  children: React.ReactNode;
  /** Idle vertical float amplitude (px). Defaults to 8. */
  idleAmplitude?: number;
  /** Idle loop duration (ms). Defaults to 3800. */
  idleDuration?: number;
  /** Staggered start offset (ms). Defaults to 0. */
  idleDelay?: number;
  /** Cursor-parallax depth multiplier. Defaults to 1. */
  parallaxDepth?: number;
  /** Hover lift (px). Defaults to -8. */
  hoverLift?: number;
  /** Hover scale. Defaults to 1.06. */
  hoverScale?: number;
  /** Idle rotation sway amplitude in degrees. Defaults to 1.5. Pass 0 to disable. */
  swayAmplitude?: number;
  style?: StyleProp<ViewStyle>;
  /** Optional web pointer move handler override. */
  onPointerMove?: (e: any) => void;
}

/**
 * Cursor-reactive floating card.
 *
 * - Idle: gentle vertical float + rotation sway (different per instance via
 *   idleDuration / idleDelay).
 * - Cursor parallax: shifts toward the cursor with a spring; eases back on leave.
 * - Hover: lift, scale, straighten rotation, 200ms spring.
 * - Press: 0.96 scale and release with a spring.
 *
 * Web-only parallax; respects reduced motion. pointerEvents preserved (tappable).
 */
export function FloatingCard({
  children,
  idleAmplitude = 8,
  idleDuration = 3800,
  idleDelay = 0,
  parallaxDepth = 1,
  hoverLift = -8,
  hoverScale = 1.06,
  swayAmplitude = 1.5,
  style,
}: FloatingCardProps) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const floatY = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const parallaxX = useRef(new Animated.Value(0)).current;
  const parallaxY = useRef(new Animated.Value(0)).current;
  const hoverY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  // Idle float + sway loop.
  useEffect(() => {
    if (reduced) {
      floatY.setValue(0);
      sway.setValue(0);
      return;
    }
    let floatLoop: Animated.CompositeAnimation | null = null;
    let swayLoop: Animated.CompositeAnimation | null = null;
    const start = () => {
      floatLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(floatY, { toValue: idleAmplitude, duration: idleDuration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(floatY, { toValue: -idleAmplitude, duration: idleDuration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );
      swayLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(sway, { toValue: 1, duration: idleDuration * 0.6, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(sway, { toValue: -1, duration: idleDuration * 0.6, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );
      floatLoop.start();
      swayLoop.start();
    };
    const t = setTimeout(start, idleDelay);
    return () => {
      clearTimeout(t);
      floatLoop?.stop();
      swayLoop?.stop();
    };
  }, [reduced, floatY, sway, idleAmplitude, idleDuration, idleDelay]);

  // Hover transitions.
  useEffect(() => {
    if (reduced) {
      hoverY.setValue(hovered ? hoverLift : 0);
      scale.setValue(hovered ? hoverScale : 1);
      return;
    }
    Animated.parallel([
      Animated.spring(hoverY, { toValue: hovered ? hoverLift : 0, friction: 7, tension: 120, useNativeDriver: true }),
      Animated.spring(scale, { toValue: hovered ? hoverScale : 1, friction: 7, tension: 120, useNativeDriver: true }),
    ]).start();
  }, [hovered, reduced, hoverY, scale, hoverLift, hoverScale]);

  const handlePointerMove = (e: any) => {
    if (Platform.OS !== 'web' || reduced) return;
    const target = e?.currentTarget;
    if (!target || typeof target.getBoundingClientRect !== 'function') return;
    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    Animated.spring(parallaxX, { toValue: dx * 8 * parallaxDepth, friction: 8, tension: 90, useNativeDriver: true }).start();
    Animated.spring(parallaxY, { toValue: dy * 8 * parallaxDepth, friction: 8, tension: 90, useNativeDriver: true }).start();
  };

  const handlePointerLeave = () => {
    if (Platform.OS !== 'web' || reduced) return;
    Animated.spring(parallaxX, { toValue: 0, friction: 8, tension: 90, useNativeDriver: true }).start();
    Animated.spring(parallaxY, { toValue: 0, friction: 8, tension: 90, useNativeDriver: true }).start();
  };

  const handlePressIn = () => {
    if (reduced) {
      pressScale.setValue(0.96);
      return;
    }
    Animated.spring(pressScale, { toValue: 0.96, friction: 6, tension: 200, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    if (reduced) {
      pressScale.setValue(1);
      return;
    }
    Animated.spring(pressScale, { toValue: 1, friction: 6, tension: 200, useNativeDriver: true }).start();
  };

  const transform = [
    { translateX: parallaxX },
    { translateY: Animated.add(Animated.add(floatY, parallaxY), hoverY) },
    { rotate: hovered ? '0deg' : sway.interpolate({ inputRange: [-1, 1], outputRange: [`-${swayAmplitude}deg`, `${swayAmplitude}deg`] }) },
    { scale: Animated.multiply(scale, pressScale) },
  ];

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => {
        setHovered(false);
        handlePointerLeave();
      }}
      onPointerMove={handlePointerMove as any}
      style={[style]}
    >
      <Animated.View style={[{ transform }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
