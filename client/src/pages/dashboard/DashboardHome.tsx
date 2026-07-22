import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, ArrowRightIcon } from '../../components/Icons';
import { CardSkeleton } from '../../components/common/Skeleton';
import CreateWorkspaceModal from '../../components/common/CreateWorkspaceModal';
import CreateRoomModal from '../../components/common/CreateRoomModal';
import WorkspaceCard from '../../components/workspace/WorkspaceCard';
import { useToast } from '../../components/common/Toast';
import { fetchWorkspaces, createWorkspace } from '../../features/workspace/workspaceSlice';
import { fetchRooms, createRoom } from '../../features/room/roomSlice';
import { activityService } from '../../services/activityService';
import type { RootState, AppDispatch } from '../../store';
import type { Activity } from '../../types';

const QUICK_CREATE_ITEMS = [
  { label: 'Workspace', icon: 'folder', color: 'bg-indigo-600', type: 'workspace' },
  { label: 'Whiteboard', icon: 'paint', color: 'bg-purple-600', type: 'whiteboard' },
  { label: 'Code Session', icon: 'code', color: 'bg-emerald-600', type: 'code' },
  { label: 'Room', icon: 'room', color: 'bg-blue-600', type: 'room' },
] as const;

const ROOM_TYPE_COLORS: Record<string, string> = {
  whiteboard: 'bg-purple-600',
  code: 'bg-emerald-600',
  document: 'bg-blue-600',
};

function QuickCreateIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'folder':
      return (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
        </svg>
      );
    case 'paint':
      return (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      );
    case 'code':
      return (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case 'room':
      return (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      );
    default:
      return null;
  }
}

function ActivityIcon({ action }: { action: string }) {
  if (action.includes('created')) return <div className="w-2 h-2 rounded-full bg-emerald-500" />;
  if (action.includes('joined')) return <div className="w-2 h-2 rounded-full bg-blue-500" />;
  if (action.includes('deleted')) return <div className="w-2 h-2 rounded-full bg-red-500" />;
  if (action.includes('updated') || action.includes('edited'))
    return <div className="w-2 h-2 rounded-full bg-amber-500" />;
  return <div className="w-2 h-2 rounded-full bg-gray-400" />;
}

function timeAgo(date: string): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function DashboardHome() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    workspaces,
    isLoading: wsLoading,
    error: wsError,
  } = useSelector((state: RootState) => state.workspace);
  const { rooms, isLoading: roomLoading } = useSelector((state: RootState) => state.room);

  const [showCreateWsModal, setShowCreateWsModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showFAB, setShowFAB] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    dispatch(fetchWorkspaces());
    dispatch(fetchRooms(undefined));
    activityService
      .getAll()
      .then(setActivities)
      .catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (wsError) {
      showToast(wsError, 'error');
    }
  }, [wsError, showToast]);

  const handleCreateWorkspace = (data: {
    name: string;
    description: string;
    color: string;
    icon: string;
    isPublic: boolean;
  }) => {
    dispatch(createWorkspace(data)).then((action) => {
      if (action.meta.requestStatus === 'fulfilled') {
        showToast('Workspace created successfully!', 'success');
        setShowCreateWsModal(false);
      } else {
        showToast((action.payload as string) || 'Failed to create workspace', 'error');
      }
    });
  };

  const handleCreateRoom = useCallback(
    (data: { name: string; type: string; workspaceId: string }) => {
      dispatch(createRoom(data)).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          showToast('Room created successfully!', 'success');
          setShowCreateRoomModal(false);
          const roomId = (action.payload as { _id: string })?._id;
          const roomType = data.type;
          if (roomId && roomType === 'whiteboard') {
            navigate(`/whiteboard/${roomId}`);
          } else if (roomId) {
            navigate(`/dashboard/rooms/${roomId}`);
          }
        } else {
          showToast((action.payload as string) || 'Failed to create room', 'error');
        }
      });
    },
    [dispatch, showToast, navigate],
  );

  const handleFABAction = (type: string) => {
    setShowFAB(false);
    if (type === 'workspace') setShowCreateWsModal(true);
    else setShowCreateRoomModal(true);
  };

  const recentRooms = [...rooms]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTR2Mkg4VjI4aDI4em0wLTRWMjBIMFYyMGgyOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Welcome back, {user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-white/80 text-sm sm:text-base">
              {workspaces.length === 0 && rooms.length === 0
                ? 'Create your first workspace to get started.'
                : `You have ${workspaces.length} workspace${workspaces.length !== 1 ? 's' : ''} and ${rooms.length} room${rooms.length !== 1 ? 's' : ''}.`}
            </p>
          </div>
          <button
            onClick={() => setShowCreateWsModal(true)}
            className="px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-semibold text-sm hover:bg-white/90 transition-all shadow-lg whitespace-nowrap"
          >
            + New Workspace
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              My Workspaces
            </h2>
            <button
              onClick={() => navigate('/dashboard/workspaces')}
              className="text-sm text-indigo-500 hover:text-indigo-400 font-medium flex items-center gap-1"
            >
              View all <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {wsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : workspaces.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-600/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-indigo-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                </svg>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                No workspaces yet
              </p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                Create a workspace to start collaborating with your team.
              </p>
              <button onClick={() => setShowCreateWsModal(true)} className="btn-primary">
                Create Workspace
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {workspaces.slice(0, 4).map((ws, i) => {
                const wsRooms = rooms.filter(
                  (r) =>
                    (typeof r.workspace === 'object' ? r.workspace._id : r.workspace) === ws._id,
                );
                return (
                  <WorkspaceCard
                    key={ws._id}
                    workspace={ws}
                    index={i}
                    roomCount={wsRooms.length}
                    variant="dashboard"
                  />
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Recent Rooms
            </h2>
            <button
              onClick={() => navigate('/dashboard/rooms')}
              className="text-sm text-indigo-500 hover:text-indigo-400 font-medium flex items-center gap-1"
            >
              View all <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {roomLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : recentRooms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-8 text-center"
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
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Create a room in a workspace to start collaborating.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {recentRooms.map((room, i) => {
                const wsName = typeof room.workspace === 'object' ? room.workspace.name : '';
                return (
                  <motion.div
                    key={room._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() =>
                      room.type === 'whiteboard'
                        ? navigate(`/whiteboard/${room._id}`)
                        : navigate(`/dashboard/rooms/${room._id}`)
                    }
                    className="card-hover p-4 flex items-center gap-4 cursor-pointer"
                  >
                    <div
                      className={`w-11 h-11 rounded-xl ${ROOM_TYPE_COLORS[room.type] || 'bg-gray-600'} flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-white text-xs font-bold uppercase">
                        {room.type === 'whiteboard' ? '🎨' : room.type === 'code' ? '</>' : '📝'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className="font-medium text-sm truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {room.name}
                        </p>
                        {room.isActive && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                            Live
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {wsName} · {room.type} · {timeAgo(room.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {room.participants.length} 👤
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (room.type === 'whiteboard') navigate(`/whiteboard/${room._id}`);
                          else navigate(`/dashboard/rooms/${room._id}`);
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
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

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-5"
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Activity Feed
            </h3>
            {activities.length === 0 ? (
              <p className="text-xs text-center py-6" style={{ color: 'var(--text-tertiary)' }}>
                No activity yet
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
                {activities.slice(0, 10).map((act, i) => {
                  const userName =
                    typeof act.user === 'object' && act.user !== null
                      ? (act.user as { name: string }).name
                      : 'Someone';
                  return (
                    <motion.div
                      key={act._id}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-start gap-3 py-2"
                    >
                      <div className="mt-1 flex-shrink-0">
                        <ActivityIcon action={act.action} />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-xs leading-relaxed"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {userName}
                          </span>{' '}
                          {act.action}
                          {act.entityName && (
                            <>
                              {' '}
                              <span className="font-medium text-indigo-500">{act.entityName}</span>
                            </>
                          )}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                          {timeAgo(act.createdAt)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-5"
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowCreateWsModal(true)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-dashed transition-all hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <PlusIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  Workspace
                </span>
              </button>
              <button
                onClick={() => setShowCreateRoomModal(true)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-dashed transition-all hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center">
                  <PlusIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  Room
                </span>
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="card p-5"
          >
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Workspace Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Workspaces
                </span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {workspaces.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Rooms
                </span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {rooms.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Whiteboards
                </span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {rooms.filter((r) => r.type === 'whiteboard').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Code Sessions
                </span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {rooms.filter((r) => r.type === 'code').length}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showFAB && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setShowFAB(false)}
          >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <div className="absolute bottom-24 right-6 z-50 space-y-3">
              {QUICK_CREATE_ITEMS.map((item, i) => (
                <motion.button
                  key={item.type}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFABAction(item.type);
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg hover:shadow-xl transition-all"
                >
                  <div
                    className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center`}
                  >
                    <QuickCreateIcon icon={item.icon} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setShowFAB((v) => !v)}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 hover:shadow-2xl transition-all flex items-center justify-center"
      >
        <motion.div animate={{ rotate: showFAB ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <PlusIcon className="w-6 h-6" />
        </motion.div>
      </button>

      <CreateWorkspaceModal
        isOpen={showCreateWsModal}
        onClose={() => setShowCreateWsModal(false)}
        onSubmit={handleCreateWorkspace}
        isLoading={wsLoading}
      />

      {showCreateRoomModal && (
        <CreateRoomModal
          isOpen={showCreateRoomModal}
          onClose={() => setShowCreateRoomModal(false)}
          onSubmit={handleCreateRoom}
          isLoading={roomLoading}
        />
      )}
    </div>
  );
}
