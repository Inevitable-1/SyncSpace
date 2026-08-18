import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  FolderIcon,
  ClockIcon,
  DocumentTextIcon,
} from '../../components/Icons';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/Skeleton';
import { fetchWorkspaces } from '../../features/workspace/workspaceSlice';
import { fetchRooms } from '../../features/room/roomSlice';
import { sharedService } from '../../services/sharedService';
import type { RootState, AppDispatch } from '../../store';
import type { UploadedFile } from '../../types';

type TabType = 'all' | 'workspaces' | 'rooms' | 'files';

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function SharedWithMePage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { workspaces, isLoading: wsLoading } = useSelector((state: RootState) => state.workspace);
  const { rooms } = useSelector((state: RootState) => state.room);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabType>('all');
  const [sharedFiles, setSharedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchWorkspaces());
    dispatch(fetchRooms(undefined));
    sharedService
      .getSharedFiles()
      .then(setSharedFiles)
      .catch(() => setSharedFiles([]))
      .finally(() => setLoading(false));
  }, [dispatch]);

  const sharedWorkspaces = workspaces.filter((ws) => {
    const ownerId =
      typeof ws.owner === 'object' && ws.owner !== null
        ? (ws.owner as { id: string }).id
        : ws.owner;
    return ownerId !== user?.id;
  });

  const sharedRooms = rooms.filter((r) => r.owner !== user?.id);

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
  ];

  const filteredItems = allItems.filter(
    (item) => !search || item.name.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredFiles = sharedFiles.filter(
    (f) => !search || f.name.toLowerCase().includes(search.toLowerCase()),
  );

  const tabs: { value: TabType; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: filteredItems.length + filteredFiles.length },
    { value: 'workspaces', label: 'Workspaces', count: sharedWorkspaces.length },
    { value: 'rooms', label: 'Rooms', count: sharedRooms.length },
    { value: 'files', label: 'Files', count: sharedFiles.length },
  ];

  const isLoading = wsLoading || loading;

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
            Items shared by others across your teams
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

      <div className="flex gap-1 p-1 rounded-xl w-max" style={{ background: 'var(--bg-tertiary)' }}>
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === t.value ? 'bg-brand-600 text-white shadow' : ''}`}
            style={tab !== t.value ? { color: 'var(--text-secondary)' } : undefined}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* Workspace & Room items */}
          {(tab === 'all' || tab === 'workspaces' || tab === 'rooms') &&
            filteredItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems
                  .filter(
                    (item) =>
                      tab === 'all' ||
                      (tab === 'workspaces' && item.type === 'workspace') ||
                      (tab === 'rooms' && item.type === 'room'),
                  )
                  .map((item, i) => (
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
                          {item.type === 'workspace' ? (
                            <FolderIcon className="w-5 h-5" />
                          ) : (
                            <ClockIcon className="w-5 h-5" />
                          )}
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
                              style={{
                                background: 'var(--surface-subtle)',
                                color: 'var(--text-tertiary)',
                              }}
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

          {/* Shared Files */}
          {(tab === 'all' || tab === 'files') && filteredFiles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file, i) => (
                <motion.div
                  key={file._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card-hover p-4 cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white flex-shrink-0">
                      <DocumentTextIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {file.name}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {formatSize(file.size)} · Shared by{' '}
                        {typeof file.uploader === 'object' && file.uploader !== null
                          ? (file.uploader as { name: string }).name
                          : 'Someone'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {filteredItems.length === 0 && filteredFiles.length === 0 && (
            <EmptyState
              icon={<UserGroupIcon className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />}
              title={search ? 'No matches found' : 'Nothing shared yet'}
              description={
                search
                  ? 'Try a different search term.'
                  : 'When someone shares a workspace, room, or file with you, it will appear here.'
              }
            />
          )}
        </>
      )}
    </div>
  );
}
