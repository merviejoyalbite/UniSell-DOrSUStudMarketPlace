import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from '../lib/animations';

const PESO_SVG = (size: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="${size}" height="${size}">
  <g transform="translate(-17,0)" stroke-linecap="round">
    <g fill="#ffd166">
      <rect x="88" y="40" width="44" height="176" rx="22"/>
      <path d="M110 40 H146 A56 56 0 0 1 146 152 H110 Z"/>
    </g>
    <rect x="62" y="80" width="156" height="10" rx="5" fill="#fffbe8"/>
    <rect x="62" y="98" width="156" height="10" rx="5" fill="#fffbe8"/>
    <circle id="peso-eye-l" cx="138" cy="130" r="12" fill="#3d2c1e"/>
    <circle id="peso-eye-r" cx="182" cy="130" r="12" fill="#3d2c1e"/>
    <circle id="peso-pupil-l" cx="142" cy="125" r="4.5" fill="#fff"/>
    <circle id="peso-pupil-r" cx="186" cy="125" r="4.5" fill="#fff"/>
    <circle id="peso-highlight-l" cx="134" cy="135" r="2" fill="#fff"/>
    <circle id="peso-highlight-r" cx="178" cy="135" r="2" fill="#fff"/>
    <ellipse cx="121" cy="147" rx="6" ry="3.5" fill="#ff9aa2" opacity="0.7"/>
    <ellipse cx="199" cy="147" rx="6" ry="3.5" fill="#ff9aa2" opacity="0.7"/>
    <path d="M154 141 Q160 148 166 141" fill="none" stroke="#3d2c1e" stroke-width="3"/>
    <circle id="peso-hand-l" cx="80" cy="168" r="11" fill="#ffd166"/>
    <circle id="peso-hand-r" cx="140" cy="182" r="11" fill="#ffd166"/>
  </g>
</svg>`;

export interface PesoMascotProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A small peso-character mascot. On web, the eyes follow the cursor and the
 * hands move gently. Respects reduced motion.
 */
export function PesoMascot({ size = 80, style }: PesoMascotProps) {
  const reduced = useReducedMotion();
  const containerRef = useRef<any>(null);
  const floatY = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (Platform.OS !== 'web' || reduced) return;
    const container = containerRef.current;
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
        const ex = clamp(dx) * 5;
        const ey = clamp(dy) * 5;
        const hx = clamp(dx) * 7;
        const hy = clamp(dy) * 7;

        const set = (id: string, x: number, y: number) => {
          const el = container.querySelector('#' + id) as any;
          if (el) el.setAttribute('transform', `translate(${x},${y})`);
        };
        set('peso-pupil-l', ex, ey);
        set('peso-pupil-r', ex, ey);
        set('peso-highlight-l', ex * 0.6, ey * 0.6);
        set('peso-highlight-r', ex * 0.6, ey * 0.6);
        set('peso-eye-l', ex * 0.3, ey * 0.3);
        set('peso-eye-r', ex * 0.3, ey * 0.3);
        set('peso-hand-l', hx, hy);
        set('peso-hand-r', hx, hy);
      });
    };
    const onLeave = () => {
      ['peso-pupil-l', 'peso-pupil-r', 'peso-highlight-l', 'peso-highlight-r', 'peso-eye-l', 'peso-eye-r', 'peso-hand-l', 'peso-hand-r'].forEach((id) => {
        const el = container.querySelector('#' + id) as any;
        if (el) el.removeAttribute('transform');
      });
    };
    window.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseleave', onLeave);
    };
  }, [reduced]);

  if (Platform.OS !== 'web') {
    return (
      <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center', transform: [{ translateY: floatY }] }, style]}>
        <Text style={{ fontSize: size * 0.6 }}>₱</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center', transform: [{ translateY: floatY }] }, style]} ref={containerRef as any}>
      <div
        // @ts-ignore
        dangerouslySetInnerHTML={{ __html: PESO_SVG(size) }}
        style={{ width: size, height: size }}
      />
    </Animated.View>
  );
}
