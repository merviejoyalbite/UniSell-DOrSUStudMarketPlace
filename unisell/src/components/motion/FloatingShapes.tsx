import { Easing, Animated, Platform, type ViewStyle, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../lib/animations';

export interface FloatingShapeConfig {
  /** Diameter of the soft circle, in dp. */
  size: number;
  /** Vertical offset of the shape, in dp. */
  top?: number;
  /** Horizontal offset of the shape, in dp. */
  left?: number;
  /** Base colour of the shape (theme accent / primary / orange). */
  color: string;
  /** Loop duration in ms. Defaults to 16000. */
  duration?: number;
  /** Horizontal drift in dp. Defaults to 26. */
  driftX?: number;
  /** Vertical drift in dp. Defaults to 70% of driftX. */
  driftY?: number;
}

interface FloatingShapesProps {
  shapes: FloatingShapeConfig[];
  /** Optional overrides for the clipped container (e.g. height). */
  style?: ViewStyle;
  /** Subtle desktop parallax shift (dp) applied to the whole group. */
  parallax?: number;
  /** Pause all drift loops (e.g. screen not focused). Defaults to true. */
  active?: boolean;
}

function DriftingShape({
  shape,
  reduced,
  active = true,
}: {
  shape: FloatingShapeConfig;
  reduced: boolean;
  active?: boolean;
}) {
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const duration = shape.duration ?? 16000;
  const driftX = shape.driftX ?? 26;
  const driftY = shape.driftY ?? Math.max(8, driftX * 0.7);

  useEffect(() => {
    if (reduced || !active) {
      x.setValue(0);
      y.setValue(0);
      return;
    }
    const tx = Animated.loop(Animated.timing(x, { toValue: driftX, duration, easing: Easing.linear, useNativeDriver: true }));
    const ty = Animated.loop(Animated.timing(y, { toValue: driftY, duration, easing: Easing.linear, useNativeDriver: true }));
    tx.start();
    ty.start();
    return () => {
      tx.stop();
      ty.stop();
    };
  }, [x, y, driftX, driftY, duration, reduced, active]);

  const shapeStyle = {
    position: 'absolute',
    top: shape.top ?? 0,
    left: shape.left ?? 0,
    width: shape.size,
    height: shape.size,
    borderRadius: shape.size / 2,
    backgroundColor: shape.color,
    opacity: 0.16,
    blurRadius: Math.max(10, Math.round(shape.size / 3)),
    transform: [{ translateX: x }, { translateY: y }],
  } as ViewStyle;

  return (
    <Animated.View pointerEvents="none" style={shapeStyle} />
  );
}

/**
 * Ambient floating shapes: soft blurred accent circles drifting slowly behind
 * headers and empty states. Purely decorative, `pointerEvents="none"` so it can
 * never block taps. Respects reduced motion and (on web) follows the pointer
 * with a subtle parallax shift.
 */
export function FloatingShapes({ shapes, style, parallax = 0, active = true }: FloatingShapesProps) {
  const reduced = useReducedMotion();
  const containerX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onMove = (e: MouseEvent) => {
      const max = typeof window !== 'undefined' ? window.innerWidth : 1;
      const nx = max > 0 ? Math.min(1, Math.max(0, e.clientX / max)) : 0;
      containerX.setValue(nx);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [containerX]);

  const containerStyle: ViewStyle = parallax > 0 && !reduced
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
        transform: [
          {
            translateX: containerX.interpolate({
              inputRange: [0, 1],
              outputRange: [-parallax / 2, parallax / 2],
            }),
          },
        ],
      }
    : { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' };

  return (
    <Animated.View pointerEvents="none" style={[containerStyle, style]}>
      {shapes.map((shape, index) => (
        <DriftingShape key={index} shape={shape} reduced={reduced} active={active} />
      ))}
    </Animated.View>
  );
}
