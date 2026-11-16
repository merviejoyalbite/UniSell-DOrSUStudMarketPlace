import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Platform,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { ImageSource, Listing } from '../types';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  radii,
  spacing,
  useTheme,
} from '../theme';
import { getImageSourceAt, getImageSourceLabel } from '../utils/imageSources';
import { resolveImageUri } from '../utils/images';
import { ListingImage } from './ListingImage';
import { SampleImageBadge } from './SampleImageBadge';

interface ListingGalleryProps {
  listing: Listing;
  /** Fixed hero height; defaults to a responsive 0.78 aspect ratio. */
  height?: number;
  style?: StyleProp<ViewStyle>;
}

interface GalleryPhotoProps {
  listing: Listing;
  uri: string;
  index: number;
  total: number;
  width: number;
  height: number;
  source?: ImageSource;
  isSample: boolean;
}

interface GalleryImage {
  uri: string;
  source?: ImageSource;
}

/**
 * One expo-image page with a pulsing skeleton. If the file is missing, the
 * category placeholder is shown instead of a broken image or a crash.
 */
function GalleryPhoto({
  listing,
  uri,
  index,
  total,
  width,
  height,
  source,
  isSample,
}: GalleryPhotoProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    if (!isLoading || hasError) return;

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
  }, [hasError, isLoading, pulse]);

  if (hasError) {
    return (
      <ListingImage
        listing={listing}
        variant="detail"
        forcePlaceholder
        style={{ width, height }}
      />
    );
  }

  return (
    <View style={[styles.galleryPhoto, { width, height }]}>
      <Image
        source={{ uri }}
        contentFit="cover"
        transition={180}
        style={styles.galleryImage}
        onLoadStart={() => setIsLoading(true)}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        accessibilityLabel={`${listing.title}, photo ${index + 1} of ${total}${
          isSample
            ? ', sample image'
            : source
              ? `, ${getImageSourceLabel(source).toLowerCase()}`
              : ''
        }`}
        accessibilityIgnoresInvertColors
      />
      {isLoading ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.gallerySkeleton, { opacity: pulse }]}
        />
      ) : null}

      {isSample ? (
        <SampleImageBadge variant="detail" style={styles.photoBadge} />
      ) : source ? (
        <View
          style={[styles.photoBadge, styles.sourceBadge]}
          accessibilityRole="text"
          accessibilityLabel={getImageSourceLabel(source)}
        >
          <Ionicons
            name={source === 'gallery' ? 'images-outline' : 'camera-outline'}
            size={13}
            color={colors.primary}
          />
          <Text style={styles.sourceBadgeText}>
            {getImageSourceLabel(source)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Swipeable seller-photo gallery for Listing Details.
 *
 * The page width is measured from the gallery container, so the same component
 * works full-bleed on a phone and inside the left column on desktop.
 */
export function ListingGallery({ listing, height: fixedHeight, style }: ListingGalleryProps) {
  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const styles = useStyles();
  const [containerWidth, setContainerWidth] = useState(0);
  const isSample = listing.imageType === 'sample';
  const imageValues = listing.images?.length
    ? listing.images
    : [listing.image];
  const images: GalleryImage[] = imageValues.flatMap((value, index) => {
    const uri = resolveImageUri(value);
    return uri ? [{ uri, source: getImageSourceAt(listing, index) }] : [];
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<GalleryImage>>(null);
  const width = containerWidth || Math.min(windowWidth, 600);
  const height = fixedHeight ?? Math.min(420, Math.round(width * 0.78));

  useEffect(() => {
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [listing.id]);

  function handleLayout(event: LayoutChangeEvent) {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth > 0 && nextWidth !== containerWidth) {
      setContainerWidth(nextWidth);
    }
  }

  if (images.length === 0) {
    return (
      <ListingImage
        listing={listing}
        variant="detail"
        style={[style, { height }]}
      />
    );
  }

  function handleScrollEnd(
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.max(0, Math.min(images.length - 1, nextIndex)));
  }

  return (
    <View style={[styles.wrap, { height }, style]} onLayout={handleLayout}>
      <FlatList
        ref={listRef}
        data={images}
        horizontal
        pagingEnabled
        scrollEnabled={images.length > 1}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${index}-${item.uri.slice(-24)}`}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item, index }) => (
          <GalleryPhoto
            listing={listing}
            uri={item.uri}
            index={index}
            total={images.length}
            width={width}
            height={height}
            source={item.source}
            isSample={isSample}
          />
        )}
      />

      <LinearGradient
        colors={['transparent', colors.photoOverlay]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={styles.bottomGradient}
      />

      {images.length > 1 ? (
        <View style={styles.bottomBar}>
          <View
            style={styles.dots}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {images.map((image, index) => (
              <View
                key={`${index}-${image.uri.slice(-16)}`}
                style={[
                  styles.dot,
                  index === activeIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  wrap: {
    position: 'relative',
    width: '100%',
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  galleryPhoto: {
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  galleryImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  gallerySkeleton: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.skeleton,
  },
  photoBadge: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    zIndex: 1,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  sourceBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.primary,
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    opacity: 0.6,
  },
  dotActive: {
    width: 20,
    opacity: 1,
  },
}));
