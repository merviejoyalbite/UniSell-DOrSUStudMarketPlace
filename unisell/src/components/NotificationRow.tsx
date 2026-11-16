import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  radii,
  spacing,
  useTheme,
} from '../theme';

export type NotificationType =
  | 'reserved'
  | 'accepted'
  | 'declined'
  | 'meetup'
  | 'review';

interface NotificationRowProps {
  type: NotificationType;
  title: string;
  body: string;
  /** Relative label such as "10 min · New" or "Mon". */
  meta?: string;
  unread?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const ICONS: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  reserved: 'heart-outline',
  accepted: 'checkmark-circle-outline',
  declined: 'close-circle-outline',
  meetup: 'time-outline',
  review: 'star-outline',
};

/**
 * Notification card: tinted icon tile, title, body, relative time and an
 * unread dot. Types mirror the Figma frame: reserve received, reserve
 * accepted/declined, meetup reminder and new review.
 */
export function NotificationRow({
  type,
  title,
  body,
  meta,
  unread = false,
  onPress,
  style,
}: NotificationRowProps) {
  const { colors } = useTheme();
  const styles = useStyles();

  const iconColor =
    type === 'accepted'
      ? colors.success
      : type === 'declined'
        ? colors.danger
        : type === 'review'
          ? colors.rating
          : type === 'meetup'
            ? colors.primary
            : colors.accentStrong;

  const iconBackground =
    type === 'accepted'
      ? colors.successSoft
      : type === 'declined'
        ? colors.dangerSoft
        : type === 'review'
          ? colors.accentSoft
          : type === 'meetup'
            ? colors.primaryLight
            : colors.accentSoft;

  const content = (
    <>
      <View style={[styles.iconTile, { backgroundColor: iconBackground }]}>
        <Ionicons name={ICONS[type]} size={20} color={iconColor} />
      </View>

      <View style={styles.textBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {unread ? (
            <View
              accessibilityLabel="Unread"
              style={styles.unreadDot}
            />
          ) : null}
        </View>
        <Text style={styles.body} numberOfLines={2}>
          {body}
        </Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.textMuted}
        style={styles.chevron}
      />
    </>
  );

  if (!onPress) {
    return <View style={[styles.card, style]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}${meta ? `. ${meta}` : ''}${
        unread ? '. Unread' : ''
      }`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  card: {
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
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.unread,
  },
  body: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
  meta: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs - 2,
    lineHeight: lineHeights.xs - 4,
    color: colors.textMuted,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
}));
