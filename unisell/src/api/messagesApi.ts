import { apiClient, ApiError } from './apiClient';
import type {
  Chat,
  ChatMessage,
  ChatThread,
  Listing,
  User,
} from '../types';
import { NOT_SIGNED_IN_ERROR } from '../utils/permissions';
import { loadSession } from '../utils/storage';

/**
 * Message data access (Phase 3).
 *
 * json-server has no authentication, so this service layer is the demo's last
 * line of defence. Every read and write re-reads the signed-in student from the
 * persisted session and confirms they are one of the two participants:
 *   - the buyer who started the thread, or
 *   - the seller who owns the listing.
 *
 * A thread is unique per listing + buyer. `ensureChat` reuses an existing
 * thread, so opening "Message seller" twice never creates duplicates.
 */

export const CHAT_OWN_LISTING_ERROR =
  'You cannot message yourself about your own listing.';
export const CHAT_OWNERSHIP_ERROR =
  'You can only open your own conversations.';
export const MESSAGE_EMPTY_ERROR = 'Write a message before sending.';

/** Read the signed-in student from the persisted session, never a screen. */
async function getSessionUser(): Promise<User> {
  const user = await loadSession();
  if (!user) throw new ApiError(NOT_SIGNED_IN_ERROR, 401);
  return user;
}

/** Oldest first, so the chat screen renders naturally. */
function oldestFirst(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

/** Load a chat and confirm the signed-in student is a participant. */
async function loadChatForUser(chatId: number, user: User): Promise<Chat> {
  const chat = await apiClient.get<Chat>(`/chats/${chatId}`);

  if (chat.buyerId !== user.id && chat.sellerId !== user.id) {
    throw new ApiError(CHAT_OWNERSHIP_ERROR, 403);
  }

  return chat;
}

async function loadMessages(chatId: number): Promise<ChatMessage[]> {
  const messages = await apiClient.get<ChatMessage[]>(
    `/chatMessages?chatId=${chatId}`,
  );
  return oldestFirst(messages);
}

function threadFromChat(
  chat: Chat,
  messages: ChatMessage[],
  userId: number,
): ChatThread {
  const last = messages[messages.length - 1];

  return {
    ...chat,
    lastMessage: last?.body ?? '',
    lastMessageAt: last?.createdAt ?? chat.updatedAt ?? chat.createdAt,
    unreadCount: messages.filter(
      (message) => message.senderId !== userId && !message.read,
    ).length,
  };
}

/**
 * Load every conversation the signed-in student can see, newest activity first.
 *
 * Network failures propagate so the inbox can show its error state and retry
 * instead of pretending the student has no conversations.
 */
export async function getChatThreadsForUser(): Promise<ChatThread[]> {
  const user = await getSessionUser();

  const [asBuyer, asSeller] = await Promise.all([
    apiClient.get<Chat[]>(`/chats?buyerId=${user.id}`),
    apiClient.get<Chat[]>(`/chats?sellerId=${user.id}`),
  ]);

  const byId = new Map<number, Chat>();
  [...asBuyer, ...asSeller].forEach((chat) => {
    byId.set(chat.id, chat);
  });

  const threads = await Promise.all(
    [...byId.values()].map(async (chat) => {
      const messages = await loadMessages(chat.id);
      return threadFromChat(chat, messages, user.id);
    }),
  );

  return threads.sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() -
      new Date(a.lastMessageAt).getTime(),
  );
}

/** Load one chat after confirming the session is a participant. */
export async function getChatForUser(chatId: number): Promise<Chat> {
  const user = await getSessionUser();
  return loadChatForUser(chatId, user);
}

/** Load one chat's messages, oldest first, after an ownership check. */
export async function getChatMessages(chatId: number): Promise<ChatMessage[]> {
  const user = await getSessionUser();
  await loadChatForUser(chatId, user);
  return loadMessages(chatId);
}

/**
 * Find or create the signed-in buyer's thread with a listing's seller.
 *
 * Sellers cannot start a thread about their own listing; they reply from the
 * inbox instead. The listing snapshot is stored once and never overwritten, so
 * an old thread still reads correctly after an edit.
 */
export async function ensureChat(listingId: number): Promise<Chat> {
  const user = await getSessionUser();
  const listing = await apiClient.get<Listing>(`/listings/${listingId}`);

  if (listing.sellerId === user.id) {
    throw new ApiError(CHAT_OWN_LISTING_ERROR, 403);
  }

  const existing = await apiClient.get<Chat[]>(
    `/chats?listingId=${listingId}&buyerId=${user.id}`,
  );
  if (existing.length > 0) return existing[0];

  const now = new Date().toISOString();

  return apiClient.post<Chat>('/chats', {
    listingId,
    buyerId: user.id,
    sellerId: listing.sellerId,
    buyerName: user.name,
    sellerName: listing.sellerName,
    listingTitle: listing.title,
    listingPrice: listing.price,
    listingImage: listing.image ?? listing.images?.[0] ?? null,
    listingCategory: listing.category,
    listingStatus: listing.status,
    createdAt: now,
    updatedAt: now,
    sample: false,
  });
}

/**
 * Find or create the chat thread for a listing + buyer, from either side of
 * the conversation. Used by the seller after accepting a reserve request so
 * they can message the buyer directly.
 *
 * Unlike `ensureChat` (buyer-only), this works for sellers too: it looks up an
 * existing thread matching listingId+buyerId+sellerId and creates one if none
 * exists yet. Only listingId/buyerId/sellerId are required; the listing
 * snapshot is fetched from the server.
 */
export async function findOrCreateChatForListing({
  listingId,
  buyerId,
  sellerId,
}: {
  listingId: number;
  buyerId: number;
  sellerId: number;
}): Promise<Chat> {
  const listing = await apiClient.get<Listing>(`/listings/${listingId}`);

  const existing = await apiClient.get<Chat[]>(
    `/chats?listingId=${listingId}&buyerId=${buyerId}&sellerId=${sellerId}`,
  );
  if (existing.length > 0) return existing[0];

  const now = new Date().toISOString();

  return apiClient.post<Chat>('/chats', {
    listingId,
    buyerId,
    sellerId,
    buyerName: '',
    sellerName: listing.sellerName,
    listingTitle: listing.title,
    listingPrice: listing.price,
    listingImage: listing.image ?? listing.images?.[0] ?? null,
    listingCategory: listing.category,
    listingStatus: listing.status,
    createdAt: now,
    updatedAt: now,
    sample: false,
  });
}

/**
 * Send one message and bump the thread so it floats to the top of both inboxes.
 *
 * The message starts unread for the recipient; opening the chat marks every
 * incoming message read (see `markChatRead`).
 */
export async function sendChatMessage(
  chatId: number,
  body: string,
): Promise<ChatMessage> {
  const user = await getSessionUser();
  await loadChatForUser(chatId, user);

  const trimmed = body.trim();
  if (!trimmed) throw new ApiError(MESSAGE_EMPTY_ERROR, 400);

  const now = new Date().toISOString();
  const message = await apiClient.post<ChatMessage>('/chatMessages', {
    chatId,
    senderId: user.id,
    body: trimmed,
    createdAt: now,
    read: false,
    sample: false,
  });

  await apiClient.patch<Chat>(`/chats/${chatId}`, { updatedAt: now });

  return message;
}

/**
 * Mark every incoming message in a chat as read.
 *
 * Called when the chat screen opens and after polling finds new messages. The
 * ownership check runs first so a student cannot clear someone else's unread
 * state.
 */
export async function markChatRead(chatId: number): Promise<void> {
  const user = await getSessionUser();
  await loadChatForUser(chatId, user);

  const messages = await loadMessages(chatId);
  const unread = messages.filter(
    (message) => message.senderId !== user.id && !message.read,
  );

  await Promise.all(
    unread.map((message) =>
      apiClient.patch<ChatMessage>(`/chatMessages/${message.id}`, {
        read: true,
      }),
    ),
  );
}
