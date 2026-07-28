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
  UserIcon,
} from '../../components/Icons';
import { CardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import CreateRoomModal from '../../components/common/CreateRoomModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../components/common/Toast';
import { fetchRooms, createRoom, deleteRoom, joinRoom } from '../../features/room/roomSlice';
import { fetchWorkspaces } from '../../features/workspace/workspaceSlice';
import type { RootState, AppDispatch } from '../../store';
import type { Room } from '../../types';

const typeConfig = {
  whiteboard: { icon: PaintBrushIcon, color: 'bg-purple-600' },
  code: { icon: CodeBracketIcon, color: 'bg-emerald-600' },
  document: { icon: DocumentTextIcon, color: 'bg-blue-600' },
};

export default function RoomsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { rooms, isLoading } = useSelector((state: RootState) => state.room);
  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const { user } = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [joiningCode, setJoiningCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    dispatch(fetchRooms(undefined));
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  useEffect(() => {
    const joinParam = searchParams.get('join');
    if (joinParam) {
      setJoiningCode(joinParam);
      handleJoin(joinParam);
      setSearchParams({});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = rooms.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

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

  const defaultWorkspaceId = workspaces.length > 0 ? workspaces[0]._id : '';

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Rooms
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {rooms.length} room{rooms.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
          disabled={workspaces.length === 0}
        >
          <PlusIcon className="w-4 h-4" /> New Room
        </button>
      </motion.div>

      <div className="card p-4">
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Quick Join
        </p>
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
            placeholder="Paste invite code..."
          />
          <button type="submit" className="btn-primary" disabled={!joiningCode.trim() || isJoining}>
            {isJoining ? <Spinner size="sm" /> : 'Join'}
          </button>
        </form>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
          style={{ color: 'var(--text-tertiary)' }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base pl-10"
          placeholder="Search rooms..."
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((room, i) => {
            const cfg = typeConfig[room.type] || typeConfig.whiteboard;
            const TypeIcon = cfg.icon;
            const wsName = typeof room.workspace === 'object' ? room.workspace.name : '';
            const wsColor =
              typeof room.workspace === 'object' && 'color' in room.workspace
                ? (room.workspace as { color: string }).color
                : '#6366f1';
            return (
              <motion.div
                key={room._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card-hover p-5 cursor-pointer"
                onClick={() => {
                  if (room.type === 'whiteboard') navigate(`/whiteboard/${room._id}`);
                  else navigate(`/dashboard/rooms/${room._id}`);
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl ${cfg.color} flex items-center justify-center`}
                    >
                      <TypeIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {room.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-3 h-3 rounded" style={{ background: wsColor }} />
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {wsName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => copyInviteCode(room.inviteCode)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{
                        color: copiedId === room.inviteCode ? '#10b981' : 'var(--text-tertiary)',
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
                      onClick={() => setDeletingRoom(room)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-medium text-white ${cfg.color}`}
                  >
                    {room.type}
                  </span>
                  {room.isActive && (
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-green-600 text-white">
                      Live
                    </span>
                  )}
                </div>
                <div
                  className="flex items-center justify-between pt-3 border-t"
                  style={{ borderColor: 'var(--border-light)' }}
                >
                  <span
                    className="text-xs flex items-center gap-1"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <UserIcon className="w-3 h-3" />
                    {room.owner === user?.id ? 'Created by you' : 'Created by team'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {room.participants.length} participant
                    {room.participants.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateRoomModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          workspaceId={defaultWorkspaceId}
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
