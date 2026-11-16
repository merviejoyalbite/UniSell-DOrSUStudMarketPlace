import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getChatForUser, getChatMessages } from '../api/messagesApi';
import { ErrorBanner } from '../components/ErrorBanner';
import { AppTextInput } from '../components/AppTextInput';
import { RoundIconButton } from '../components/RoundIconButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useListings } from '../context/ListingsContext';
import { useMessages } from '../context/MessagesContext';
import { useNotifications } from '../context/NotificationsContext';
import type { RootStackScreenProps } from '../navigation/types';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  layout,
  lineHeights,
  radii,
  spacing,
  useTheme,
} from '../theme';
import type { Chat, ChatMessage } from '../types';
import { getCategoryMeta } from '../utils/categoryMeta';
import {
  formatChatDay,
  formatMessageTime,
} from '../utils/chatFormatters';
import { formatPeso } from '../utils/formatters';
import { resolveImageUri } from '../utils/images';

const QUICK_REPLIES = [
  'Is this still available?',
  'Can you lower the price?',
  'Can we meet tomorrow?',
] as const;

/** Poll interval for messages sent by the other participant. */
const POLL_INTERVAL_MS = 10_000;

interface MessageGroup {
  key: string;
  label: string;
  messages: ChatMessage[];
}

function groupMessages(messages: ChatMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];

  messages.forEach((message) => {
    const date = new Date(message.createdAt);
    const key = Number.isNaN(date.getTime())
      ? message.createdAt
      : date.toDateString();
    const last = groups[groups.length - 1];

    if (last && last.key === key) {
      last.messages.push(message);
      return;
    }

    groups.push({
      key,
      label: formatChatDay(message.createdAt),
      messages: [message],
    });
  });

  return groups;
}

/**
 * One conversation thread (Phase 3).
 *
 * Mirrors the Figma chat screen: a compact header with the other student and a
 * verified role, a tappable "Chatting about" listing card, a Today/Yesterday
 * message timeline with sent/received bubbles, quick replies and a rounded
 * composer.
 *
 * The thread is refreshed every 10 seconds while the screen is focused so a
 * reply from the other participant appears without a socket backend. Opening
 * the chat marks every incoming message read, which clears the inbox dot.
 */
export function ChatScreen({ navigation, route }: RootStackScreenProps<'Chat'>) {
  const { chatId } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { listings } = useListings();
  const { chats, sendMessage, markAsRead } = useMessages();
  const { unreadCount: notificationUnread } = useNotifications();

  const contextChat = chats.find((chat) => chat.id === chatId);
  const [fetchedChat, setFetchedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const chat = fetchedChat ?? contextChat;

  // The inbox normally has the chat already. Fetch it directly as a fallback so
  // a cold open (for example after a reload) still works.
  useEffect(() => {
    let active = true;

    getChatForUser(chatId)
      .then((value) => {
        if (active) setFetchedChat(value);
      })
      .catch(() => {
        // `contextChat` may still be available; the message load surfaces the
        // real error if neither source has the thread.
      });

    return () => {
      active = false;
    };
  }, [chatId]);

  const loadMessages = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setStatus('loading');

      try {
        const next = await getChatMessages(chatId);
        setMessages(next);
        setStatus('ready');
        setError(null);

        // The reader is looking at the thread, so clear the unread dot and the
        // per-message read receipts. Best-effort: a failed write never blocks
        // the conversation.
        if (next.some((message) => message.senderId !== user?.id && !message.read)) {
          void markAsRead(chatId).catch(() => undefined);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Could not load this conversation.',
        );
        setStatus((previous) => (previous === 'ready' ? 'ready' : 'error'));
      }
    },
    [chatId, markAsRead, user?.id],
  );

  // Load on focus and poll while the chat is open. The timer stops when the
  // student navigates away, so a background chat does not keep making requests.
  useFocusEffect(
    useCallback(() => {
      void loadMessages();

      const timer = setInterval(() => {
        void loadMessages({ silent: true });
      }, POLL_INTERVAL_MS);

      return () => clearInterval(timer);
    }, [loadMessages]),
  );

  const groups = useMemo(() => groupMessages(messages), [messages]);

  const liveListing = chat
    ? listings.find((listing) => listing.id === chat.listingId)
    : undefined;
  const listingStatus =
    liveListing?.status ?? chat?.listingStatus ?? 'available';
  const listingTitle = liveListing?.title ?? chat?.listingTitle ?? 'this item';
  const listingPrice = liveListing?.price ?? chat?.listingPrice ?? 0;
  const listingImage = liveListing?.image ?? chat?.listingImage ?? null;
  const listingCategory =
    liveListing?.category ?? chat?.listingCategory ?? 'Others';
  const imageUri = resolveImageUri(listingImage);
  const categoryMeta = getCategoryMeta(listingCategory);
  const categoryPalette =
    colors.categories[listingCategory] ?? colors.categories.Others;

  const isBuyer = chat?.buyerId === user?.id;
  const otherName = chat
    ? isBuyer
      ? chat.sellerName
      : chat.buyerName
    : 'Conversation';
  const otherRole = chat
    ? isBuyer
      ? 'Verified seller'
      : 'Verified buyer'
    : 'Campus conversation';

  function scrollToEnd() {
    scrollRef.current?.scrollToEnd({ animated: false });
  }

  async function handleSend(text?: string) {
    const body = (text ?? draft).trim();
    if (!body || sending) return;

    setSending(true);
    setSendError(null);

    try {
      const message = await sendMessage(chatId, body);
      setMessages((previous) => [...previous, message]);
      setDraft('');
    } catch (sendFailure) {
      setSendError(
        sendFailure instanceof Error
          ? sendFailure.message
          : 'Could not send your message. Please try again.',
      );
    } finally {
      setSending(false);
    }
  }

  function renderBubble(message: ChatMessage) {
    const mine = message.senderId === user?.id;

    return (
      <View
        key={message.id}
        style={[
          styles.bubbleRow,
          mine ? styles.bubbleRowMine : styles.bubbleRowOther,
        ]}
      >
        <View
          style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}
        >
          <Text
            style={[styles.bubbleText, mine && styles.bubbleTextMine]}
          >
            {message.body}
          </Text>
          <Text
            style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}
          >
            {formatMessageTime(message.createdAt)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScreenContainer
      avoidKeyboard
      padded={false}
      maxWidth={layout.maxFormWidth}
    >
      <View style={styles.page}>
        <View style={styles.top}>
          <View style={styles.header}>
            <RoundIconButton
              icon="arrow-back"
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
              size={44}
            />
            <View style={styles.heading}>
              <Text
                accessibilityRole="header"
                style={styles.title}
                numberOfLines={1}
              >
                {otherName}
              </Text>
              <Text style={styles.subtitle}>{otherRole}</Text>
            </View>
            <RoundIconButton
              icon="notifications-outline"
              accessibilityLabel={
                notificationUnread > 0
                  ? `Notifications, ${notificationUnread} unread`
                  : 'Notifications'
              }
              dot={notificationUnread > 0}
              onPress={() => navigation.navigate('Notifications')}
            />
          </View>

          {chat ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${listingTitle}`}
              onPress={() =>
                navigation.navigate('ListingDetails', {
                  listingId: chat.listingId,
                })
              }
              style={({ pressed }) => [
                styles.pinned,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.pinnedThumbWrap}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    contentFit="cover"
                    transition={150}
                    style={styles.pinnedThumb}
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <View
                    style={[
                      styles.pinnedThumb,
                      { backgroundColor: categoryPalette.tint },
                    ]}
                  >
                    <Ionicons
                      name={categoryMeta.icon}
                      size={22}
                      color={categoryPalette.color}
                    />
                  </View>
                )}
              </View>

              <View style={styles.pinnedCopy}>
                <Text style={styles.pinnedLabel}>Chatting about</Text>
                <Text style={styles.pinnedTitle} numberOfLines={1}>
                  {listingTitle}
                </Text>
                <Text style={styles.pinnedPrice}>
                  {formatPeso(listingPrice)}
                </Text>
              </View>

              <StatusBadge status={listingStatus} style={styles.pinnedBadge} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToEnd}
        >
          {error && messages.length > 0 ? (
            <ErrorBanner
              message={error}
              onRetry={() => {
                void loadMessages();
              }}
            />
          ) : null}

          {status === 'loading' && messages.length === 0 ? (
            <View style={styles.loadingState}>
              <ActivityIndicator
                size="small"
                color={colors.primary}
                accessibilityLabel="Loading messages"
              />
              <Text style={styles.loadingText}>Loading messages…</Text>
            </View>
          ) : status === 'error' && messages.length === 0 ? (
            <ErrorBanner
              message={error}
              onRetry={() => {
                void loadMessages();
              }}
            />
          ) : messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <Text style={styles.emptyTitle}>Say hello</Text>
              <Text style={styles.emptyMessage}>
                Start the conversation about {listingTitle}.
              </Text>
            </View>
          ) : (
            groups.map((group) => (
              <View key={group.key}>
                <View style={styles.dayDivider}>
                  <View style={styles.dayChip}>
                    <Text style={styles.dayText}>{group.label}</Text>
                  </View>
                </View>
                {group.messages.map(renderBubble)}
              </View>
            ))
          )}
        </ScrollView>

        <View
          style={[
            styles.composer,
            { paddingBottom: Math.max(insets.bottom, spacing.md) },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickScroll}
            contentContainerStyle={styles.quickReplies}
            keyboardShouldPersistTaps="handled"
          >
            {QUICK_REPLIES.map((reply) => (
              <Pressable
                key={reply}
                accessibilityRole="button"
                accessibilityLabel={`Send quick reply: ${reply}`}
                accessibilityState={{ disabled: sending }}
                disabled={sending}
                onPress={() => {
                  void handleSend(reply);
                }}
                style={({ pressed }) => [
                  styles.quickReply,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.quickReplyText}>{reply}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {sendError ? <ErrorBanner message={sendError} /> : null}

          <View style={styles.composerRow}>
            <AppTextInput
              value={draft}
              onChangeText={(value) => {
                setDraft(value);
                if (sendError) setSendError(null);
              }}
              onSubmitEditing={() => {
                void handleSend();
              }}
              placeholder="Type a message…"
              placeholderTextColor={colors.placeholder}
              returnKeyType="send"
              editable={!sending}
              containerStyle={{ flex: 1 }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityState={{
                disabled: !draft.trim() || sending,
                busy: sending,
              }}
              disabled={!draft.trim() || sending}
              onPress={() => {
                void handleSend();
              }}
              style={({ pressed }) => [
                styles.sendButton,
                (!draft.trim() || sending) && styles.sendButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Ionicons name="send" size={20} color={colors.onPrimary} />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  page: {
    flex: 1,
  },
  top: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
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
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  pinned: {
    minHeight: 89,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  pinnedThumbWrap: {
    width: 54,
    height: 54,
    borderRadius: 14,
    overflow: 'hidden',
    flexShrink: 0,
  },
  pinnedThumb: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  pinnedLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  pinnedTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  pinnedPrice: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.primary,
  },
  pinnedBadge: {
    alignSelf: 'center',
    flexShrink: 0,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.text,
  },
  emptyMessage: {
    maxWidth: 300,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  dayDivider: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dayChip: {
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dayText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 17,
    borderWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 7,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderBottomRightRadius: 5,
  },
  bubbleOther: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.cardBorder,
    borderBottomLeftRadius: 5,
  },
  bubbleText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.text,
  },
  bubbleTextMine: {
    color: colors.onPrimary,
  },
  bubbleTime: {
    marginTop: 4,
    alignSelf: 'flex-end',
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
  bubbleTimeMine: {
    color: colors.onPrimary,
    opacity: 0.72,
  },
  composer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  quickScroll: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  quickReplies: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  quickReply: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  quickReplyText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.primary,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.text,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
}));
