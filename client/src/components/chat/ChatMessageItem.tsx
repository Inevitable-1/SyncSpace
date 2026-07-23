import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Avatar from '../common/Avatar';
import type { ChatMessage } from '../../types';

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
  showSender: boolean;
  onReply: () => void;
  onEdit: (content: string) => void;
  onDelete: () => void;
  replyToMessage: ChatMessage | null;
}

export default function ChatMessageItem({
  message,
  isOwn,
  showSender,
  onReply,
  onEdit,
  onDelete,
  replyToMessage,
}: ChatMessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const senderName = typeof message.sender === 'object' ? message.sender.name : 'Unknown';
  const senderAvatar = typeof message.sender === 'object' ? message.sender.avatar : '';

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} py-1`}>
        <p
          className="text-xs italic px-3 py-1 rounded-lg"
          style={{ color: 'var(--text-tertiary)' }}
        >
          This message was deleted
        </p>
      </div>
    );
  }

  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-2">
        <p
          className="text-xs px-3 py-1 rounded-full"
          style={{ color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)' }}
        >
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showSender ? 'mt-3' : 'mt-0.5'} group relative`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowMenu(false);
      }}
    >
      <div className={`flex gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {showSender && !isOwn ? (
          <Avatar name={senderName} src={senderAvatar} size="sm" className="flex-shrink-0 mt-1" />
        ) : (
          !showSender && <div className="w-8" />
        )}

        <div className="flex flex-col">
          {showSender && !isOwn && (
            <span
              className="text-xs font-medium mb-0.5 ml-1"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {senderName}
            </span>
          )}

          {replyToMessage && (
            <div
              className={`text-xs px-2 py-1 mb-0.5 rounded-t-lg border-l-2 ${
                isOwn
                  ? 'bg-indigo-600/20 border-indigo-400'
                  : 'bg-gray-200 dark:bg-gray-700 border-gray-400'
              }`}
              style={{ color: 'var(--text-tertiary)' }}
            >
              <span className="font-medium">
                {typeof replyToMessage.sender === 'object' ? replyToMessage.sender.name : ''}
              </span>
              <p className="truncate">{replyToMessage.content}</p>
            </div>
          )}

          {isEditing ? (
            <div className="flex flex-col gap-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                className="w-full px-3 py-2 rounded-xl text-sm border border-indigo-500 outline-none resize-none"
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                }}
                rows={2}
                autoFocus
              />
              <div className="flex gap-1 justify-end">
                <button
                  onClick={handleCancelEdit}
                  className="text-xs px-2 py-1 rounded-lg hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="text-xs px-2 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`relative px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                isOwn
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'border border-[var(--border-color)] rounded-bl-md'
              }`}
              style={
                isOwn ? {} : { background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }
              }
            >
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              <div
                className={`flex items-center gap-1.5 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <span
                  className={`text-[10px] ${isOwn ? 'text-white/60' : ''}`}
                  style={isOwn ? {} : { color: 'var(--text-tertiary)' }}
                >
                  {formatTime(message.createdAt)}
                </span>
                {message.edited && (
                  <span
                    className={`text-[10px] italic ${isOwn ? 'text-white/60' : ''}`}
                    style={isOwn ? {} : { color: 'var(--text-tertiary)' }}
                  >
                    (edited)
                  </span>
                )}
                {isOwn && message.seenBy && message.seenBy.length > 1 && (
                  <span className="text-[10px] text-white/60">Seen</span>
                )}
              </div>
            </div>
          )}

          {showActions && !isEditing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`absolute ${isOwn ? 'left-0 -translate-x-full -ml-1' : 'right-0 translate-x-full mr-1'} top-0 flex items-center gap-0.5 px-1 py-0.5 rounded-lg border shadow-sm z-10`}
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
              }}
            >
              <button
                onClick={onReply}
                className="p-1 rounded hover:bg-[var(--bg-hover)]"
                title="Reply"
              >
                <svg
                  className="w-3.5 h-3.5"
                  style={{ color: 'var(--text-tertiary)' }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 14 4 9 9 4" />
                  <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                </svg>
              </button>
              {isOwn && (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditContent(message.content);
                    }}
                    className="p-1 rounded hover:bg-[var(--bg-hover)]"
                    title="Edit"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      style={{ color: 'var(--text-tertiary)' }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-1 rounded hover:bg-[var(--bg-hover)]"
                      title="More"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        style={{ color: 'var(--text-tertiary)' }}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </button>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute right-0 top-full mt-1 py-1 rounded-lg border shadow-lg z-20 min-w-[100px]"
                        style={{
                          background: 'var(--bg-card)',
                          borderColor: 'var(--border-color)',
                        }}
                      >
                        <button
                          onClick={() => {
                            onDelete();
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
