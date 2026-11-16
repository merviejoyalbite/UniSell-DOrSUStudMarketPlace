import {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  spacing,
  useTheme,
} from '../theme';
import { ANIM_DURATION, ANIM_EASING, useReducedMotion } from '../lib/animations';

interface LoadingStateProps {
  message?: string;
  /** Compact shimmer variant for listing card skeletons. */
  compact?: boolean;
}

/**
 * Shimmer skeleton loading state. Pulses a gradient across the placeholder so
 * it feels alive while data loads. Fades into the real content when mounted.
 */
export function LoadingState({
  message = 'Loading campus finds…',
  compact = false,
}: LoadingStateProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [fade] = useState(new Animated.Value(0));
  const [shimmer] = useState(new Animated.Value(0));
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      Animated.timing(fade, { toValue: 1, duration: 0, useNativeDriver: true }).start();
      return;
    }
    Animated.timing(fade, {
      toValue: 1,
      duration: ANIM_DURATION.normal,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.linear),
        useNativeDriver: true,
      }),
    ).start();
  }, [fade, shimmer, reduced]);

  const pulseStyle = {
    transform: [{ translateX: shimmer.interpolate({
      inputRange: [0, 1],
      outputRange: ['-100%', '200%'],
    })}],
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fade },
        compact && styles.compact,
      ]}
    >
      {compact ? (
        <View style={styles.compactRow}>
          <Animated.View style={[styles.compactImage, pulseStyle]} />
          <View style={styles.compactMeta}>
            <Animated.View style={[styles.compactLine, pulseStyle]} />
            <Animated.View style={[styles.compactLineShort, pulseStyle]} />
          </View>
        </View>
      ) : (
        <>
          <ActivityIndicator
            size="large"
            color={colors.primary}
            accessibilityLabel={message}
            style={styles.spinner}
          />
          <Text style={styles.message}>{message}</Text>
        </>
      )}
    </Animated.View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  compact: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  compactRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  compactImage: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: colors.skeleton,
  },
  compactMeta: {
    gap: spacing.xs,
  },
  compactLine: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.skeleton,
    width: '60%',
  },
  compactLineShort: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.skeleton,
    width: '40%',
  },
  spinner: {
    marginHorizontal: spacing.lg,
  },
  message: {
    marginTop: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
}));
