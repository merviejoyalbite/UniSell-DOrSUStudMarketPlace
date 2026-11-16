import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import {
  ensureChat as ensureChatRequest,
  getChatThreadsForUser,
  markChatRead,
  sendChatMessage,
} from '../api/messagesApi';
import type {
  Chat,
  ChatMessage,
  ChatsState,
  ChatThread,
} from '../types';
import { useAuth } from './AuthContext';

/**
 * MessagesContext owns the signed-in student's conversations and unread count.
 *
 * The Messages tab badge, the inbox and the chat screen read the same list.
 * Message reads/writes happen in the API layer, which re-checks that the
 * session is one of the two participants.
 */

type ChatsAction =
  | { type: 'LOAD_START' }
  | { type: 'REFRESH_START' }
  | { type: 'LOAD_SUCCESS'; chats: ChatThread[] }
  | { type: 'LOAD_ERROR'; message: string }
  | {
      type: 'UPDATE_CHAT';
      chatId: number;
      lastMessage: string;
      lastMessageAt: string;
    }
  | { type: 'MARK_CHAT_READ'; chatId: number }
  | { type: 'RESET' };

const initialState: ChatsState = {
  chats: [],
  status: 'idle',
  error: null,
  refreshing: false,
};

function chatsReducer(state: ChatsState, action: ChatsAction): ChatsState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, status: 'loading', error: null, refreshing: false };
    case 'REFRESH_START':
      // Keep the current list visible while the silent reload runs.
      return { ...state, refreshing: true, error: null };
    case 'LOAD_SUCCESS':
      return {
        ...state,
        chats: action.chats,
        status: 'ready',
        error: null,
        refreshing: false,
      };
    case 'LOAD_ERROR':
      return {
        ...state,
        status: state.chats.length > 0 ? 'ready' : 'error',
        error: action.message,
        refreshing: false,
      };
    case 'UPDATE_CHAT': {
      const updated = state.chats.map((chat) =>
        chat.id === action.chatId
          ? {
              ...chat,
              lastMessage: action.lastMessage,
              lastMessageAt: action.lastMessageAt,
            }
          : chat,
      );

      // Sending a message moves the thread to the top of the inbox.
      updated.sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime(),
      );

      return { ...state, chats: updated };
    }
    case 'MARK_CHAT_READ':
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.chatId ? { ...chat, unreadCount: 0 } : chat,
        ),
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface MessagesContextValue extends ChatsState {
  /** Total unread messages across every conversation. */
  unreadCount: number;
  /** Reload the signed-in student's conversations. */
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  /** Find or create the buyer's thread for a listing. */
  ensureChat: (listingId: number) => Promise<Chat>;
  /** Send a message and update the inbox preview. */
  sendMessage: (chatId: number, body: string) => Promise<ChatMessage>;
  /** Clear the unread badge for a chat the student has opened. */
  markAsRead: (chatId: number) => Promise<void>;
}

const MessagesContext = createContext<MessagesContextValue | undefined>(
  undefined,
);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(chatsReducer, initialState);
  const userId = user?.id;

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!userId) {
        dispatch({ type: 'RESET' });
        return;
      }

      dispatch({ type: options?.silent ? 'REFRESH_START' : 'LOAD_START' });

      try {
        const chats = await getChatThreadsForUser();
        dispatch({ type: 'LOAD_SUCCESS', chats });
      } catch (error) {
        dispatch({
          type: 'LOAD_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Could not load your conversations.',
        });
      }
    },
    [userId],
  );

  // Load when a student signs in, clear when they sign out.
  useEffect(() => {
    if (!userId) {
      dispatch({ type: 'RESET' });
      return;
    }

    void refresh();
  }, [userId, refresh]);

  const ensureChat = useCallback(
    async (listingId: number) => {
      const chat = await ensureChatRequest(listingId);
      // Keep the inbox current in the background; navigation should not wait
      // for the extra reload.
      void refresh({ silent: true });
      return chat;
    },
    [refresh],
  );

  const sendMessage = useCallback(
    async (chatId: number, body: string) => {
      const message = await sendChatMessage(chatId, body);
      dispatch({
        type: 'UPDATE_CHAT',
        chatId,
        lastMessage: message.body,
        lastMessageAt: message.createdAt,
      });
      return message;
    },
    [],
  );

  const markAsRead = useCallback(async (chatId: number) => {
    await markChatRead(chatId);
    dispatch({ type: 'MARK_CHAT_READ', chatId });
  }, []);

  const unreadCount = useMemo(
    () => state.chats.reduce((total, chat) => total + chat.unreadCount, 0),
    [state.chats],
  );

  const value = useMemo<MessagesContextValue>(
    () => ({
      ...state,
      unreadCount,
      refresh,
      ensureChat,
      sendMessage,
      markAsRead,
    }),
    [state, unreadCount, refresh, ensureChat, sendMessage, markAsRead],
  );

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages(): MessagesContextValue {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used inside <MessagesProvider>.');
  }
  return context;
}
