import { Ionicons } from '@expo/vector-icons';
import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  Pressable,
  Text,
  View,
  Animated,
  Platform,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { Listing } from '../types';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  radii,
  spacing,
  useTheme,
} from '../theme';
import { formatPeso, formatRelativeDate, formatStatus } from '../utils/formatters';
import { getCoverImageSource } from '../utils/imageSources';
import { ListingImage } from './ListingImage';
import { Rating } from './Rating';
import { RoundIconButton } from './RoundIconButton';
import { SampleImageBadge } from './SampleImageBadge';
import { StatusBadge } from './StatusBadge';
import { VerifiedPill } from './VerifiedBadge';
import { GlowPulse } from './motion';
import {
  ANIM_DURATION,
  ANIM_EASING,
  useReducedMotion,
  useHeartPop,
} from '../lib/animations';

interface ListingCardProps {
  listing: Listing;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  /** Index in the grid for staggered entrance animation. */
  index?: number;
  /** Optional seller rating. Hidden when omitted (no review data yet). */
  rating?: { average: number | null; count: number };
  /** Hide the heart button, e.g. in the seller's own shop. Defaults to true. */
  showFavorite?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Marketplace card used by Home, Search and Saved.
 *
 * Matches the Figma card: square photo, condition chip top-left, heart
 * top-right, status pill bottom-left, price with the peso sign, title, seller
 * name with the green "Student" pill and an optional star rating.
 *
 * Seed items keep the visible "Sample image" badge. Camera photos keep the
 * small camera badge, so demo art is never mistaken for a real listing photo.
 */
export function ListingCard({
  listing,
  isFavorite,
  onPress,
  onToggleFavorite,
  index = 0,
  rating,
  showFavorite = true,
  style,
}: ListingCardProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 768;

  const isSample = listing.imageType === 'sample';
  const isCameraCover = !isSample && getCoverImageSource(listing) === 'camera';
  const sellerFirstName = listing.sellerName.trim().split(/\s+/)[0] || 'Student';
  const createdAtMs = new Date(listing.createdAt).getTime();
  const isFresh = !Number.isNaN(createdAtMs) && Date.now() - createdAtMs < 24 * 60 * 60 * 1000;

  const cardRadius = isMobile ? radii.sm : radii.lg;
  const cardPadding = isMobile ? spacing.sm : spacing.md;
  const heartSize = isMobile ? 30 : 36;

  // Staggered entrance: fade in + slide up 16px, delayed by index * 50ms (capped).
  const [fade] = useState(new Animated.Value(0));
  const [slide] = useState(new Animated.Value(16));
  const entranceDelay = Math.min(index * 50, 300);

  useEffect(() => {
    if (reduced) {
      Animated.timing(fade, { toValue: 1, duration: 0, useNativeDriver: true }).start();
      Animated.timing(slide, { toValue: 0, duration: 0, useNativeDriver: true }).start();
      return;
    }
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: ANIM_DURATION.normal,
        delay: entranceDelay,
        easing: ANIM_EASING,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: ANIM_DURATION.normal,
        delay: entranceDelay,
        easing: ANIM_EASING,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide, entranceDelay, reduced]);

  // Press scale on the card container.
  const [pressScale] = useState(new Animated.Value(1));
  const handlePressIn = useCallback(() => {
    if (reduced) {
      pressScale.setValue(0.97);
    } else {
      Animated.timing(pressScale, {
        toValue: 0.97,
        duration: ANIM_DURATION.fast,
        useNativeDriver: true,
      }).start();
    }
  }, [pressScale, reduced]);
  const handlePressOut = useCallback(() => {
    if (reduced) {
      pressScale.setValue(1);
    } else {
      Animated.timing(pressScale, {
        toValue: 1,
        duration: ANIM_DURATION.fast,
        useNativeDriver: true,
      }).start();
    }
  }, [pressScale, reduced]);

  // Hover lift on desktop (translateY -4px + shadow).
  const [hovered, setHovered] = useState(false);
  const [liftY] = useState(new Animated.Value(0));
  useEffect(() => {
    if (reduced || Platform.OS !== 'web') {
      liftY.setValue(0);
      return;
    }
    Animated.timing(liftY, {
      toValue: hovered ? -4 : 0,
      duration: ANIM_DURATION.fast,
      easing: ANIM_EASING,
      useNativeDriver: true,
    }).start();
  }, [hovered, liftY, reduced]);

  // Heart pop animation when favorite state changes.
  const { pop: heartPop, trigger: heartTrigger } = useHeartPop();
  const prevIsFavorite = useRef(isFavorite);
  useEffect(() => {
    if (prevIsFavorite.current !== isFavorite) {
      prevIsFavorite.current = isFavorite;
      heartTrigger();
    }
  }, [isFavorite, heartTrigger]);

  return (
    <Animated.View
      style={[
        styles.card,
        { borderRadius: cardRadius },
        {
          opacity: fade,
          transform: [{ translateY: slide }, { scale: pressScale }],
        },
        style,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${listing.title}, ${formatPeso(
          listing.price,
        )}, ${listing.meetupSpot}, ${listing.category}, ${
          listing.condition
        }, ${isSample ? 'sample image, ' : ''}${
          isCameraCover ? 'cover photo taken with camera, ' : ''
        }${formatStatus(listing.status)}, posted ${formatRelativeDate(
          listing.createdAt,
        )}`}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={({ pressed }) => [
          styles.cardPress,
          { borderRadius: cardRadius, transform: [{ translateY: liftY }] },
          hovered && styles.cardHovered,
          pressed && styles.pressed,
        ]}
      >
        <View
          style={[
            styles.imageWrap,
            {
              borderTopLeftRadius: cardRadius,
              borderTopRightRadius: cardRadius,
            },
          ]}
        >
          <ListingImage listing={listing} style={styles.image} />

          {isFresh ? <GlowPulse color={colors.accent} size={30} active /> : null}

          <View style={styles.conditionChip}>
            <Text style={styles.conditionText}>{listing.condition}</Text>
          </View>

          {listing.status !== 'available' ? (
            <StatusBadge status={listing.status} style={styles.statusBadge} />
          ) : null}

          {isSample ? (
            <SampleImageBadge compact={isMobile} style={styles.cornerBadge} />
          ) : isCameraCover ? (
            <View
              style={styles.cameraBadge}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Ionicons
                name="camera-outline"
                size={14}
                color={colors.primary}
              />
            </View>
          ) : null}
        </View>

        <View style={[styles.body, { padding: cardPadding }]}>
          <Text style={[styles.price, isMobile && { fontSize: fontSizes.md, lineHeight: lineHeights.md }]}>{formatPeso(listing.price)}</Text>
          <Text style={[styles.title, isMobile && { fontSize: fontSizes.xs }]} numberOfLines={2}>
            {listing.title}
          </Text>

          <View style={[styles.sellerRow, isMobile && { marginTop: spacing.xs - 1 }]}>
            <Text style={[styles.sellerName, isMobile && { fontSize: fontSizes.xs - 1 }]} numberOfLines={1}>
              {sellerFirstName}
            </Text>
            <VerifiedPill />
            {rating ? (
              <Rating
                average={rating.average}
                count={rating.count}
                showNew={false}
                style={styles.rating}
              />
            ) : null}
          </View>
        </View>
      </Pressable>

      {/* Sibling, not a child, of the card button: nested <button> is invalid. */}
      {showFavorite ? (
        <Animated.View
          style={[
            styles.heart,
            { transform: [{ scale: heartPop }] },
            isFavorite && styles.heartActive,
          ]}
        >
          <RoundIconButton
            icon={isFavorite ? 'heart' : 'heart-outline'}
            iconColor={isFavorite ? colors.favorite : colors.textMuted}
            accessibilityLabel={
              isFavorite
                ? `Remove ${listing.title} from saved`
                : `Save ${listing.title}`
            }
            onPress={onToggleFavorite}
            size={heartSize}
          />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  card: {
    // The responsive grid passes an explicit width. `flex: 1` would set
    // flex-basis to 0 and collapse the card on web, so grow/shrink stay off.
    flexGrow: 0,
    flexShrink: 0,
    position: 'relative',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  cardPress: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  cardHovered: {
    transform: [{ translateY: -2 }],
  },
  pressed: {
    opacity: 0.9,
  },
  imageWrap: {
    position: 'relative',
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  conditionChip: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    zIndex: 1,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  conditionText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs - 2,
    lineHeight: lineHeights.xs - 4,
    color: colors.label,
  },
  statusBadge: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    zIndex: 1,
  },
  cornerBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    zIndex: 1,
  },
  cameraBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  heart: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 2,
  },
  heartActive: {
    backgroundColor: colors.favoriteSoft,
  },
  body: {
    padding: spacing.md,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
  title: {
    marginTop: 2,
    minHeight: lineHeights.sm * 2,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  sellerRow: {
    marginTop: spacing.sm - 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 1,
  },
  sellerName: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs - 1,
    lineHeight: lineHeights.xs,
    color: colors.text,
  },
  rating: {
    marginLeft: 'auto',
  },
}));
