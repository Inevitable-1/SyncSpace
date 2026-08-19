import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchRooms, updateRoom, deleteRoom } from '../../features/room/roomSlice';
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
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../components/common/Toast';
import type { RootState, AppDispatch } from '../../store';

const ROOM_TYPE_BADGES: Record<string, { label: string; color: string }> = {
  whiteboard: { label: 'Whiteboard', color: '#8b5cf6' },
  code: { label: 'Code Editor', color: '#10b981' },
  document: { label: 'Document', color: '#3b82f6' },
};

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const { rooms } = useSelector((state: RootState) => state.room);
  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const { user } = useSelector((state: RootState) => state.auth);
  const memberCount = useSelector((state: RootState) => state.presence.memberCount);
  const onlineUsers = useSelector((state: RootState) => state.presence.onlineUsers);

  const [activeTab, setActiveTab] = useState<RoomTab>('chat');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomDesc, setEditRoomDesc] = useState('');
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [showDeleteRoom, setShowDeleteRoom] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

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

  const isOwner = room && user && (room.owner === user.id || room.owner === user.email);

  const { isConnected, activities, updateActivity, startTyping, stopTyping } =
    useCollaborationSocket({
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
    if (room) {
      setEditRoomName(room.name);
      setEditRoomDesc('');
    }
  }, [room]);

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

  const openWhiteboard = useCallback(() => {
    navigate(`/whiteboard/${room!._id}`);
  }, [navigate, room]);

  const handleCopyInvite = () => {
    if (room?.inviteCode) {
      navigator.clipboard.writeText(room.inviteCode);
      setCopiedInvite(true);
      showToast('Invite code copied!', 'success');
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  };

  const handleSaveRoomSettings = () => {
    if (editRoomName.trim() && id) {
      dispatch(updateRoom({ id, data: { name: editRoomName.trim() } })).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          showToast('Room updated!', 'success');
          setIsEditingSettings(false);
        }
      });
    }
  };

  const handleDeleteRoom = () => {
    if (id) {
      dispatch(deleteRoom(id)).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          showToast('Room deleted', 'info');
          navigate(`/dashboard/workspaces/${workspaceId || ''}`);
        }
      });
    }
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: 'var(--text-tertiary)' }}
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

  const badge = ROOM_TYPE_BADGES[room.type] || { label: room.type, color: '#6b7280' };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <div className="flex gap-4 h-full" style={{ minHeight: 0 }}>
            <div className="flex-1 min-w-0">
              <ChatPanel roomId={room._id} onTypingStart={startTyping} onTypingStop={stopTyping} />
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
            <button onClick={openWhiteboard} className="btn-primary">
              Open Whiteboard →
            </button>
          </motion.div>
        );

      case 'code':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-12 text-center"
          >
            <div className="text-6xl mb-4">💻</div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Collaborative Code Editor
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
              Write, edit, and collaborate on code in real-time with your team.
              <br />
              Supports Java, Python, C, and C++.
            </p>
            <button onClick={() => navigate(`/code-editor/${room!._id}`)} className="btn-primary">
              Open Code Editor →
            </button>
          </motion.div>
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
            className="max-w-lg space-y-6"
          >
            <div className="card p-6 space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Room Settings
              </h3>
              {isEditingSettings ? (
                <div className="space-y-3">
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      value={editRoomName}
                      onChange={(e) => setEditRoomName(e.target.value)}
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Description
                    </label>
                    <textarea
                      value={editRoomDesc}
                      onChange={(e) => setEditRoomDesc(e.target.value)}
                      className="input-base resize-none"
                      rows={3}
                      placeholder="Add a description for this room..."
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setIsEditingSettings(false);
                        setEditRoomName(room.name);
                      }}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveRoomSettings}
                      className="btn-primary text-sm"
                      disabled={!editRoomName.trim()}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Name
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {room.name}
                      </span>
                      <button
                        onClick={() => setIsEditingSettings(true)}
                        className="text-xs font-medium"
                        style={{ color: wsColor || '#6366f1' }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Type
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-medium text-white"
                      style={{ background: badge.color }}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Workspace
                    </span>
                    <button
                      onClick={() => navigate(`/dashboard/workspaces/${workspaceId}`)}
                      className="text-xs font-medium hover:underline"
                      style={{ color: wsColor || '#6366f1' }}
                    >
                      {wsName}
                    </button>
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
              )}
            </div>

            <div className="card p-6 space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Invite Code
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Share this code to let others join this room.
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 px-3 py-2 rounded-lg border font-mono text-sm tracking-wider truncate"
                  style={{
                    borderColor: 'var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {room.inviteCode}
                </div>
                <button
                  onClick={handleCopyInvite}
                  className="btn-secondary text-sm flex items-center gap-1"
                >
                  {copiedInvite ? (
                    <>
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                        />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {isOwner && (
              <div className="card p-6" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#ef4444' }}>
                  Danger Zone
                </h3>
                <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                  Permanently delete this room. This action cannot be undone.
                </p>
                <button onClick={() => setShowDeleteRoom(true)} className="btn-danger">
                  Delete Room
                </button>
              </div>
            )}
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
      onlineUsers={onlineUsers}
      onOpenInvite={() => setShowInviteModal(true)}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div className="h-full flex flex-col">
        <div
          className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}
        >
          <button
            onClick={() => navigate(`/dashboard/workspaces/${workspaceId}`)}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: wsColor || 'var(--text-tertiary)' }}
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {wsName}
          </button>
          <svg
            className="w-3 h-3"
            style={{ color: 'var(--text-tertiary)' }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            {room.name}
          </span>
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
            style={{ background: badge.color }}
          >
            {badge.label}
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyInvite}
              className="p-1.5 rounded-lg transition-colors"
              style={{
                color: copiedInvite ? '#10b981' : 'var(--text-tertiary)',
                background: copiedInvite ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
              }}
              title="Copy invite code"
            >
              {copiedInvite ? (
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={() => {
                setShowSettings(!showSettings);
                if (!showSettings) setActiveTab('settings');
              }}
              className="p-1.5 rounded-lg transition-colors"
              style={{
                color: showSettings ? wsColor || '#6366f1' : 'var(--text-tertiary)',
                background: showSettings ? `${wsColor || '#6366f1'}15` : 'transparent',
              }}
              title="Room settings"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {renderTabContent()}
      </div>

      <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        inviteCode={room.inviteCode}
        roomName={room.name}
      />

      <ConfirmDialog
        isOpen={showDeleteRoom}
        onClose={() => setShowDeleteRoom(false)}
        onConfirm={handleDeleteRoom}
        title="Delete Room"
        message={`Are you sure you want to delete "${room.name}"? This action cannot be undone.`}
      />
    </RoomLayout>
  );
}
