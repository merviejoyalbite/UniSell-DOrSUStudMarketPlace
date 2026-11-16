import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Listing } from '../types';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  radii,
  spacing,
} from '../theme';
import { ListingImage } from './ListingImage';
import { VerifiedCheck } from './VerifiedBadge';

interface ConversationRowProps {
  listing: Listing;
  /** The other student's display name. */
  otherName: string;
  /** Already formatted, e.g. "10:38 AM" or "Yesterday". */
  time: string;
  /** Last message preview. */
  preview: string;
  online?: boolean;
  unread?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Message list row: listing thumbnail, other student's name with a blue
 * verified check, time, product title in teal, message preview, online dot and
 * unread dot. Used by the Messages screen.
 */
export function ConversationRow({
  listing,
  otherName,
  time,
  preview,
  online = false,
  unread = false,
  onPress,
  style,
}: ConversationRowProps) {
  const styles = useStyles();

  const content = (
    <>
      <ListingImage listing={listing} style={styles.thumbnail} />

      <View style={styles.textBlock}>
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {otherName}
            </Text>
            <VerifiedCheck size={15} />
            {online ? (
              <View
                accessibilityLabel="Online"
                style={styles.onlineDot}
              />
            ) : null}
          </View>
          <Text style={styles.time}>{time}</Text>
        </View>

        <Text style={styles.productTitle} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text
          style={[styles.preview, unread && styles.previewUnread]}
          numberOfLines={1}
        >
          {preview}
        </Text>
      </View>

      {unread ? (
        <View accessibilityLabel="Unread" style={styles.unreadDot} />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, style]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open conversation with ${otherName} about ${
        listing.title
      }. ${preview}${unread ? '. Unread' : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}
    >
      {content}
    </Pressable>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    ...shadows.card,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },
  thumbnail: {
    width: 58,
    height: 58,
    borderRadius: radii.sm,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nameRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.online,
  },
  time: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs - 2,
    lineHeight: lineHeights.xs - 4,
    color: colors.textMuted,
  },
  productTitle: {
    marginTop: 2,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs - 1,
    lineHeight: lineHeights.xs,
    color: colors.primary,
  },
  preview: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs - 1,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
  previewUnread: {
    fontFamily: fonts.medium,
    color: colors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.unread,
  },
}));
