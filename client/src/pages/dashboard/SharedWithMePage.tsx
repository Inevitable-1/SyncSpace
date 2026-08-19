import { useEffect, useState } from 'react';
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
import { sharedService } from '../../services/sharedService';
import type { Workspace, Room, UploadedFile } from '../../types';

type TabType = 'all' | 'workspaces' | 'rooms' | 'files';

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function SharedWithMePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabType>('all');
  const [sharedWorkspaces, setSharedWorkspaces] = useState<Workspace[]>([]);
  const [sharedRooms, setSharedRooms] = useState<Room[]>([]);
  const [sharedFiles, setSharedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      sharedService.getSharedWorkspaces(),
      sharedService.getSharedRooms(),
      sharedService.getSharedFiles(),
    ])
      .then(([workspaces, rooms, files]) => {
        if (!cancelled) {
          setSharedWorkspaces(workspaces);
          setSharedRooms(rooms);
          setSharedFiles(files);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSharedWorkspaces([]);
          setSharedRooms([]);
          setSharedFiles([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredWorkspaces = sharedWorkspaces.filter(
    (ws) => !search || ws.name.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredRooms = sharedRooms.filter(
    (r) => !search || r.name.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredFiles = sharedFiles.filter(
    (f) => !search || f.name.toLowerCase().includes(search.toLowerCase()),
  );

  const totalAll = filteredWorkspaces.length + filteredRooms.length + filteredFiles.length;

  const tabs: { value: TabType; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: totalAll },
    { value: 'workspaces', label: 'Workspaces', count: filteredWorkspaces.length },
    { value: 'rooms', label: 'Rooms', count: filteredRooms.length },
    { value: 'files', label: 'Files', count: filteredFiles.length },
  ];

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

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* Workspaces */}
          {(tab === 'all' || tab === 'workspaces') && filteredWorkspaces.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkspaces.map((ws, i) => (
                <motion.div
                  key={ws._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/dashboard/workspaces/${ws._id}`)}
                  className="card-hover p-5 cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 transition-transform group-hover:scale-105"
                      style={{ background: ws.color || '#6366f1' }}
                    >
                      <FolderIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="font-semibold text-sm truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {ws.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        Workspace
                        {ws.description ? ` · ${ws.description}` : ''}
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
                          {ws.members.length + 1}
                        </span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                          style={{
                            background: 'var(--surface-subtle)',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          workspace
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Rooms */}
          {(tab === 'all' || tab === 'rooms') && filteredRooms.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRooms.map((room, i) => (
                <motion.div
                  key={room._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/dashboard/rooms/${room._id}`)}
                  className="card-hover p-5 cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 transition-transform group-hover:scale-105"
                      style={{ background: '#8b5cf6' }}
                    >
                      <ClockIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="font-semibold text-sm truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {room.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        Room · {room.type}
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
                          {room.participants.length}
                        </span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                          style={{
                            background: 'var(--surface-subtle)',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          room
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Files */}
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
          {totalAll === 0 && (
            <EmptyState
              icon={<UserGroupIcon className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />}
              title={search ? 'No matches found' : 'No shared items yet'}
              description={
                search
                  ? 'Try a different search term.'
                  : 'Files, rooms and workspaces shared with you will appear here.'
              }
            />
          )}
        </>
      )}
    </div>
  );
}
