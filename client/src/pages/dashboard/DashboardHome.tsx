import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  ArrowRightIcon,
  FolderIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  FireIcon,
  ChartBarIcon,
} from '../../components/Icons';
import { CardSkeleton } from '../../components/common/Skeleton';
import CreateWorkspaceModal from '../../components/common/CreateWorkspaceModal';
import { useToast } from '../../components/common/Toast';
import { fetchWorkspaces, createWorkspace } from '../../features/workspace/workspaceSlice';
import { fetchRooms } from '../../features/room/roomSlice';
import { roomService } from '../../services/roomService';
import type { RootState, AppDispatch } from '../../store';

const statCards = [
  {
    label: 'Total Workspaces',
    key: 'totalWorkspaces' as const,
    icon: FolderIcon,
    color: 'bg-indigo-600',
    growthKey: 'workspaces' as const,
  },
  {
    label: 'Total Rooms',
    key: 'totalRooms' as const,
    icon: ClockIcon,
    color: 'bg-emerald-600',
    growthKey: 'rooms' as const,
  },
  {
    label: 'Files Shared',
    key: 'filesShared' as const,
    icon: DocumentTextIcon,
    color: 'bg-amber-600',
    growthKey: 'activity' as const,
  },
  {
    label: 'Online Members',
    key: 'onlineMembers' as const,
    icon: UserGroupIcon,
    color: 'bg-rose-600',
    growthKey: 'members' as const,
  },
  {
    label: 'Active Sessions',
    key: 'activeSessions' as const,
    icon: FireIcon,
    color: 'bg-orange-600',
    growthKey: 'rooms' as const,
  },
  {
    label: 'Recent Activity',
    key: 'recentActivity' as const,
    icon: ChartBarIcon,
    color: 'bg-cyan-600',
    growthKey: 'activity' as const,
  },
];

export default function DashboardHome() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const { workspaces, isLoading: wsLoading } = useSelector((state: RootState) => state.workspace);
  const { rooms, isLoading: roomLoading } = useSelector((state: RootState) => state.room);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quickJoinCode, setQuickJoinCode] = useState('');
  const [stats, setStats] = useState({
    totalWorkspaces: 0,
    totalRooms: 0,
    filesShared: 0,
    onlineMembers: 0,
    activeSessions: 0,
    recentActivity: 0,
    projectsCreated: 0,
    growth: {
      workspaces: 0,
      rooms: 0,
      members: 0,
      activity: 0,
    },
  });

  useEffect(() => {
    dispatch(fetchWorkspaces());
    dispatch(fetchRooms(undefined));
    roomService
      .getStats()
      .then(setStats)
      .catch(() => {});
  }, [dispatch]);

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
        setShowCreateModal(false);
      } else {
        showToast('Failed to create workspace', 'error');
      }
    });
  };

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickJoinCode.trim()) {
      navigate(`/dashboard/rooms?join=${quickJoinCode.trim()}`);
      setQuickJoinCode('');
    }
  };

  const recentRooms = [...rooms]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTR2Mkg4VjI4aDI4em0wLTRWMjBIMFYyMGgyOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-white/80 text-sm sm:text-base">
            Ready to collaborate? Pick up where you left off or start something new.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, i) => {
          const statValue: Record<string, number> = {
            totalWorkspaces: stats.totalWorkspaces,
            totalRooms: stats.totalRooms,
            filesShared: stats.filesShared,
            onlineMembers: stats.onlineMembers,
            activeSessions: stats.activeSessions,
            recentActivity: stats.recentActivity,
          };
          const value = statValue[stat.key] || 0;
          const growth = stats.growth[stat.growthKey] || 0;
          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card-hover p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-11 h-11 rounded-xl ${stat.color} flex items-center justify-center`}
                >
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    growth >= 0 ? 'text-emerald-500' : 'text-red-500'
                  }`}
                >
                  <span className="text-[10px]">{growth >= 0 ? '&#9650;' : '&#9660;'}</span>
                  {Math.abs(growth)}%
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {stat.label}
              </p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                <PlusIcon className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  Create New Workspace
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Start a new collaborative space
                </p>
              </div>
            </button>
            <form onSubmit={handleQuickJoin} className="flex gap-2">
              <input
                type="text"
                value={quickJoinCode}
                onChange={(e) => setQuickJoinCode(e.target.value)}
                className="input-base flex-1"
                placeholder="Paste invite code to quick join..."
              />
              <button
                type="submit"
                className="btn-primary whitespace-nowrap"
                disabled={!quickJoinCode.trim()}
              >
                Join
              </button>
            </form>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Recent Rooms
            </h2>
            <button
              onClick={() => navigate('/dashboard/rooms')}
              className="text-sm text-indigo-500 hover:text-indigo-400 font-medium"
            >
              View all
            </button>
          </div>
          {roomLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : recentRooms.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
              No rooms yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentRooms.map((room) => (
                <button
                  key={room._id}
                  onClick={() => navigate('/dashboard/rooms')}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                      <span className="text-indigo-500 text-xs font-bold uppercase">
                        {room.type.charAt(0)}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {room.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {room.type} &middot; {new Date(room.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ArrowRightIcon className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Workspaces
          </h2>
          <button
            onClick={() => navigate('/dashboard/workspaces')}
            className="text-sm text-indigo-500 hover:text-indigo-400 font-medium"
          >
            View all
          </button>
        </div>
        {wsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm mb-3" style={{ color: 'var(--text-tertiary)' }}>
              No workspaces yet
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              Create Your First Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.slice(0, 6).map((ws) => (
              <button
                key={ws._id}
                onClick={() => navigate('/dashboard/workspaces')}
                className="card-hover p-4 text-left"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: ws.color || '#6366f1' }}
                >
                  <span className="text-white font-bold text-sm">
                    {ws.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p
                  className="font-medium text-sm truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {ws.name}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  {ws.members.length} member{ws.members.length !== 1 ? 's' : ''} &middot;{' '}
                  {new Date(ws.updatedAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </motion.div>

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateWorkspace}
        isLoading={wsLoading}
      />
    </div>
  );
}
