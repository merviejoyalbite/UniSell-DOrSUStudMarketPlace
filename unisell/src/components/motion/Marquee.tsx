import { Animated, Easing, StyleSheet, type TextStyle, type ViewStyle, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../lib/animations';

export interface PromoMarqueeProps {
  items: string[];
  /** Loop duration in ms. Defaults to 22000. */
  duration?: number;
  /** Pause the loop (e.g. screen not focused / hovered). Defaults to true. */
  active?: boolean;
  style?: ViewStyle;
}

const FALLBACK_ITEMS = [
  'Every reused item keeps money and materials on campus',
  'Verified DOrSU students only',
  'New finds posted today',
];

/**
 * Horizontally auto-scrolling promo ticker. The strip loops seamlessly and
 * pauses while touched or paused.
 */
export function PromoMarquee({ items, duration = 22000, active = true, style }: PromoMarqueeProps) {
  const reduced = useReducedMotion();
  const x = useRef(new Animated.Value(0)).current;
  const [paused, setPaused] = useState(false);
  const [width, setWidth] = useState(0);

  const message = items.length > 0 ? items : FALLBACK_ITEMS;

  useEffect(() => {
    if (reduced || !active) {
      x.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.timing(x, { toValue: -(width || 0), duration, easing: Easing.linear, useNativeDriver: true }),
    );
    if (paused) {
      anim.stop();
      x.setValue(0);
    } else {
      anim.start();
    }
    return () => anim.stop();
  }, [paused, duration, reduced, active, x, width]);

  const renderCell = (item: string, key: string) => (
    <View key={key} style={styles.cell} pointerEvents="none">
      <View style={styles.dot} />
      <Animated.Text style={styles.text as TextStyle}>{item}</Animated.Text>
    </View>
  );

  return (
    <View
      pointerEvents="none"
      onStartShouldSetResponder={() => true}
      onResponderGrant={() => setPaused(true)}
      onResponderRelease={() => setPaused(false)}
      style={{ overflow: 'hidden', ...style }}
    >
      <Animated.View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.row}>
        <View style={styles.copy}>{message.map((item, index) => renderCell(item, `a-${index}`))}</View>
        <View style={styles.copy}>{message.map((item, index) => renderCell(item, `b-${index}`))}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  copy: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 28,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    marginRight: 10,
  },
  text: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
