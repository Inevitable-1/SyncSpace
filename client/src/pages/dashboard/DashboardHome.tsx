import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, ArrowRightIcon } from '../../components/Icons';
import { CardSkeleton } from '../../components/common/Skeleton';
import CreateRoomModal from '../../components/common/CreateRoomModal';
import WorkspaceCard from '../../components/workspace/WorkspaceCard';
import WorkspaceOnboarding from '../../components/workspace/WorkspaceOnboarding';
import { useToast } from '../../components/common/Toast';
import { fetchWorkspaces } from '../../features/workspace/workspaceSlice';
import { fetchRooms, createRoom } from '../../features/room/roomSlice';
import { fetchMeetings } from '../../features/meeting/meetingSlice';
import { activityService } from '../../services/activityService';
import type { RootState, AppDispatch } from '../../store';
import type { Activity } from '../../types';

const ROOM_TYPE_COLORS: Record<string, string> = {
  whiteboard: 'from-purple-500 to-pink-500',
  code: 'from-emerald-500 to-teal-500',
  document: 'from-blue-500 to-indigo-500',
};

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

function AnimatedStatCard({
  value,
  label,
  icon,
  delay,
}: {
  value: string | number;
  label: string;
  icon: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="card-premium p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-2xl">{icon}</div>
      </div>
      <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </div>
    </motion.div>
  );
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
  const { meetings } = useSelector((state: RootState) => state.meeting);

  const [showCreateWsModal, setShowCreateWsModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showFAB, setShowFAB] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    dispatch(fetchWorkspaces());
    dispatch(fetchRooms(undefined));
    dispatch(fetchMeetings());
    activityService
      .getAll()
      .then(setActivities)
      .catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (wsError) showToast(wsError, 'error');
  }, [wsError, showToast]);

  const handleWizardCreated = (workspaceId: string) => {
    setShowCreateWsModal(false);
    dispatch(fetchWorkspaces());
    navigate(`/dashboard/workspaces/${workspaceId}`);
  };

  const handleCreateRoom = useCallback(
    (data: { name: string; type: string; workspaceId: string }) => {
      dispatch(createRoom(data)).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          showToast('Room created!', 'success');
          setShowCreateRoomModal(false);
          const roomId = (action.payload as { _id: string })?._id;
          if (roomId && data.type === 'whiteboard') navigate(`/whiteboard/${roomId}`);
          else if (roomId) navigate(`/dashboard/rooms/${roomId}`);
        } else {
          showToast((action.payload as string) || 'Failed to create', 'error');
        }
      });
    },
    [dispatch, showToast, navigate],
  );

  const recentRooms = [...rooms]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-brand-600/20 via-purple-600/10 to-pink-600/10 border border-brand-500/20 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 via-transparent to-purple-600/5" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl font-black mb-2"
            >
              {greeting}, {user?.name?.split(' ')[0] || 'there'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400"
            >
              {workspaces.length === 0 && rooms.length === 0
                ? 'Create your first workspace to get started.'
                : `You have ${workspaces.length} workspace${workspaces.length !== 1 ? 's' : ''} and ${rooms.length} room${rooms.length !== 1 ? 's' : ''}.`}
            </motion.p>
          </div>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => setShowCreateWsModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-2xl font-semibold text-sm hover:from-brand-500 hover:to-purple-500 transition-all shadow-xl shadow-brand-600/25 whitespace-nowrap"
          >
            + New Workspace
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedStatCard value={workspaces.length} label="Workspaces" icon="📁" delay={0.1} />
        <AnimatedStatCard value={rooms.length} label="Rooms" icon="💬" delay={0.15} />
        <AnimatedStatCard
          value={rooms.filter((r) => r.isActive).length}
          label="Active Now"
          icon="🟢"
          delay={0.2}
        />
        <AnimatedStatCard value={activities.length} label="Activities" icon="📊" delay={0.25} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {workspaces.some((ws) => ws.isFavorite) && (
            <div>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="text-yellow-400">★</span> Starred
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {workspaces
                  .filter((ws) => ws.isFavorite)
                  .slice(0, 4)
                  .map((ws, i) => {
                    const wsRooms = rooms.filter(
                      (r) =>
                        (typeof r.workspace === 'object' ? r.workspace._id : r.workspace) ===
                        ws._id,
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
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Workspaces</h2>
            <button
              onClick={() => navigate('/dashboard/workspaces')}
              className="text-sm text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
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
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-600/10 flex items-center justify-center">
                <span className="text-3xl">📁</span>
              </div>
              <p className="font-semibold mb-1">No workspaces yet</p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                Create a workspace to start collaborating.
              </p>
              <button onClick={() => setShowCreateWsModal(true)} className="btn-primary">
                Create Workspace
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...workspaces]
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 4)
                .map((ws, i) => {
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
            <h2 className="text-lg font-bold">Recent Rooms</h2>
            <button
              onClick={() => navigate('/dashboard/rooms')}
              className="text-sm text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
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
                <span className="text-3xl">💬</span>
              </div>
              <p className="font-semibold mb-1">No rooms yet</p>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Create a room to start collaborating.
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
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${ROOM_TYPE_COLORS[room.type] || 'from-gray-500 to-gray-600'} flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-white text-sm font-bold">
                        {room.type === 'whiteboard' ? '🎨' : room.type === 'code' ? '💻' : '📝'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{room.name}</p>
                        {room.isActive && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                            Live
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {wsName} · {room.type} · {timeAgo(room.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (room.type === 'whiteboard') navigate(`/whiteboard/${room._id}`);
                        else navigate(`/dashboard/rooms/${room._id}`);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 text-white hover:from-brand-500 hover:to-purple-500 transition-all shadow-lg shadow-brand-600/20"
                    >
                      Open
                    </button>
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
            transition={{ delay: 0.25 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">Meetings</h3>
              <button
                onClick={() => navigate('/dashboard/meetings')}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
              >
                View all <ArrowRightIcon className="w-3 h-3" />
              </button>
            </div>
            {meetings.length === 0 ? (
              <p className="text-xs text-center py-6" style={{ color: 'var(--text-tertiary)' }}>
                No meetings scheduled
              </p>
            ) : (
              <div className="space-y-3">
                {[...meetings]
                  .sort(
                    (a, b) =>
                      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
                  )
                  .slice(0, 3)
                  .map((meeting) => {
                    const wsName =
                      typeof meeting.workspace === 'object' ? meeting.workspace.name : '';
                    return (
                      <div
                        key={meeting._id}
                        className="flex items-center gap-3 rounded-xl p-3 border border-white/5 hover:bg-white/[0.03] transition-all"
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">🎥</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{meeting.name}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            {wsName ? `${wsName} · ` : ''}
                            {meeting.status === 'ongoing' ? (
                              <span className="text-emerald-400 font-semibold">Live now</span>
                            ) : (
                              new Date(meeting.scheduledAt).toLocaleString(undefined, {
                                weekday: 'short',
                                hour: 'numeric',
                                minute: '2-digit',
                              })
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => navigate('/dashboard/meetings')}
                          className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 text-white hover:from-brand-500 hover:to-purple-500 transition-all shadow-lg shadow-brand-600/20 whitespace-nowrap"
                        >
                          {meeting.status === 'ongoing' ? 'Join now' : 'Join'}
                        </button>
                      </div>
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
            <h3 className="text-sm font-bold mb-4">Activity Feed</h3>
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
                      <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs leading-relaxed">
                          <span className="font-semibold">{userName}</span> {act.action}
                          {act.entityName && (
                            <span className="font-semibold text-brand-400"> {act.entityName}</span>
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
            transition={{ delay: 0.4 }}
            className="card p-5"
          >
            <h3 className="text-sm font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowCreateWsModal(true)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-white/10 hover:border-brand-500/50 hover:bg-brand-500/5 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                  <PlusIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-semibold">Workspace</span>
              </button>
              <button
                onClick={() => setShowCreateRoomModal(true)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <PlusIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-semibold">Room</span>
              </button>
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
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setShowFAB((v) => !v)}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-xl shadow-brand-600/30 hover:shadow-brand-500/40 hover:scale-110 transition-all flex items-center justify-center"
      >
        <motion.div animate={{ rotate: showFAB ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <PlusIcon className="w-6 h-6" />
        </motion.div>
      </button>

      <WorkspaceOnboarding
        isOpen={showCreateWsModal}
        onClose={() => setShowCreateWsModal(false)}
        onCreated={handleWizardCreated}
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
