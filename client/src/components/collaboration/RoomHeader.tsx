import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Avatar from '../common/Avatar';
import type { RootState } from '../../store';

interface RoomHeaderProps {
  roomName: string;
  workspaceName: string;
  workspaceColor: string;
  roomType: string;
  isConnected: boolean;
  memberCount: number;
  onOpenInvite: () => void;
}

export default function RoomHeader({
  roomName,
  workspaceName,
  workspaceColor,
  roomType,
  isConnected,
  memberCount,
  onOpenInvite,
}: RoomHeaderProps) {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [copied, setCopied] = useState(false);

  const typeConfig: Record<string, { color: string; icon: string; label: string }> = {
    whiteboard: { color: 'bg-purple-600', icon: '🎨', label: 'Whiteboard' },
    code: { color: 'bg-emerald-600', icon: '</>', label: 'Code' },
    document: { color: 'bg-blue-600', icon: '📝', label: 'Document' },
  };

  const cfg = typeConfig[roomType] || typeConfig.whiteboard;

  const copyInviteLink = () => {
    const link = `${window.location.origin}/dashboard/rooms/join`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border p-4 flex items-center justify-between flex-wrap gap-3"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div
          className={`w-10 h-10 rounded-xl ${cfg.color} flex items-center justify-center text-lg`}
        >
          {cfg.icon}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {roomName}
            </h1>
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-medium text-white"
              style={{ background: workspaceColor }}
            >
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {workspaceName}
            </span>
            <span style={{ color: 'var(--text-tertiary)' }}>·</span>
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <span style={{ color: 'var(--text-tertiary)' }}>·</span>
            <div className="flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                style={{ color: 'var(--text-tertiary)' }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {memberCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {user && (
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <Avatar name={user.name} src={user.avatar} size="xs" />
            <span
              className="text-xs font-medium hidden sm:inline"
              style={{ color: 'var(--text-primary)' }}
            >
              {user.name}
            </span>
          </div>
        )}

        <button
          onClick={onOpenInvite}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Invite
        </button>

        <button
          onClick={copyInviteLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors"
          style={{ color: 'var(--text-primary)' }}
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>
    </motion.div>
  );
}
