import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { Listing } from '../types';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  spacing,
  useTheme,
} from '../theme';
import { getCategoryMeta } from '../utils/categoryMeta';
import { resolveImageUri } from '../utils/images';

interface ListingImageProps {
  listing: Listing;
  /** `card` is square; `detail` is a taller hero. */
  variant?: 'card' | 'detail';
  /** Skip loading the photo and show the category placeholder immediately. */
  forcePlaceholder?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Listing image or, when there is no usable image, a tinted category
 * placeholder with an icon. Images use expo-image with `contentFit="cover"` and
 * a pulsing skeleton while the image decodes.
 */
export function ListingImage({
  listing,
  variant = 'card',
  forcePlaceholder = false,
  style,
}: ListingImageProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const meta = getCategoryMeta(listing.category);
  const palette = colors.categories[listing.category] ?? colors.categories.Others;
  const isDetail = variant === 'detail';
  const imageUri =
    resolveImageUri(listing.image) ?? resolveImageUri(listing.images?.[0]);
  const hasImage = Boolean(imageUri) && !forcePlaceholder;
  const [isLoading, setIsLoading] = useState(hasImage);
  const [hasError, setHasError] = useState(false);
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    setIsLoading(hasImage);
    setHasError(false);
  }, [hasImage, imageUri]);

  useEffect(() => {
    if (!hasImage || !isLoading) return;

    pulse.setValue(0.45);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.9,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [hasImage, isLoading, pulse]);

  const showPlaceholder = !hasImage || hasError;

  return (
    <View style={[styles.base, { backgroundColor: palette.tint }, style]}>
      {hasImage ? (
        <Image
          source={{ uri: imageUri ?? undefined }}
          contentFit="cover"
          transition={180}
          style={styles.image}
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          accessibilityIgnoresInvertColors
        />
      ) : null}

      {isLoading && hasImage ? (
        <Animated.View style={[styles.skeleton, { opacity: pulse }]} />
      ) : null}

      {showPlaceholder ? (
        <>
          <View style={[styles.blob, styles.blobTop]} />
          <View style={[styles.blob, styles.blobBottom]} />
          <Ionicons name={meta.icon} size={isDetail ? 76 : 40} color={palette.color} />
          {isDetail ? (
            <Text style={[styles.category, { color: palette.color }]}>
              {listing.category}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  skeleton: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.skeleton,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: colors.surface,
    opacity: 0.35,
  },
  blobTop: {
    width: 120,
    height: 120,
    top: -50,
    right: -40,
  },
  blobBottom: {
    width: 90,
    height: 90,
    bottom: -40,
    left: -30,
  },
  category: {
    marginTop: spacing.sm,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
}));
