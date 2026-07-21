import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchRooms } from '../../features/room/roomSlice';
import { fetchWorkspaces } from '../../features/workspace/workspaceSlice';
import { useToast } from '../../components/common/Toast';
import type { RootState, AppDispatch } from '../../store';

type Tab = 'overview' | 'whiteboard' | 'code' | 'participants';

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const { rooms } = useSelector((state: RootState) => state.room);
  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const { user } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [copied, setCopied] = useState(false);

  const room = rooms.find((r) => r._id === id);
  const workspace =
    room && typeof room.workspace === 'object'
      ? room.workspace
      : workspaces.find((w) => w._id === (room?.workspace as string));

  useEffect(() => {
    if (rooms.length === 0) dispatch(fetchRooms(undefined));
    if (workspaces.length === 0) dispatch(fetchWorkspaces());
  }, [dispatch, rooms.length, workspaces.length]);

  if (!room) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--text-tertiary)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Room not found
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
            This room may have been deleted.
          </p>
          <button onClick={() => navigate('/dashboard/rooms')} className="btn-primary text-sm">
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  const typeConfig: Record<string, { color: string; icon: string; label: string }> = {
    whiteboard: { color: 'bg-purple-600', icon: '🎨', label: 'Whiteboard' },
    code: { color: 'bg-emerald-600', icon: '</>', label: 'Code Editor' },
    document: { color: 'bg-blue-600', icon: '📝', label: 'Document' },
  };

  const cfg = typeConfig[room.type] || typeConfig.whiteboard;
  const wsName = typeof workspace === 'object' && workspace ? workspace.name : 'Unknown';
  const wsColor =
    typeof workspace === 'object' && workspace && 'color' in workspace
      ? (workspace as { color: string }).color
      : '#6366f1';

  const copyInviteCode = () => {
    navigator.clipboard.writeText(room.inviteCode);
    setCopied(true);
    showToast('Invite code copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const openWhiteboard = useCallback(() => {
    navigate(`/whiteboard/${room._id}`);
  }, [navigate, room._id]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    ...(room.type === 'whiteboard' ? [{ id: 'whiteboard' as Tab, label: 'Whiteboard' }] : []),
    ...(room.type === 'code' ? [{ id: 'code' as Tab, label: 'Code Editor' }] : []),
    { id: 'participants', label: 'Participants' },
  ];

  return (
    <div className="space-y-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-gray-800 to-gray-900 text-white relative overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-gradient-to-r opacity-20"
          style={{ background: wsColor }}
        />
        <div className="relative flex items-start gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all mt-1"
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
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-12 h-12 rounded-xl ${cfg.color} flex items-center justify-center text-xl`}
              >
                {cfg.icon}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{room.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-3 h-3 rounded" style={{ background: wsColor }} />
                  <span className="text-sm text-white/60">{wsName}</span>
                  <span className="text-white/40">·</span>
                  <span className="text-sm text-white/60">{cfg.label}</span>
                  {room.isActive && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-green-500 text-white">
                      Live
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={openWhiteboard}
                className="px-4 py-2 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-white/90 transition-all"
              >
                Open {cfg.label} →
              </button>
              <button
                onClick={copyInviteCode}
                className="px-4 py-2 rounded-xl bg-white/20 text-white font-medium text-sm hover:bg-white/30 transition-all backdrop-blur-sm"
              >
                {copied ? '✓ Copied' : 'Copy Invite Code'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Room Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Type
                </span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-md text-white"
                  style={{ background: wsColor }}
                >
                  {cfg.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Workspace
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {wsName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Created
                </span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(room.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Participants
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {room.participants.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Status
                </span>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full ${room.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {room.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={openWhiteboard}
                className="w-full flex items-center gap-3 p-4 rounded-xl transition-all hover:bg-[var(--bg-hover)] border border-[var(--border-color)]"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-lg">
                  🎨
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Open Whiteboard
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Start drawing and collaborating
                  </p>
                </div>
              </button>
              <button
                onClick={copyInviteCode}
                className="w-full flex items-center gap-3 p-4 rounded-xl transition-all hover:bg-[var(--bg-hover)] border border-[var(--border-color)]"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-lg">
                  🔗
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Share Invite
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {copied ? 'Copied!' : 'Copy invite code'}
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'whiteboard' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-12 text-center"
        >
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Collaborative Whiteboard
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
            Draw, sketch, and brainstorm with your team in real-time.
          </p>
          <button
            onClick={openWhiteboard}
            className="px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all"
          >
            Open Whiteboard →
          </button>
        </motion.div>
      )}

      {activeTab === 'code' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-12 text-center"
        >
          <div className="text-6xl mb-4">{'</>'}</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Code Editor
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
            Write and collaborate on code in real-time. Coming soon.
          </p>
          <div className="px-6 py-3 rounded-xl bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-semibold cursor-not-allowed">
            Coming in Day 4
          </div>
        </motion.div>
      )}

      {activeTab === 'participants' && (
        <div className="space-y-4">
          <div className="card divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {room.participants.map((participantId, i) => (
              <div key={participantId} className="p-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{
                    background: ['#818cf8', '#a78bfa', '#c084fc', '#f472b6', '#fb923c'][i % 5],
                  }}
                >
                  {participantId === user?.id ? user?.name?.charAt(0) || 'Y' : 'U'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {participantId === user?.id ? user?.name || 'You' : `User ${i + 1}`}
                    {participantId === room.owner && (
                      <span className="text-xs text-indigo-500 ml-2">(Owner)</span>
                    )}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {participantId === user?.id ? 'You' : participantId.slice(0, 12) + '...'}
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
