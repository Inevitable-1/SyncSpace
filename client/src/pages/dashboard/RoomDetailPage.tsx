import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchRooms } from '../../features/room/roomSlice';
import { fetchWorkspaces } from '../../features/workspace/workspaceSlice';
import { fetchMembers } from '../../features/collaboration/memberSlice';
import { useCollaborationSocket } from '../../hooks/useCollaborationSocket';
import RoomLayout, { type RoomTab } from '../../components/collaboration/RoomLayout';
import PresenceSidebar from '../../components/collaboration/PresenceSidebar';
import InviteModal from '../../components/collaboration/InviteModal';
import ChatPanel from '../../components/chat/ChatPanel';
import ActivityFeed from '../../components/collaboration/ActivityFeed';
import ActivityTimeline from '../../components/collaboration/ActivityTimeline';
import WorkspaceMembers from '../../components/collaboration/WorkspaceMembers';
import KanbanBoard from '../../components/tasks/KanbanBoard';
import FileExplorer from '../../components/files/FileExplorer';
import GlobalSearch from '../../components/collaboration/GlobalSearch';
import CodeIDE from '../../components/editor/CodeIDE';
import type { RootState, AppDispatch } from '../../store';
import { motion } from 'framer-motion';

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { rooms } = useSelector((state: RootState) => state.room);
  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const { user } = useSelector((state: RootState) => state.auth);
  const memberCount = useSelector((state: RootState) => state.presence.memberCount);

  const [activeTab, setActiveTab] = useState<RoomTab>('chat');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const room = rooms.find((r) => r._id === id);
  const workspace =
    room && typeof room.workspace === 'object'
      ? room.workspace
      : workspaces.find((w) => w._id === (room?.workspace as string));

  const workspaceId = typeof workspace === 'object' && workspace ? workspace._id : '';
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
    if (workspaceId) {
      dispatch(fetchMembers({ workspaceId }));
    }
  }, [dispatch, workspaceId]);

  useEffect(() => {
    if (!isConnected) return;
    const activityMap: Record<RoomTab, string> = {
      chat: 'Chatting',
      whiteboard: 'Editing Whiteboard',
      code: 'Editing Code',
      files: 'Browsing Files',
      members: 'Viewing Members',
      activity: 'Viewing Activity',
      tasks: 'Managing Tasks',
      settings: 'Viewing Settings',
    };
    updateActivity(activityMap[activeTab] || 'Viewing room');
  }, [isConnected, activeTab, updateActivity]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch((s) => !s);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const openWhiteboard = useCallback(() => {
    navigate(`/whiteboard/${room._id}`);
  }, [navigate, room._id]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <div className="flex gap-4 h-full" style={{ minHeight: 0 }}>
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
            <div className="w-64 flex-shrink-0 hidden lg:flex flex-col gap-4">
              <PresenceSidebar />
              <ActivityFeed activities={activities} />
            </div>
          </div>
        );

      case 'whiteboard':
        return (
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
        );

      case 'code':
        return workspaceId ? (
          <CodeIDE roomId={room._id} workspaceId={workspaceId} workspaceName={wsName} />
        ) : (
          <div className="card p-12 text-center">
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Loading workspace...
            </p>
          </div>
        );

      case 'files':
        return workspaceId ? (
          <FileExplorer workspaceId={workspaceId} />
        ) : (
          <div className="card p-12 text-center">
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Loading workspace...
            </p>
          </div>
        );

      case 'members':
        return workspaceId ? (
          <WorkspaceMembers workspaceId={workspaceId} />
        ) : (
          <div className="card p-12 text-center">
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Loading workspace...
            </p>
          </div>
        );

      case 'activity':
        return <ActivityTimeline activities={activities} />;

      case 'tasks':
        return workspaceId ? (
          <KanbanBoard workspaceId={workspaceId} />
        ) : (
          <div className="card p-12 text-center">
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Loading workspace...
            </p>
          </div>
        );

      case 'settings':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Room Settings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Type
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {room.type}
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
        );

      default:
        return null;
    }
  };

  return (
    <RoomLayout
      roomName={room.name}
      workspaceName={wsName}
      workspaceColor={wsColor}
      isConnected={isConnected}
      memberCount={memberCount}
      onOpenInvite={() => setShowInviteModal(true)}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div className="h-full flex flex-col">{renderTabContent()}</div>

      <GlobalSearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        workspaceId={workspaceId}
      />

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomId={room._id}
        inviteCode={room.inviteCode}
        roomName={room.name}
      />
    </RoomLayout>
  );
}
