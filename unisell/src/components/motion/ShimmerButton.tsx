import { Animated, Easing, Platform, Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useReducedMotion } from '../../lib/animations';
import { ShimmerSweep } from './ShimmerSweep';

export interface ShimmerButtonProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  /** 'primary' | 'secondary'. Defaults to primary. */
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
}

/**
 * Button with hover lift, shimmer sweep, press scale 0.97 and an icon that
 * nudges sideways on hover. Web-only shimmer; respects reduced motion.
 */
export function ShimmerButton({ label, icon, onPress, variant = 'primary', style }: ShimmerButtonProps) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const lift = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const iconNudge = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      lift.setValue(0);
      iconNudge.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.spring(lift, { toValue: hovered ? -3 : 0, friction: 7, tension: 120, useNativeDriver: true }),
      Animated.spring(iconNudge, { toValue: hovered ? 6 : 0, friction: 7, tension: 120, useNativeDriver: true }),
    ]).start();
  }, [hovered, reduced, lift, iconNudge]);

  const handlePressIn = () => {
    if (reduced) { press.setValue(0.97); return; }
    Animated.spring(press, { toValue: 0.97, friction: 6, tension: 200, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    if (reduced) { press.setValue(1); return; }
    Animated.spring(press, { toValue: 1, friction: 6, tension: 200, useNativeDriver: true }).start();
  };

  const bg = variant === 'primary' ? '#1F7A72' : 'transparent';
  const fg = variant === 'primary' ? '#FFFFFF' : '#1F7A72';
  const border = variant === 'secondary' ? '#1F7A72' : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={style}
    >
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 20,
          paddingVertical: 14,
          minHeight: 52,
          borderRadius: 14,
          backgroundColor: bg,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: border,
          overflow: 'hidden',
          width: '100%',
          transform: [{ translateY: lift }, { scale: press }],
        }}
      >
        {icon ? (
          <Animated.View style={{ transform: [{ translateX: iconNudge }] }}>
            <Ionicons name={icon} size={18} color={fg} />
          </Animated.View>
        ) : null}
        <Text style={{ color: fg, fontWeight: '600', fontSize: 16 }}>{label}</Text>
        {hovered ? <ShimmerSweep width={40} duration={900} colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']} /> : null}
      </Animated.View>
    </Pressable>
  );
}
