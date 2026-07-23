import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchRooms } from '../../features/room/roomSlice';
import { fetchWorkspaces } from '../../features/workspace/workspaceSlice';
import { useCollaborationSocket } from '../../hooks/useCollaborationSocket';
import RoomHeader from '../../components/collaboration/RoomHeader';
import PresenceSidebar from '../../components/collaboration/PresenceSidebar';
import InviteModal from '../../components/collaboration/InviteModal';
import ChatPanel from '../../components/chat/ChatPanel';
import ActivityFeed from '../../components/collaboration/ActivityFeed';
import type { RootState, AppDispatch } from '../../store';

type Tab = 'chat' | 'overview' | 'whiteboard' | 'code';

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { rooms } = useSelector((state: RootState) => state.room);
  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const { user } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPresence, setShowPresence] = useState(true);

  const room = rooms.find((r) => r._id === id);
  const workspace =
    room && typeof room.workspace === 'object'
      ? room.workspace
      : workspaces.find((w) => w._id === (room?.workspace as string));

  const wsName = typeof workspace === 'object' && workspace ? workspace.name : 'Unknown';
  const wsColor =
    typeof workspace === 'object' && workspace && 'color' in workspace
      ? (workspace as { color: string }).color
      : '#6366f1';

  const {
    isConnected,
    activities,
    sendMessage,
    editMessageById,
    deleteMessageById,
    startTyping,
    stopTyping,
    markSeen,
    updateActivity,
  } = useCollaborationSocket({
    roomId: id || '',
    userName: user?.name || 'Anonymous',
    enabled: !!id,
  });

  useEffect(() => {
    if (rooms.length === 0) dispatch(fetchRooms(undefined));
    if (workspaces.length === 0) dispatch(fetchWorkspaces());
  }, [dispatch, rooms.length, workspaces.length]);

  useEffect(() => {
    if (isConnected && activeTab === 'chat') {
      updateActivity('Chatting');
    } else if (isConnected && activeTab === 'whiteboard') {
      updateActivity('Editing Whiteboard');
    } else if (isConnected) {
      updateActivity('Viewing room');
    }
  }, [isConnected, activeTab, updateActivity]);

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

  const openWhiteboard = useCallback(() => {
    navigate(`/whiteboard/${room._id}`);
  }, [navigate, room._id]);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'chat', label: 'Chat', icon: '💬' },
    ...(room.type === 'whiteboard'
      ? [{ id: 'whiteboard' as Tab, label: 'Whiteboard', icon: '🎨' }]
      : []),
    ...(room.type === 'code' ? [{ id: 'code' as Tab, label: 'Code', icon: '💻' }] : []),
    { id: 'overview', label: 'Overview', icon: '📋' },
  ];

  return (
    <div className="space-y-4 pb-16">
      <RoomHeader
        roomName={room.name}
        workspaceName={wsName}
        workspaceColor={wsColor}
        roomType={room.type}
        isConnected={isConnected}
        memberCount={useSelector((state: RootState) => state.presence.memberCount)}
        onOpenInvite={() => setShowInviteModal(true)}
      />

      <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span className="text-xs">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => setShowPresence(!showPresence)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            showPresence
              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          title="Toggle presence sidebar"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </button>
      </div>

      {activeTab === 'chat' && (
        <div className="flex gap-4" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
          <div className="flex-1 min-w-0">
            <ChatPanel
              roomId={room._id}
              onSendMessage={sendMessage}
              onEditMessage={editMessageById}
              onDeleteMessage={deleteMessageById}
              onTypingStart={startTyping}
              onTypingStop={stopTyping}
              onMarkSeen={markSeen}
            />
          </div>
          {showPresence && (
            <div className="w-64 flex-shrink-0 hidden lg:block">
              <div className="space-y-4 h-full">
                <PresenceSidebar />
                <ActivityFeed activities={activities} />
              </div>
            </div>
          )}
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
            Coming Soon
          </div>
        </motion.div>
      )}

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
                  Invite Code
                </span>
                <code className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>
                  {room.inviteCode.slice(0, 12)}...
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Status
                </span>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {isConnected ? 'Connected' : 'Disconnected'}
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
              {room.type === 'whiteboard' && (
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
              )}
              <button
                onClick={() => setShowInviteModal(true)}
                className="w-full flex items-center gap-3 p-4 rounded-xl transition-all hover:bg-[var(--bg-hover)] border border-[var(--border-color)]"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-lg">
                  🔗
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Invite Members
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Share link or invite code
                  </p>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className="w-full flex items-center gap-3 p-4 rounded-xl transition-all hover:bg-[var(--bg-hover)] border border-[var(--border-color)]"
              >
                <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-lg">
                  💬
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Open Chat
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Chat with team members
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomId={room._id}
        inviteCode={room.inviteCode}
        roomName={room.name}
      />
    </div>
  );
}
