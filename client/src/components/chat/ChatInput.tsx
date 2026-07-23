import { useState, useRef, useCallback, useEffect } from 'react';
import type { MutableRefObject } from 'react';

interface ChatInputProps {
  onSend: (content: string, type?: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

const EMOJI_LIST = [
  '😀',
  '😂',
  '😍',
  '🤔',
  '👍',
  '👋',
  '🎉',
  '❤️',
  '🔥',
  '✅',
  '⭐',
  '🚀',
  '💪',
  '🙏',
  '👏',
  '😎',
];

export default function ChatInput({ onSend, onTypingStart, onTypingStop }: ChatInputProps) {
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null> = useRef(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value);

      onTypingStart();

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        onTypingStop();
      }, 2000);
    },
    [onTypingStart, onTypingStop],
  );

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const isEmoji = /^[\p{Emoji}\p{Emoji_Component}]+$/u.test(trimmed) && trimmed.length <= 8;
    onSend(trimmed, isEmoji ? 'emoji' : 'text');
    setContent('');
    onTypingStop();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [content, onSend, onTypingStop]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const insertEmoji = useCallback((emoji: string) => {
    setContent((prev) => prev + emoji);
    textareaRef.current?.focus();
    setShowEmoji(false);
  }, []);

  return (
    <div className="relative px-4 py-3 border-t border-[var(--border-color)]">
      <div className="flex items-end gap-2">
        <div className="relative">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            title="Emoji"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </button>
          {showEmoji && (
            <div
              className="absolute bottom-full left-0 mb-2 p-2 rounded-xl border shadow-lg grid grid-cols-8 gap-1 z-20"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
              }}
            >
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => insertEmoji(emoji)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-hover)] text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 px-3 py-2 rounded-xl text-sm border outline-none resize-none transition-all"
          style={{
            background: 'var(--bg-tertiary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
            minHeight: '38px',
            maxHeight: '120px',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 120) + 'px';
          }}
        />

        <button
          onClick={handleSend}
          disabled={!content.trim()}
          className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
