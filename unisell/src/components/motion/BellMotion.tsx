import { Animated, Easing, type StyleProp, type ViewStyle, View } from 'react-native';
import { useEffect, useRef, type ReactNode } from 'react';
import { useReducedMotion } from '../../lib/animations';

export interface BellMotionProps {
  /** Unread count driving the wiggle. Wiggles while > 0, roughly every 8s. */
  unreadCount: number;
  /** The bell button to wrap. */
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Notification bell motion: gentle wiggle while there are unread notifications
 * (about every 8 seconds) plus a pulsing red dot. Decorative wrapper only.
 */
export function BellMotion({ unreadCount, children, style }: BellMotionProps) {
  const reduced = useReducedMotion();
  const shake = useRef(new Animated.Value(0)).current;
  const dotOpacity = useRef(new Animated.Value(0)).current;
  const dotScale = useRef(new Animated.Value(0.7)).current;

  // Wiggle pulse on unread transitions / periodically while unread > 0.
  useEffect(() => {
    if (reduced || unreadCount <= 0) return;
    const trigger = () => {
      shake.setValue(0);
      const anim = Animated.sequence([
        Animated.timing(shake, { toValue: -5, duration: 55, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
        Animated.timing(shake, { toValue: 5, duration: 55, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
        Animated.timing(shake, { toValue: -3, duration: 45, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 45, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
      ]);
      anim.start();
    };    trigger();
    const id = setInterval(trigger, 8000);
    return () => clearInterval(id);
  }, [unreadCount, reduced, shake]);

  useEffect(() => {
    if (reduced) {
      dotOpacity.setValue(unreadCount > 0 ? 1 : 0);
      dotScale.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(dotScale, { toValue: 1.25, duration: 900, easing: Easing.inOut(Easing.out(Easing.cubic)), useNativeDriver: true }),
        Animated.timing(dotScale, { toValue: 0.7, duration: 900, easing: Easing.inOut(Easing.out(Easing.cubic)), useNativeDriver: true }),
        Animated.timing(dotOpacity, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.out(Easing.cubic)), useNativeDriver: true }),
        Animated.timing(dotOpacity, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.out(Easing.cubic)), useNativeDriver: true }),
      ]),
    );
    if (unreadCount > 0) anim.start();
    else {
      dotOpacity.setValue(0);
      dotScale.setValue(0.7);
    }
    return () => anim.stop();
  }, [unreadCount, reduced, dotScale, dotOpacity]);

  const dotVisible = unreadCount > 0;

  return (
    <View style={[{ position: 'relative' }, style]}>
      <Animated.View style={[{ transform: [{ translateX: shake }] }, { opacity: 1 }]}>
        {children}
      </Animated.View>
      {dotVisible ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 8,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#F4A261',
            },
            { opacity: dotOpacity, transform: [{ scale: dotScale }] },
          ]}
        />
      ) : null}
    </View>
  );
}
