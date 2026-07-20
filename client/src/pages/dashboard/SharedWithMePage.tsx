import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { UserGroupIcon } from '../../components/Icons';
import { fetchRooms } from '../../features/room/roomSlice';
import type { RootState, AppDispatch } from '../../store';

export default function SharedWithMePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { rooms, isLoading } = useSelector((state: RootState) => state.room);

  useEffect(() => {
    dispatch(fetchRooms(undefined));
  }, [dispatch]);

  const sharedRooms = rooms.filter(
    (r) => r.owner !== user?.id && r.participants.includes(user?.id || ''),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Shared With Me
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-xl animate-pulse"
              style={{ background: 'var(--bg-tertiary)' }}
            />
          ))}
        </div>
      ) : sharedRooms.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <UserGroupIcon
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <p style={{ color: 'var(--text-tertiary)' }}>No rooms have been shared with you yet.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sharedRooms.map((room, i) => (
            <motion.div
              key={room._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-hover p-5"
            >
              <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                {room.name}
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-600 text-white">
                {room.type}
              </span>
              <p className="text-xs mt-3" style={{ color: 'var(--text-tertiary)' }}>
                {new Date(room.updatedAt).toLocaleDateString()}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
