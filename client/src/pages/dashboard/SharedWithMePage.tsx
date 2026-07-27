import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    })),
    ...sharedRooms.map((r) => ({
      type: 'room' as const,
      id: r._id,
      name: r.name,
      description: r.type,
      color: '#8b5cf6',
      date: r.createdAt,
    })),
  ].filter((item) => !search || item.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Shared with Me
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Workspaces and rooms shared by others
        </p>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-base"
        placeholder="Search shared items..."
      />

      {allItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🤝</div>
          <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            Nothing shared yet
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            When someone shares a workspace or room with you, it will appear here.
          </p>
        </div>
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
              className="card-hover p-5 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: item.color }}
                >
                  {item.type === 'workspace' ? '📁' : '🏠'}
                </div>
                <div className="min-w-0">
                  <p
                    className="font-medium text-sm truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {item.type === 'workspace' ? 'Workspace' : 'Room'}
                    {item.description ? ` · ${item.description}` : ''}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
