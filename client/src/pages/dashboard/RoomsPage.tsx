import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  LinkIcon,
  CheckIcon,
  PaintBrushIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  UserGroupIcon,
  ClockIcon,
  FireIcon,
} from '../../components/Icons';
import { CardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import CreateRoomModal from '../../components/common/CreateRoomModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../components/common/Toast';
import { fetchRooms, createRoom, deleteRoom, joinRoom } from '../../features/room/roomSlice';
import type { RootState, AppDispatch } from '../../store';
import type { Room } from '../../types';

const typeConfig = {
  whiteboard: {
    icon: PaintBrushIcon,
    label: 'Whiteboard',
    gradient: 'from-purple-500 to-pink-600',
    chip: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    shadow: 'shadow-purple-600/25',
  },
  code: {
    icon: CodeBracketIcon,
    label: 'Code',
    gradient: 'from-emerald-500 to-teal-600',
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    shadow: 'shadow-emerald-600/25',
  },
  document: {
    icon: DocumentTextIcon,
    label: 'Document',
    gradient: 'from-blue-500 to-indigo-600',
    chip: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    shadow: 'shadow-blue-600/25',
  },
};

type RoomType = 'all' | 'whiteboard' | 'code' | 'document';

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function RoomAvatar({ initial, color }: { initial: string; color: string }) {
  return (
    <div
      className="w-6 h-6 rounded-full border-2 border-[var(--bg-card)] flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
      style={{ background: color }}
    >
      {initial}
    </div>
  );
}

export default function RoomsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { rooms, isLoading } = useSelector((state: RootState) => state.room);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RoomType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [joiningCode, setJoiningCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    dispatch(fetchRooms(undefined));
  }, [dispatch]);

  useEffect(() => {
    const joinParam = searchParams.get('join');
    if (joinParam) {
      setJoiningCode(joinParam);
      handleJoin(joinParam);
      setSearchParams({});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = rooms
    .filter((r) => (filter === 'all' ? true : r.type === filter))
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  const activeRooms = rooms.filter((r) => r.isActive).length;
  const whiteboardCount = rooms.filter((r) => r.type === 'whiteboard').length;
  const codeCount = rooms.filter((r) => r.type === 'code').length;
  const documentCount = rooms.filter((r) => r.type === 'document').length;

  const handleCreate = (data: { name: string; type: string; workspaceId: string }) => {
    dispatch(createRoom(data)).then((action) => {
      if (action.meta.requestStatus === 'fulfilled') {
        showToast('Room created!', 'success');
        setShowCreateModal(false);
      }
    });
  };

  const handleDelete = () => {
    if (deletingRoom) {
      dispatch(deleteRoom(deletingRoom._id)).then(() => {
        showToast('Room deleted', 'info');
        setDeletingRoom(null);
      });
    }
  };

  const handleJoin = async (code?: string) => {
    const inviteCode = code || joiningCode;
    if (!inviteCode.trim()) return;
    setIsJoining(true);
    const action = await dispatch(joinRoom(inviteCode.trim()));
    if (action.meta.requestStatus === 'fulfilled') showToast('Joined room!', 'success');
    else showToast('Invalid invite code', 'error');
    setIsJoining(false);
    setJoiningCode('');
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    showToast('Invite code copied!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openRoom = (room: Room) => {
    if (room.type === 'whiteboard') navigate(`/whiteboard/${room._id}`);
    else navigate(`/dashboard/rooms/${room._id}`);
  };

  const stats = [
    {
      label: 'Total Rooms',
      value: rooms.length,
      icon: UserGroupIcon,
      gradient: 'from-brand-500 to-purple-600',
    },
    {
      label: 'Live Now',
      value: activeRooms,
      icon: FireIcon,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Whiteboards',
      value: whiteboardCount,
      icon: PaintBrushIcon,
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      label: 'Code / Docs',
      value: codeCount + documentCount,
      icon: CodeBracketIcon,
      gradient: 'from-blue-500 to-indigo-600',
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <span className="w-1 h-8 rounded-full bg-gradient-to-b from-purple-500 to-pink-500 flex-shrink-0" />
          <div>
            <h1
              className="text-2xl font-black tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Rooms
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {rooms.length} room{rooms.length !== 1 ? 's' : ''} · {activeRooms} live now
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" /> New Room
        </button>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            whileHover={{ y: -3 }}
            className="rounded-2xl p-4 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/25 transition-all duration-300"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p
                  className="text-xl sm:text-2xl font-black"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-[11px] mt-0.5 truncate"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {stat.label}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl p-4 sm:p-5 backdrop-blur-2xl border border-white/5 bg-gradient-to-r from-brand-600/10 via-purple-600/5 to-transparent"
      >
        <div className="flex items-center gap-2 mb-3">
          <LinkIcon className="w-4 h-4 text-brand-400" />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Quick Join
          </p>
          <span className="text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>
            Paste an invite code to jump straight in
          </span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleJoin();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={joiningCode}
            onChange={(e) => setJoiningCode(e.target.value)}
            className="input-base flex-1"
            placeholder="ROOM-XXXX-XXXX"
          />
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={!joiningCode.trim() || isJoining}
          >
            {isJoining ? <Spinner size="sm" /> : <ArrowRightIcon className="w-4 h-4" />}
            Join
          </button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col md:flex-row gap-3"
      >
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-10"
            placeholder="Search rooms by name..."
          />
        </div>
        <div
          className="flex gap-1 p-1 rounded-xl overflow-x-auto"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          {(['all', 'whiteboard', 'code', 'document'] as RoomType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-lg shadow-brand-600/20'
                  : ''
              }`}
              style={filter !== f ? { color: 'var(--text-secondary)' } : undefined}
            >
              {f === 'all' ? 'All' : typeConfig[f].label}
            </button>
          ))}
        </div>
      </motion.div>

      <div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2.5 mb-4"
        >
          <span className="w-1 h-5 rounded-full bg-gradient-to-b from-purple-500 to-pink-500 flex-shrink-0" />
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>
            {search || filter !== 'all' ? 'Filtered Rooms' : 'Recent Rooms'}
          </h2>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
            {filtered.length}
          </span>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ArrowRightIcon className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />}
            title={search ? 'No matches' : 'No rooms yet'}
            description={
              search
                ? 'Try a different search term.'
                : 'Create a room in a workspace to start collaborating.'
            }
            action={
              !search ? (
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  Create Room
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filtered.map((room, i) => {
              const cfg = typeConfig[room.type] || typeConfig.document;
              const TypeIcon = cfg.icon;
              const wsName = typeof room.workspace === 'object' ? room.workspace.name : 'Workspace';
              return (
                <motion.div
                  key={room._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  whileHover={{ y: -4 }}
                  className="group relative overflow-hidden rounded-2xl cursor-pointer border border-white/5 bg-white/[0.02] backdrop-blur-2xl hover:border-brand-500/30 hover:bg-white/[0.03] transition-all duration-300"
                  onClick={() => openRoom(room)}
                >
                  <div
                    className={`h-20 bg-gradient-to-br ${cfg.gradient} relative flex items-center px-4`}
                  >
                    <div className="absolute inset-0 bg-black/10" />
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 85% 20%, rgba(255,255,255,0.35) 0%, transparent 45%)',
                      }}
                    />
                    <div className="relative flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
                        <TypeIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{room.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{ background: 'rgba(255,255,255,0.9)' }}
                          />
                          <span className="text-[11px] text-white/90 truncate">{wsName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="relative ml-auto flex items-center gap-2">
                      {room.isActive && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/90 text-white flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Live
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cfg.chip}`}
                      >
                        {cfg.label}
                      </span>
                      <span
                        className="text-[10px] flex items-center gap-1"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        <ClockIcon className="w-3 h-3" />
                        {timeAgo(room.updatedAt)}
                      </span>
                    </div>

                    <div
                      className="flex items-center justify-between pt-3 border-t"
                      style={{ borderColor: 'var(--border-light)' }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5">
                          {room.participants.slice(0, 4).map((p, j) => (
                            <RoomAvatar
                              key={j}
                              initial={p.charAt(0).toUpperCase()}
                              color={['#6366f1', '#a855f7', '#10b981', '#f59e0b'][j % 4]}
                            />
                          ))}
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {room.participants.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyInviteCode(room.inviteCode);
                          }}
                          className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
                          style={{
                            color:
                              copiedId === room.inviteCode ? '#10b981' : 'var(--text-tertiary)',
                          }}
                          title="Copy invite code"
                        >
                          {copiedId === room.inviteCode ? (
                            <CheckIcon className="w-4 h-4" />
                          ) : (
                            <LinkIcon className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingRoom(room);
                          }}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openRoom(room);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r ${room.isActive ? 'from-emerald-600 to-teal-600' : 'from-brand-600 to-purple-600'} hover:from-brand-500 hover:to-purple-500 transition-all shadow-lg flex items-center justify-center gap-1.5`}
                      >
                        {room.isActive ? 'Join now' : 'Open'}
                        <ArrowRightIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateRoomModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          isLoading={isLoading}
        />
      )}
      <ConfirmDialog
        isOpen={!!deletingRoom}
        onClose={() => setDeletingRoom(null)}
        onConfirm={handleDelete}
        title="Delete Room"
        message={`Are you sure you want to delete "${deletingRoom?.name}"?`}
        isLoading={isLoading}
      />
    </div>
  );
}
