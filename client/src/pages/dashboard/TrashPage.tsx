import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { TrashIcon, ArrowRightIcon } from '../../components/Icons';
import { useToast } from '../../components/common/Toast';
import { fetchTrashWorkspaces, restoreWorkspace } from '../../features/workspace/workspaceSlice';
import { restoreRoom } from '../../features/room/roomSlice';
import { roomService } from '../../services/roomService';
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
    roomService
      .getAll()
      .then(() => {
        // Fetch trashed rooms via workspace trash endpoint
        fetch('/api/workspaces/trash', { credentials: 'include' })
          .then((r) => r.json())
          .then((data) => {
            setTrashRooms(data.data?.rooms || []);
            setLoadingRooms(false);
          })
          .catch(() => setLoadingRooms(false));
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
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Trash
      </h1>
      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
        Deleted items can be restored within 30 days.
      </p>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl animate-pulse"
              style={{ background: 'var(--bg-tertiary)' }}
            />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="text-center py-16">
          <TrashIcon
            className="w-10 h-10 mx-auto mb-3 opacity-30"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <p style={{ color: 'var(--text-tertiary)' }}>Trash is empty</p>
        </div>
      ) : (
        <div className="space-y-6">
          {trashWorkspaces.length > 0 && (
            <div>
              <h2
                className="text-sm font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Workspaces ({trashWorkspaces.length})
              </h2>
              <div className="space-y-2">
                {trashWorkspaces.map((ws) => (
                  <motion.div
                    key={ws._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                    }}
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
                          Workspace &middot; Deleted{' '}
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
            </div>
          )}

          {trashRooms.length > 0 && (
            <div>
              <h2
                className="text-sm font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Rooms ({trashRooms.length})
              </h2>
              <div className="space-y-2">
                {trashRooms.map((room) => (
                  <motion.div
                    key={room._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
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
                          Room &middot; {room.type} &middot; Deleted{' '}
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
