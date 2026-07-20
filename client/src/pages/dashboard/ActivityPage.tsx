import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { ChartBarIcon, FolderIcon, ClockIcon, UserGroupIcon } from '../../components/Icons';
import { activityService } from '../../services/activityService';
import type { Activity } from '../../types';
import type { AppDispatch } from '../../store';
import { useState } from 'react';

const entityIcons: Record<string, typeof FolderIcon> = {
  workspace: FolderIcon,
  room: ClockIcon,
  member: UserGroupIcon,
  auth: ChartBarIcon,
};

export default function ActivityPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    activityService
      .getAll(filter || undefined)
      .then((data) => {
        setActivities(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dispatch, filter]);

  const handleClear = async () => {
    await activityService.clearAll();
    setActivities([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Activity
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Track all your recent actions
          </p>
        </div>
        {activities.length > 0 && (
          <button onClick={handleClear} className="btn-secondary text-red-500">
            Clear All
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'workspace', 'room', 'member'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-indigo-600 text-white' : ''}`}
            style={
              filter !== f
                ? { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }
                : undefined
            }
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl animate-pulse"
              style={{ background: 'var(--bg-tertiary)' }}
            />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <p className="text-center py-16" style={{ color: 'var(--text-tertiary)' }}>
          No activity yet.
        </p>
      ) : (
        <div className="space-y-2">
          {activities.map((a, i) => {
            const Icon = entityIcons[a.entityType] || ChartBarIcon;
            return (
              <motion.div
                key={a._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <Icon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    <span className="font-medium">{a.action}</span>
                    {a.entityName && (
                      <span style={{ color: 'var(--text-tertiary)' }}>
                        {' '}
                        &middot; {a.entityName}
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
