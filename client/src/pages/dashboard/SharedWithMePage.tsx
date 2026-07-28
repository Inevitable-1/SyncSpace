import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, UserGroupIcon } from '../../components/Icons';
import EmptyState from '../../components/common/EmptyState';
import { fetchWorkspaces } from '../../features/workspace/workspaceSlice';
import { fetchRooms } from '../../features/room/roomSlice';
import type { RootState, AppDispatch } from '../../store';

export default function SharedWithMePage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const { rooms } = useSelector((state: RootState) => state.room);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchWorkspaces());
    dispatch(fetchRooms(undefined));
  }, [dispatch]);

  const sharedWorkspaces = workspaces.filter(
    (ws) =>
      ws.owner !== user?.id &&
      ws.members.some((m) => (typeof m === 'string' ? m : (m as { id: string }).id) === user?.id),
  );

  const sharedRooms = rooms.filter(
    (r) => r.owner !== user?.id && r.participants.some((p) => p === user?.id),
  );

  const allItems = [
    ...sharedWorkspaces.map((ws) => ({
      type: 'workspace' as const,
      id: ws._id,
      name: ws.name,
      description: ws.description,
      color: ws.color,
      date: ws.createdAt,
      memberCount: ws.members.length + 1,
    })),
    ...sharedRooms.map((r) => ({
      type: 'room' as const,
      id: r._id,
      name: r.name,
      description: r.type,
      color: '#8b5cf6',
      date: r.createdAt,
      memberCount: r.participants.length,
    })),
  ].filter((item) => !search || item.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Shared with Me
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {allItems.length} item{allItems.length !== 1 ? 's' : ''} shared by others
          </p>
        </div>
      </motion.div>

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
          placeholder="Search shared items..."
        />
      </div>

      {allItems.length === 0 ? (
        <EmptyState
          icon={<UserGroupIcon className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />}
          title={search ? 'No matches found' : 'Nothing shared yet'}
          description={
            search
              ? 'Try a different search term.'
              : 'When someone shares a workspace or room with you, it will appear here.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() =>
                navigate(
                  item.type === 'workspace'
                    ? `/dashboard/workspaces/${item.id}`
                    : `/dashboard/rooms/${item.id}`,
                )
              }
              className="card-hover p-5 cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 transition-transform group-hover:scale-105"
                  style={{ background: item.color || '#6366f1' }}
                >
                  {item.type === 'workspace' ? '📁' : '🏠'}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="font-semibold text-sm truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {item.type === 'workspace' ? 'Workspace' : 'Room'}
                    {item.description ? ` · ${item.description}` : ''}
                  </p>
                  <div
                    className="flex items-center gap-3 mt-2 pt-2 border-t"
                    style={{ borderColor: 'var(--border-light)' }}
                  >
                    <span
                      className="text-[10px] flex items-center gap-1"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <UserGroupIcon className="w-3 h-3" />
                      {item.memberCount}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                      style={{ background: 'var(--surface-subtle)', color: 'var(--text-tertiary)' }}
                    >
                      {item.type}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
