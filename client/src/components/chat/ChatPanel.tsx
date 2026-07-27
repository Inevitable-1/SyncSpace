import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessageItem from './ChatMessageItem';
import ChatInput from './ChatInput';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { fetchMessages, clearMessages } from '../../features/chat/chatSlice';
import { chatService } from '../../services/chatService';
import type { RootState } from '../../store';
import type { ChatMessage } from '../../types';

interface ChatPanelProps {
  roomId: string;
  workspaceId?: string;
}

export default function ChatPanel({ roomId }: ChatPanelProps) {
  const dispatch = useAppDispatch();
  const { messages, isLoading, typingUsers } = useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.auth);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    dispatch(clearMessages());
    setHasMore(true);
    void dispatch(fetchMessages({ roomId, limit: 50 }));
  }, [dispatch, roomId]);

  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return;
    setIsLoadingMore(true);
    const oldest = messages[0];
    try {
      const result = await dispatch(fetchMessages({ roomId, limit: 50, before: oldest.createdAt }));
      const fetched = result.payload as ChatMessage[] | undefined;
      if (!fetched || fetched.length < 50) {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    }
    setIsLoadingMore(false);
  }, [dispatch, roomId, messages, isLoadingMore, hasMore]);

  const handleSend = useCallback(
    async (content: string, type?: string) => {
      try {
        await chatService.sendMessage(roomId, content, type, replyTo?._id);
        setReplyTo(null);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } catch {
        // silent
      }
    },
    [roomId, replyTo],
  );

  const handleEdit = useCallback(
    async (messageId: string, content: string) => {
      try {
        await chatService.editMessage(messageId, content);
      } catch {
        // silent
      }
    },
    [],
  );

  const handleDelete = useCallback(
    async (messageId: string) => {
      try {
        await chatService.deleteMessage(messageId);
      } catch {
        // silent
      }
    },
    [],
  );

  const otherTypingUsers = typingUsers.filter((t) => t.userId !== user?.id);

  return (
    <div
      className="flex flex-col h-full border rounded-xl overflow-hidden"
      style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-color)' }}>
        <svg
          className="w-5 h-5"
          style={{ color: 'var(--text-tertiary)' }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Room Chat
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {messages.length}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-2 space-y-0.5"
        style={{ background: 'var(--bg-secondary)' }}
      >
        {isLoading && messages.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'var(--bg-tertiary)' }}>
              <svg
                className="w-7 h-7"
                style={{ color: 'var(--text-tertiary)' }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              No messages yet
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Start the conversation!
            </p>
          </div>
        )}

        {hasMore && messages.length > 0 && (
          <div className="flex justify-center py-2">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="text-xs px-3 py-1 rounded-full border hover:opacity-80 transition-opacity disabled:opacity-40"
              style={{
                color: 'var(--text-tertiary)',
                borderColor: 'var(--border-color)',
                background: 'var(--bg-card)',
              }}
            >
              {isLoadingMore ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <ChatMessageItem
                message={msg}
                currentUserId={user?.id ?? ''}
                onReply={(m) => setReplyTo(m)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      <AnimatePresence>
        {otherTypingUsers.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 border-t"
            style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {otherTypingUsers.length === 1
                  ? `${otherTypingUsers[0].userName} is typing...`
                  : `${otherTypingUsers.length} people are typing...`}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply preview bar */}
      {replyTo && (
        <div
          className="px-4 py-2 border-t flex items-center gap-2"
          style={{ borderColor: 'var(--border-color)', background: 'var(--bg-tertiary)' }}
        >
          <svg
            className="w-4 h-4 text-indigo-500 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-indigo-500">
              Replying to {typeof replyTo.sender === 'object' ? replyTo.sender.name : 'message'}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
              {replyTo.content}
            </p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="p-0.5 rounded hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={handleSend} onTypingStart={() => {}} onTypingStop={() => {}} />
    </div>
  );
}
