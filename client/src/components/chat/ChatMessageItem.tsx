import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ChatMessage } from '../../types';

interface ChatMessageItemProps {
  message: ChatMessage;
  currentUserId: string;
  onReply: (message: ChatMessage) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
}

export default function ChatMessageItem({
  message,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
}: ChatMessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwn = (() => {
    if (typeof message.sender === 'string') return message.sender === currentUserId;
    const sender = message.sender as { id?: string; _id?: string };
    return (sender.id || sender._id) === currentUserId;
  })();

  const senderName = typeof message.sender === 'object' ? message.sender.name : 'Unknown';
  const senderInitial = senderName.charAt(0).toUpperCase();

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
      onEdit(message._id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(message._id);
    setShowDeleteConfirm(false);
  };

  const getReplySender = (): string => {
    if (!message.replyTo) return '';
    if (typeof message.replyTo === 'object' && message.replyTo !== null) {
      const s = message.replyTo.sender;
      if (typeof s === 'object' && s !== null) return s.name;
      return '';
    }
    return '';
  };

  const getReplyContent = (): string => {
    if (!message.replyTo) return '';
    if (typeof message.replyTo === 'object' && message.replyTo !== null) {
      return message.replyTo.content;
    }
    return '';
  };

  const replySenderName = getReplySender();
  const replyContent = getReplyContent();

  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} py-1 px-4`}>
        <p className="text-xs italic px-3 py-1 rounded-lg" style={{ color: 'var(--text-tertiary)' }}>
          This message was deleted
        </p>
      </div>
    );
  }

  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-2 px-4">
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
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} py-1 px-4 group relative`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowDeleteConfirm(false);
      }}
    >
      <div className={`flex gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isOwn && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1"
            style={{
              background: 'var(--color-indigo-500, #6366f1)',
              color: '#fff',
            }}
          >
            {senderInitial}
          </div>
        )}

        <div className="flex flex-col">
          {!isOwn && (
            <span className="text-xs font-medium mb-0.5 ml-1" style={{ color: 'var(--text-tertiary)' }}>
              {senderName}
            </span>
          )}

          {replyContent && (
            <div
              className="text-xs px-2 py-1 mb-0.5 rounded-t-lg border-l-2"
              style={{
                background: isOwn ? 'rgba(99,102,241,0.15)' : 'var(--bg-tertiary)',
                borderColor: isOwn ? '#818cf8' : 'var(--border-color)',
                color: 'var(--text-tertiary)',
              }}
            >
              {replySenderName && <span className="font-medium">{replySenderName}</span>}
              <p className="truncate max-w-[200px]">{replyContent.slice(0, 100)}</p>
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
                  className="text-xs px-2 py-1 rounded-lg hover:opacity-80 transition-opacity"
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
                  : 'rounded-bl-md'
              }`}
              style={
                isOwn
                  ? {}
                  : { background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }
              }
            >
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              <div
                className={`flex items-center gap-1.5 mt-0.5 ${
                  isOwn ? 'justify-end' : 'justify-start'
                }`}
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
                  <span className="w-3.5 h-3.5 text-white/60" title="Seen">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </span>
                )}
                {!isOwn && message.seenBy && message.seenBy.length > 0 && (
                  <span className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} title="Seen">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
          )}

          {showActions && !isEditing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.1 }}
              className={`absolute ${
                isOwn ? 'left-0 -translate-x-full -ml-1' : 'right-0 translate-x-full mr-1'
              } top-0 flex items-center gap-0.5 px-1 py-0.5 rounded-lg border shadow-sm z-10`}
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
              }}
            >
              <button
                onClick={() => onReply(message)}
                className="p-1 rounded hover:opacity-70 transition-opacity"
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

              <button
                className="p-1 rounded hover:opacity-70 transition-opacity"
                title="React"
              >
                <svg
                  className="w-3.5 h-3.5"
                  style={{ color: 'var(--text-tertiary)' }}
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

              {isOwn && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditContent(message.content);
                  }}
                  className="p-1 rounded hover:opacity-70 transition-opacity"
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
              )}

              {isOwn && (
                <div className="relative">
                  <button
                    onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                    className="p-1 rounded hover:opacity-70 transition-opacity"
                    title="Delete"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      style={{ color: '#ef4444' }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                  {showDeleteConfirm && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 top-full mt-1 py-2 px-3 rounded-lg border shadow-lg z-20 min-w-[140px]"
                      style={{
                        background: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <p className="text-xs mb-2" style={{ color: 'var(--text-primary)' }}>
                        Delete message?
                      </p>
                      <div className="flex gap-1">
                        <button
                          onClick={handleDelete}
                          className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="text-xs px-2 py-1 rounded hover:opacity-80"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
