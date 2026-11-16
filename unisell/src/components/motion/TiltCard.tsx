import { Animated, Platform, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../lib/animations';

export interface TiltCardProps {
  children: React.ReactNode;
  /** Max tilt angle in degrees. Defaults to 10. */
  maxTilt?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * 3D tilt toward the cursor (web only). Uses perspective 800 and rotateX/Y.
 * A soft light highlight follows the cursor. Resets smoothly on leave.
 * Respects reduced motion and is a no-op on native.
 */
export function TiltCard({ children, maxTilt = 10, style }: TiltCardProps) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const rotateX = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;
  const highlightX = useRef(new Animated.Value(50)).current;
  const highlightY = useRef(new Animated.Value(50)).current;
  const highlightOpacity = useRef(new Animated.Value(0)).current;

  const reset = () => {
    Animated.parallel([
      Animated.spring(rotateX, { toValue: 0, friction: 7, tension: 90, useNativeDriver: true }),
      Animated.spring(rotateY, { toValue: 0, friction: 7, tension: 90, useNativeDriver: true }),
      Animated.timing(highlightOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const handlePointerMove = (e: any) => {
    if (Platform.OS !== 'web' || reduced) return;
    const target = e?.currentTarget;
    if (!target || typeof target.getBoundingClientRect !== 'function') return;
    const rect = target.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height;
    const tiltY = (px - 0.5) * 2 * maxTilt; // rotateY
    const tiltX = (0.5 - py) * 2 * maxTilt; // rotateX
    Animated.spring(rotateX, { toValue: tiltX, friction: 7, tension: 120, useNativeDriver: true }).start();
    Animated.spring(rotateY, { toValue: tiltY, friction: 7, tension: 120, useNativeDriver: true }).start();
    highlightX.setValue(px * 100);
    highlightY.setValue(py * 100);
    Animated.timing(highlightOpacity, { toValue: 0.28, duration: 150, useNativeDriver: true }).start();
  };

  const transform = [
    { perspective: 800 },
    { rotateX: rotateX.interpolate({ inputRange: [-maxTilt, maxTilt], outputRange: [`-${maxTilt}deg`, `${maxTilt}deg`] }) },
    { rotateY: rotateY.interpolate({ inputRange: [-maxTilt, maxTilt], outputRange: [`-${maxTilt}deg`, `${maxTilt}deg`] }) },
  ];

  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => { setHovered(false); reset(); }}
      onPointerMove={handlePointerMove as any}
      style={style}
    >
      <Animated.View style={{ transform }}>
        {children}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: highlightOpacity,
            // soft light highlight approximated via a translucent overlay
            backgroundColor: 'rgba(255,255,255,0.18)',
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
