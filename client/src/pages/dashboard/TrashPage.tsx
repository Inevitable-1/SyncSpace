import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { TrashIcon, ArrowRightIcon } from '../../components/Icons';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../components/common/Toast';
import { fetchTrashWorkspaces, restoreWorkspace } from '../../features/workspace/workspaceSlice';
import { restoreRoom } from '../../features/room/roomSlice';
import { workspaceService } from '../../services/workspaceService';
import type { RootState, AppDispatch } from '../../store';
import type { Room } from '../../types';

export default function TrashPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const { trashWorkspaces, isLoading } = useSelector((state: RootState) => state.workspace);
  const [trashRooms, setTrashRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  useEffect(() => {
    dispatch(fetchTrashWorkspaces());
    workspaceService
      .getTrash()
      .then((data) => {
        setTrashRooms((data.rooms as Room[]) || []);
        setLoadingRooms(false);
      })
      .catch(() => setLoadingRooms(false));
  }, [dispatch]);

  const handleRestoreWorkspace = async (id: string) => {
    const action = await dispatch(restoreWorkspace(id));
    if (action.meta.requestStatus === 'fulfilled') {
      showToast('Workspace restored', 'success');
    } else {
      showToast('Failed to restore workspace', 'error');
    }
  };

  const handleRestoreRoom = async (id: string) => {
    const action = await dispatch(restoreRoom(id));
    if (action.meta.requestStatus === 'fulfilled') {
      setTrashRooms((prev) => prev.filter((r) => r._id !== id));
      showToast('Room restored', 'success');
    } else {
      showToast('Failed to restore room', 'error');
    }
  };

  const loading = isLoading || loadingRooms;
  const isEmpty = trashWorkspaces.length === 0 && trashRooms.length === 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Trash
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Deleted items can be restored within 30 days.
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl animate-shimmer"
              style={{ background: 'var(--bg-tertiary)' }}
            />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={<TrashIcon className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />}
          title="Trash is empty"
          description="Deleted workspaces and rooms will appear here."
        />
      ) : (
        <div className="space-y-6">
          {trashWorkspaces.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Workspaces ({trashWorkspaces.length})
              </h2>
              <div className="space-y-2">
                {trashWorkspaces.map((ws, i) => (
                  <motion.div
                    key={ws._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between p-4 rounded-xl card"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: ws.color || '#6366f1' }}
                      >
                        <span className="text-white font-bold text-sm">
                          {ws.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {ws.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          Workspace · Deleted{' '}
                          {ws.deletedAt ? new Date(ws.deletedAt).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRestoreWorkspace(ws._id)}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      Restore
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {trashRooms.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Rooms ({trashRooms.length})
              </h2>
              <div className="space-y-2">
                {trashRooms.map((room, i) => (
                  <motion.div
                    key={room._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between p-4 rounded-xl card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
                        <ArrowRightIcon
                          className="w-5 h-5"
                          style={{ color: 'var(--text-tertiary)' }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {room.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          Room · {room.type} · Deleted{' '}
                          {room.deletedAt ? new Date(room.deletedAt).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRestoreRoom(room._id)}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      Restore
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
