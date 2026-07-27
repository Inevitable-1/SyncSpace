import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { TrashIcon, MagnifyingGlassIcon } from '../../components/Icons';
import { fetchActivities, clearAllActivities } from '../../features/activity/activitySlice';
import { useToast } from '../../components/common/Toast';
import type { RootState, AppDispatch } from '../../store';
import type { Activity } from '../../types';

type EntityFilter = 'all' | 'workspace' | 'room' | 'member' | 'invite' | 'task' | 'file' | 'auth';

function timeAgo(date: string): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function getActionColor(action: string): string {
  if (action.includes('created')) return 'bg-emerald-500';
  if (action.includes('deleted')) return 'bg-red-500';
  if (action.includes('updated') || action.includes('edited')) return 'bg-amber-500';
  if (action.includes('joined')) return 'bg-blue-500';
  if (action.includes('completed')) return 'bg-green-500';
  if (action.includes('suspended')) return 'bg-orange-500';
  if (action.includes('reactivated')) return 'bg-cyan-500';
  return 'bg-gray-400';
}

function getEntityIcon(type: string): string {
  switch (type) {
    case 'workspace':
      return '📁';
    case 'room':
      return '🏠';
    case 'member':
      return '👤';
    case 'invite':
      return '✉️';
    case 'task':
      return '✅';
    case 'file':
      return '📄';
    case 'auth':
      return '🔐';
    default:
      return '📋';
  }
}

export default function ActivityPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const { activities, isLoading } = useSelector((state: RootState) => state.activity);
  const [filter, setFilter] = useState<EntityFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchActivities());
  }, [dispatch]);

  const filtered = activities.filter((act: Activity) => {
    const matchesFilter = filter === 'all' || act.entityType === filter;
    const matchesSearch =
      !search ||
      act.action.toLowerCase().includes(search.toLowerCase()) ||
      (act.entityName && act.entityName.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleClearAll = () => {
    dispatch(clearAllActivities());
    showToast('Activity cleared', 'info');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Activity Timeline
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {activities.length} activities
          </p>
        </div>
        {activities.length > 0 && (
          <button
            onClick={handleClearAll}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <TrashIcon className="w-3.5 h-3.5" /> Clear all
          </button>
        )}
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
          placeholder="Search activities..."
        />
      </div>

      <div className="flex gap-1 flex-wrap">
        {(['all', 'workspace', 'room', 'member', 'task', 'file'] as EntityFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f ? 'bg-indigo-600 text-white' : ''
            }`}
            style={
              filter !== f
                ? {
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                  }
                : undefined
            }
          >
            {getEntityIcon(f)} {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4 pl-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4">
              <div
                className="w-3 h-3 rounded-full mt-1.5 animate-pulse shrink-0"
                style={{ background: 'var(--bg-tertiary)' }}
              />
              <div className="flex-1 space-y-2">
                <div
                  className="h-4 rounded animate-pulse w-3/4"
                  style={{ background: 'var(--bg-tertiary)' }}
                />
                <div
                  className="h-3 rounded animate-pulse w-1/4"
                  style={{ background: 'var(--bg-tertiary)' }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            No activities found
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {search
              ? 'Try a different search term.'
              : 'Activities will appear here as you use SyncSpace.'}
          </p>
        </div>
      ) : (
        <div className="relative pl-6">
          <div
            className="absolute left-[7px] top-0 bottom-0 w-0.5"
            style={{ background: 'var(--border-color)' }}
          />
          {filtered.map((act: Activity, i: number) => {
            const userName =
              typeof act.user === 'object' && act.user !== null
                ? (act.user as { name: string }).name
                : 'Someone';
            const color = getActionColor(act.action);
            return (
              <motion.div
                key={act._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="relative flex items-start gap-4 pb-6"
              >
                <div
                  className={`absolute -left-6 w-3.5 h-3.5 rounded-full ${color} ring-2 ring-[var(--bg-secondary)] z-10 mt-1.5`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {userName}
                    </span>{' '}
                    {act.action}
                    {act.entityName && (
                      <>
                        {' '}
                        <span className="font-medium text-indigo-500">{act.entityName}</span>
                      </>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] font-medium">
                      {getEntityIcon(act.entityType)} {act.entityType}
                    </span>
                    <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      {timeAgo(act.createdAt)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
