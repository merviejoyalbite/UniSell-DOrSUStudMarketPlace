import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from '../lib/animations';

const PESO_COLOR = '#FFD166';
const PESO_DARK = '#3D2C1E';

export interface PesoMascotProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A small peso-character mascot. Gentle idle bob, cursor-following eyes on web,
 * and a cute face. Renders the same way on web and native so it never looks
 * like a plain peso sign.
 */
export function PesoMascot({ size = 80, style }: PesoMascotProps) {
  const reduced = useReducedMotion();
  const containerRef = useRef<any>(null);
  const floatY = useRef(new Animated.Value(0)).current;
  const pupilX = useRef(new Animated.Value(0)).current;
  const pupilY = useRef(new Animated.Value(0)).current;

  // Idle bob loop.
  useEffect(() => {
    if (reduced) {
      floatY.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -4, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 4, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [reduced, floatY]);

  // Cursor-following eyes (web only).
  useEffect(() => {
    if (Platform.OS !== 'web' || reduced) return;
    const container = containerRef.current as HTMLElement | null;
    if (!container) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        const clamp = (v: number) => Math.max(-1, Math.min(1, v));
        pupilX.setValue(clamp(dx) * 5);
        pupilY.setValue(clamp(dy) * 5);
      });
    };
    const onLeave = () => {
      pupilX.setValue(0);
      pupilY.setValue(0);
    };
    window.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseleave', onLeave);
    };
  }, [reduced, pupilX, pupilY]);

  return (
    <Animated.View
      ref={containerRef as any}
      style={[
        { width: size, height: size, alignItems: 'center', justifyContent: 'center', transform: [{ translateY: floatY }] },
        style,
      ]}
    >
      <Animated.View style={[{ transform: [{ scale: size / 80 }] }]}>
        <View style={styles.faceContainer}>
          <View style={styles.leftEye}>
            <View style={[styles.pupil, { transform: [{ translateX: pupilX }, { translateY: pupilY }] }]} />
          </View>
          <View style={styles.rightEye}>
            <View style={[styles.pupil, { transform: [{ translateX: pupilX }, { translateY: pupilY }] }]} />
          </View>
          <View style={styles.mouth} />
        </View>
        <Text style={styles.pesoText}>₱</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  faceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  leftEye: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PESO_DARK,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightEye: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PESO_DARK,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pupil: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  mouth: {
    width: 20,
    height: 6,
    borderBottomWidth: 2,
    borderBottomColor: PESO_DARK,
    borderRadius: 10,
    marginTop: 4,
  },
  pesoText: {
    fontSize: 34,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -2,
    marginTop: 2,
  },
});
