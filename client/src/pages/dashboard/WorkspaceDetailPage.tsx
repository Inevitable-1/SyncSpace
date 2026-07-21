import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { PlusIcon } from '../../components/Icons';
import { CardSkeleton } from '../../components/common/Skeleton';
import CreateRoomModal from '../../components/common/CreateRoomModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../components/common/Toast';
import {
  fetchWorkspaces,
  updateWorkspace,
  deleteWorkspace,
} from '../../features/workspace/workspaceSlice';
import { fetchRooms, createRoom, deleteRoom } from '../../features/room/roomSlice';
import type { RootState, AppDispatch } from '../../store';

type Tab = 'rooms' | 'members' | 'settings';

const GRADIENTS = [
  'from-indigo-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-fuchsia-600',
];

const ROOM_TYPE_COLORS: Record<string, string> = {
  whiteboard: 'bg-purple-600',
  code: 'bg-emerald-600',
  document: 'bg-blue-600',
};

export default function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const { workspaces, isLoading: wsLoading } = useSelector((state: RootState) => state.workspace);
  const { rooms, isLoading: roomLoading } = useSelector((state: RootState) => state.room);
  const { user } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<Tab>('rooms');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<{ id: string; name: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const workspace = workspaces.find((w) => w._id === id);
  const wsRooms = rooms.filter(
    (r) => (typeof r.workspace === 'object' ? r.workspace._id : r.workspace) === id,
  );

  useEffect(() => {
    if (workspaces.length === 0) dispatch(fetchWorkspaces());
    dispatch(fetchRooms(id));
  }, [dispatch, id, workspaces.length]);

  useEffect(() => {
    if (workspace) {
      setEditName(workspace.name);
      setEditDesc(workspace.description);
    }
  }, [workspace]);

  const handleCreateRoom = useCallback(
    (data: { name: string; type: string; workspaceId: string }) => {
      dispatch(createRoom(data)).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          showToast('Room created!', 'success');
          setShowCreateRoom(false);
        }
      });
    },
    [dispatch, showToast],
  );

  const handleDeleteRoom = () => {
    if (deletingRoom) {
      dispatch(deleteRoom(deletingRoom.id)).then(() => {
        showToast('Room deleted', 'info');
        setDeletingRoom(null);
      });
    }
  };

  const handleSaveSettings = () => {
    if (editName.trim()) {
      dispatch(
        updateWorkspace({ id: id!, data: { name: editName.trim(), description: editDesc.trim() } }),
      ).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          showToast('Workspace updated!', 'success');
          setIsEditing(false);
        }
      });
    }
  };

  const handleDeleteWorkspace = () => {
    dispatch(deleteWorkspace(id!)).then((action) => {
      if (action.meta.requestStatus === 'fulfilled') {
        showToast('Workspace deleted', 'info');
        navigate('/dashboard/workspaces');
      }
    });
  };

  if (!workspace && !wsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p style={{ color: 'var(--text-tertiary)' }}>Workspace not found</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const gradient = GRADIENTS[0];
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'rooms', label: 'Rooms', count: wsRooms.length },
    { id: 'members', label: 'Members', count: workspace.members.length + 1 },
    { id: 'settings', label: 'Settings', count: 0 },
  ];

  return (
    <div className="space-y-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl bg-gradient-to-br ${gradient} p-6 sm:p-8 text-white relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex items-start gap-4">
          <button
            onClick={() => navigate('/dashboard/workspaces')}
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
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <span className="text-white font-bold text-xl">
                  {workspace.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{workspace.name}</h1>
                {workspace.description && (
                  <p className="text-white/70 text-sm mt-0.5">{workspace.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm text-white/60">
              <span>{workspace.members.length + 1} members</span>
              <span>·</span>
              <span>{wsRooms.length} rooms</span>
              <span>·</span>
              <span>{workspace.isPublic ? 'Public' : 'Private'}</span>
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
            {tab.count > 0 && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-hover)]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {wsRooms.length} room{wsRooms.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <PlusIcon className="w-4 h-4" /> New Room
            </button>
          </div>

          {roomLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : wsRooms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-12 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-600/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-purple-500"
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
                No rooms yet
              </p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                Create a room to start collaborating.
              </p>
              <button onClick={() => setShowCreateRoom(true)} className="btn-primary">
                Create Room
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wsRooms.map((room, i) => {
                return (
                  <motion.div
                    key={room._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="card-hover p-5 cursor-pointer group"
                    onClick={() => {
                      if (room.type === 'whiteboard') navigate(`/whiteboard/${room._id}`);
                      else navigate(`/dashboard/rooms/${room._id}`);
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl ${ROOM_TYPE_COLORS[room.type] || 'bg-gray-600'} flex items-center justify-center`}
                        >
                          <span className="text-white text-xs font-bold uppercase">
                            {room.type.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p
                            className="font-semibold text-sm"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {room.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium text-white ${ROOM_TYPE_COLORS[room.type] || 'bg-gray-600'}`}
                            >
                              {room.type}
                            </span>
                            {room.isActive && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500 text-white">
                                Live
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingRoom({ id: room._id, name: room.name });
                        }}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                    <div
                      className="flex items-center justify-between pt-3 border-t"
                      style={{ borderColor: 'var(--border-light)' }}
                    >
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {room.participants.length} participant
                        {room.participants.length !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (room.type === 'whiteboard') navigate(`/whiteboard/${room._id}`);
                          else navigate(`/dashboard/rooms/${room._id}`);
                        }}
                        className="px-3 py-1 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
                      >
                        Open
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="card divide-y" style={{ borderColor: 'var(--border-color)' }}>
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0) || 'Y'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {user?.name || 'You'}{' '}
                  <span className="text-xs text-indigo-500 ml-1">(Owner)</span>
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {user?.email}
                </p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            {workspace.members.map((memberId, i) => (
              <div key={memberId} className="p-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{
                    background: GRADIENTS[(i + 1) % GRADIENTS.length].includes('indigo')
                      ? '#818cf8'
                      : '#a78bfa',
                  }}
                >
                  M
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Member
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {memberId.slice(0, 8)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-lg space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Workspace Details
            </h3>
            {isEditing ? (
              <>
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
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
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="input-base resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(workspace.name);
                      setEditDesc(workspace.description);
                    }}
                    className="btn-secondary text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    className="btn-primary text-sm"
                    disabled={!editName.trim()}
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {workspace.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {workspace.description || 'No description'}
                    </p>
                  </div>
                  <button onClick={() => setIsEditing(true)} className="btn-secondary text-sm">
                    Edit
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="card p-6 border-red-200 dark:border-red-900">
            <h3 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
              Permanently delete this workspace and all its rooms.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-all"
            >
              Delete Workspace
            </button>
          </div>
        </div>
      )}

      {showCreateRoom && (
        <CreateRoomModal
          isOpen={showCreateRoom}
          onClose={() => setShowCreateRoom(false)}
          onSubmit={handleCreateRoom}
          workspaceId={id}
          isLoading={roomLoading}
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingRoom}
        onClose={() => setDeletingRoom(null)}
        onConfirm={handleDeleteRoom}
        title="Delete Room"
        message={`Are you sure you want to delete "${deletingRoom?.name}"?`}
        isLoading={roomLoading}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteWorkspace}
        title="Delete Workspace"
        message={`Are you sure you want to delete "${workspace?.name}"? This cannot be undone.`}
        isLoading={wsLoading}
      />
    </div>
  );
}
