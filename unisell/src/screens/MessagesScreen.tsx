import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { BellMotion, EmptyFloat } from '../components/motion';
import { RoundIconButton } from '../components/RoundIconButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SearchPill } from '../components/SearchPill';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../context/MessagesContext';
import { useNotifications } from '../context/NotificationsContext';
import { useTabBarBottomInset } from '../navigation/useTabBarBottomInset';
import type { MainTabScreenProps } from '../navigation/types';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  spacing,
  useBreakpoint,
  useTheme,
} from '../theme';
import type { ChatThread } from '../types';
import { getCategoryMeta } from '../utils/categoryMeta';
import { formatChatListTime } from '../utils/chatFormatters';
import { resolveImageUri } from '../utils/images';

/**
 * Messages inbox (Phase 3).
 *
 * Mirrors the Figma "Messages / Your campus conversations" screen: a search
 * pill and glass conversation cards with the listing thumbnail, the other
 * student + verified check, a relative time, the listing title in teal and the
 * last message preview. Unread threads get the small blue dot.
 *
 * The green Figma "online" dot is intentionally omitted: there is no presence
 * backend in the mock API, so the app does not claim anyone is online.
 */
export function MessagesScreen({ navigation }: MainTabScreenProps<'Messages'>) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles();
  const tabBarBottomInset = useTabBarBottomInset();
  const { width, isMobile } = useBreakpoint();
  const { chats, status, error, refresh } = useMessages();
  const { unreadCount: notificationUnread } = useNotifications();

  const [query, setQuery] = useState('');

  // Pick up messages sent while this tab was closed. Silent so the cached list
  // stays visible instead of flashing a spinner.
  useFocusEffect(
    useCallback(() => {
      void refresh({ silent: true });
    }, [refresh]),
  );

  const filteredChats = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return chats;

    return chats.filter((chat) => {
      const otherName =
        chat.buyerId === user?.id ? chat.sellerName : chat.buyerName;

      return [otherName, chat.listingTitle, chat.lastMessage].some((value) =>
        value.toLowerCase().includes(term),
      );
    });
  }, [chats, query, user?.id]);

  const isLoading =
    (status === 'loading' || status === 'idle') && chats.length === 0;

  function openChat(chat: ChatThread) {
    navigation.navigate('Chat', { chatId: chat.id });
  }

  function renderChat(chat: ChatThread) {
    const isBuyer = chat.buyerId === user?.id;
    const otherName = isBuyer ? chat.sellerName : chat.buyerName;
    const imageUri = resolveImageUri(chat.listingImage);
    const meta = getCategoryMeta(chat.listingCategory);
    const palette =
      colors.categories[chat.listingCategory] ?? colors.categories.Others;
    const time = formatChatListTime(chat.lastMessageAt);
    const preview = chat.lastMessage || 'Start the conversation';
    const hasUnread = chat.unreadCount > 0;

    return (
      <Pressable
        key={chat.id}
        accessibilityRole="button"
        accessibilityLabel={`${otherName}. ${chat.listingTitle}. ${preview}. ${time}${
          hasUnread ? `, ${chat.unreadCount} unread` : ''
        }`}
        onPress={() => openChat(chat)}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.thumbWrap}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              contentFit="cover"
              transition={150}
              style={styles.thumb}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={[styles.thumb, { backgroundColor: palette.tint }]}>
              <Ionicons name={meta.icon} size={24} color={palette.color} />
            </View>
          )}
        </View>

        <View style={styles.copy}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {otherName}
            </Text>
            <Ionicons
              name="checkmark-circle"
              size={13}
              color={colors.verified}
              style={styles.verifiedIcon}
              accessibilityLabel="Verified DOrSU student"
            />
            <Text style={styles.time}>{time}</Text>
          </View>

          <Text style={styles.listingTitle} numberOfLines={1}>
            {chat.listingTitle}
          </Text>

          <View style={styles.previewRow}>
            <Text style={styles.preview} numberOfLines={1}>
              {preview}
            </Text>
            {hasUnread ? (
              <View
                style={styles.unreadDot}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <ScreenContainer scroll bottomInset={isMobile ? tabBarBottomInset : 0}>
      <View style={styles.page}>
        <View style={styles.header}>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>
              Messages
            </Text>
            <Text style={styles.subtitle}>Your campus conversations</Text>
          </View>
          <BellMotion unreadCount={notificationUnread}>
            <RoundIconButton
              icon="notifications-outline"
              accessibilityLabel={
                notificationUnread > 0
                  ? `Notifications, ${notificationUnread} unread`
                  : 'Notifications'
              }
              onPress={() => navigation.navigate('Notifications')}
            />
          </BellMotion>
        </View>

        <SearchPill
          placeholder="Search conversations"
          accessibilityLabel="Search conversations"
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />

        {error ? (
          <ErrorBanner
            message={error}
            onRetry={() => {
              void refresh();
            }}
          />
        ) : null}

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator
              size="small"
              color={colors.primary}
              accessibilityLabel="Loading conversations"
            />
            <Text style={styles.loadingText}>Loading conversations…</Text>
          </View>
        ) : chats.length === 0 ? (
          error ? null : (
            <EmptyFloat>
              <EmptyState
                icon="chatbubbles-outline"
                title="No messages yet"
                message="Start a conversation from a listing and it will appear here."
                actionLabel="Browse listings"
                onAction={() => navigation.navigate('Home')}
              />
            </EmptyFloat>
          )
        ) : filteredChats.length === 0 ? (
          <Text style={styles.noResults}>
            No conversations match your search.
          </Text>
        ) : (
          <View style={styles.list}>{filteredChats.map(renderChat)}</View>
        )}
      </View>
    </ScreenContainer>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  page: {
    width: '100%',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heading: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  search: {
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: 11,
    ...shadows.card,
  },
  thumbWrap: {
    width: 58,
    height: 58,
    borderRadius: 17,
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumb: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  verifiedIcon: {
    flexShrink: 0,
  },
  time: {
    marginLeft: 'auto',
    flexShrink: 0,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  listingTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.primary,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  preview: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.unread,
    flexShrink: 0,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxxl,
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  noResults: {
    marginTop: spacing.xxl,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.75,
  },
}));
