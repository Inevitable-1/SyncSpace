import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessageItem from './ChatMessageItem';
import ChatInput from './ChatInput';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { fetchMessages, clearMessages } from '../../features/chat/chatSlice';
import type { RootState } from '../../store';
import type { ChatMessage } from '../../types';

interface ChatPanelProps {
  roomId: string;
  onSendMessage: (content: string, type?: string, replyTo?: string) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onMarkSeen: () => void;
}

export default function ChatPanel({
  roomId,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onTypingStart,
  onTypingStop,
  onMarkSeen,
}: ChatPanelProps) {
  const dispatch = useAppDispatch();
  const { messages, isLoading, typingUsers } = useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.auth);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    dispatch(clearMessages());
    void dispatch(fetchMessages({ roomId, limit: 50 }));
  }, [dispatch, roomId]);

  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  useEffect(() => {
    onMarkSeen();
  }, [messages, onMarkSeen]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  }, []);

  const handleSend = useCallback(
    (content: string, type?: string) => {
      onSendMessage(content, type, replyTo?._id);
      setReplyTo(null);
    },
    [onSendMessage, replyTo],
  );

  const otherTypingUsers = typingUsers.filter((t) => t.userId !== user?.id);

  return (
    <div
      className="flex flex-col h-full border border-[var(--border-color)] rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-card)' }}
    >
      <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center gap-2">
        <svg
          className="w-5 h-5 text-[var(--text-tertiary)]"
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

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1"
        style={{ background: 'var(--bg-secondary)' }}
      >
        {isLoading && messages.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-3">
              <svg
                className="w-7 h-7 text-[var(--text-tertiary)]"
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

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const prevMsg = i > 0 ? messages[i - 1] : null;
            const showSender =
              !prevMsg ||
              (typeof prevMsg.sender === 'string'
                ? prevMsg.sender
                : (prevMsg.sender as unknown as { _id: string })._id) !==
                (typeof msg.sender === 'string'
                  ? msg.sender
                  : (msg.sender as unknown as { _id: string })._id);

            return (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <ChatMessageItem
                  message={msg}
                  isOwn={
                    (typeof msg.sender === 'string'
                      ? msg.sender
                      : (msg.sender as unknown as { _id: string })._id) === user?.id
                  }
                  showSender={showSender}
                  onReply={() => setReplyTo(msg)}
                  onEdit={(content) => onEditMessage(msg._id, content)}
                  onDelete={() => onDeleteMessage(msg._id)}
                  replyToMessage={
                    msg.replyTo
                      ? typeof msg.replyTo === 'object'
                        ? msg.replyTo
                        : messages.find((m) => m._id === msg.replyTo) || null
                      : null
                  }
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      <AnimatePresence>
        {otherTypingUsers.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 border-t border-[var(--border-color)]"
            style={{ background: 'var(--bg-secondary)' }}
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

      {replyTo && (
        <div
          className="px-4 py-2 border-t border-[var(--border-color)] flex items-center gap-2"
          style={{ background: 'var(--bg-tertiary)' }}
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
            className="p-0.5 rounded hover:bg-[var(--bg-hover)]"
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

      <ChatInput onSend={handleSend} onTypingStart={onTypingStart} onTypingStop={onTypingStop} />
    </div>
  );
}
