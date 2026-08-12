import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrashIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  VideoCameraIcon,
  UserGroupIcon,
  CheckIcon,
  DocumentTextIcon,
  FolderIcon,
  ClockIcon,
  XIcon,
} from '../../components/Icons';
import { fetchActivities, clearAllActivities } from '../../features/activity/activitySlice';
import { useToast } from '../../components/common/Toast';
import type { RootState, AppDispatch } from '../../store';
import type { Activity } from '../../types';

type EntityFilter = 'all' | 'meeting' | 'room' | 'member' | 'task' | 'file' | 'whiteboard';

const FILTERS: { value: EntityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'meeting', label: 'Meetings' },
  { value: 'room', label: 'Rooms' },
  { value: 'member', label: 'Members' },
  { value: 'task', label: 'Tasks' },
  { value: 'file', label: 'Files' },
  { value: 'whiteboard', label: 'Whiteboards' },
];

const ENTITY_META: Record<string, { icon: React.ReactNode; gradient: string; label: string }> = {
  workspace: {
    icon: <FolderIcon className="w-4 h-4 text-white" />,
    gradient: 'from-brand-500 to-purple-600',
    label: 'Workspaces',
  },
  meeting: {
    icon: <VideoCameraIcon className="w-4 h-4 text-white" />,
    gradient: 'from-amber-500 to-orange-600',
    label: 'Meetings',
  },
  room: {
    icon: <ClockIcon className="w-4 h-4 text-white" />,
    gradient: 'from-purple-500 to-pink-600',
    label: 'Rooms',
  },
  member: {
    icon: <UserGroupIcon className="w-4 h-4 text-white" />,
    gradient: 'from-emerald-500 to-teal-600',
    label: 'Members',
  },
  task: {
    icon: <CheckIcon className="w-4 h-4 text-white" />,
    gradient: 'from-cyan-500 to-blue-600',
    label: 'Tasks',
  },
  file: {
    icon: <DocumentTextIcon className="w-4 h-4 text-white" />,
    gradient: 'from-rose-500 to-pink-600',
    label: 'Files',
  },
  whiteboard: {
    icon: <ClockIcon className="w-4 h-4 text-white" />,
    gradient: 'from-violet-500 to-purple-600',
    label: 'Whiteboards',
  },
  invite: {
    icon: <UserGroupIcon className="w-4 h-4 text-white" />,
    gradient: 'from-slate-500 to-slate-700',
    label: 'Invites',
  },
  auth: {
    icon: <ClockIcon className="w-4 h-4 text-white" />,
    gradient: 'from-slate-500 to-slate-700',
    label: 'Auth',
  },
};

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
  if (action.includes('scheduled')) return 'bg-purple-500';
  if (action.includes('started')) return 'bg-cyan-500';
  if (action.includes('suspended')) return 'bg-orange-500';
  if (action.includes('reactivated')) return 'bg-cyan-500';
  return 'bg-gray-400';
}

function getUserName(user: Activity['user']): string {
  return typeof user === 'object' && user !== null ? (user as { name: string }).name : 'Someone';
}

function dayKey(date: string): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  if (startOf(d) === startOf(today)) return 'Today';
  if (startOf(d) === startOf(yesterday)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
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

  const filtered = useMemo(() => {
    return activities.filter((act: Activity) => {
      const matchesFilter = filter === 'all' || act.entityType === filter;
      const matchesSearch =
        !search ||
        act.action.toLowerCase().includes(search.toLowerCase()) ||
        (act.entityName && act.entityName.toLowerCase().includes(search.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [activities, filter, search]);

  const dailyActivity = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString();
      const count = activities.filter(
        (a) => new Date(a.createdAt).toLocaleDateString() === key,
      ).length;
      days.push({
        label: d.toLocaleDateString(undefined, { weekday: 'short' }),
        count,
      });
    }
    return days;
  }, [activities]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const act of activities) {
      counts.set(act.entityType, (counts.get(act.entityType) || 0) + 1);
    }
    const order = [
      'workspace',
      'meeting',
      'room',
      'member',
      'task',
      'file',
      'whiteboard',
      'invite',
      'auth',
    ];
    const max = Math.max(1, ...counts.values());
    return order
      .filter((key) => counts.has(key))
      .map((key) => ({
        key,
        count: counts.get(key) || 0,
        pct: Math.round(((counts.get(key) || 0) / max) * 100),
      }));
  }, [activities]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Activity[]>();
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    for (const act of sorted) {
      const key = dayKey(act.createdAt);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(act);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  const maxDaily = Math.max(1, ...dailyActivity.map((d) => d.count));

  const handleClearAll = () => {
    dispatch(clearAllActivities());
    showToast('Activity cleared', 'info');
  };

  return (
    <div className="space-y-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <span className="w-1 h-8 rounded-full bg-gradient-to-b from-cyan-500 to-blue-500 flex-shrink-0" />
          <div>
            <h1
              className="text-2xl font-black tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Activity
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'} across your
              workspace
            </p>
          </div>
        </div>
        {activities.length > 0 && (
          <button
            onClick={handleClearAll}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <TrashIcon className="w-3.5 h-3.5" /> Clear all
          </button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="rounded-2xl p-4 sm:p-5 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/20 transition-all duration-300"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-cyan-500 to-blue-500 flex-shrink-0" />
            <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>
              Last 7 Days
            </h2>
          </div>
          <div className="flex items-end justify-between gap-2 h-32">
            {dailyActivity.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{
                    height: `${Math.max(d.count > 0 ? 12 : 4, (d.count / maxDaily) * 100)}%`,
                  }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.6, ease: 'easeOut' }}
                  className={`w-full max-w-[28px] rounded-lg bg-gradient-to-t ${d.count > 0 ? 'from-brand-600 to-purple-500' : 'bg-white/5'}`}
                />
                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="rounded-2xl p-4 sm:p-5 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/20 transition-all duration-300"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-purple-500 to-pink-500 flex-shrink-0" />
            <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>
              By Category
            </h2>
            <ChartBarIcon className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div className="space-y-3">
            {categoryCounts.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>
                No activity to show yet.
              </p>
            ) : (
              categoryCounts.map((cat) => {
                const meta = ENTITY_META[cat.key] || ENTITY_META.workspace;
                return (
                  <div key={cat.key} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}
                    >
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-xs font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          {cat.count}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.pct}%` }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                          className={`h-full rounded-full bg-gradient-to-r ${meta.gradient}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col md:flex-row gap-3"
      >
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-10"
            placeholder="Search activity..."
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        <div
          className="flex gap-1 p-1 rounded-xl overflow-x-auto"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filter === f.value
                  ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-lg shadow-brand-600/20'
                  : ''
              }`}
              style={filter !== f.value ? { color: 'var(--text-secondary)' } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4 pl-4">
          {Array.from({ length: 6 }).map((_, i) => (
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
      ) : grouped.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 bg-[var(--surface-subtle)] ring-1 ring-[var(--border-light)]">
            <ChartBarIcon className="w-9 h-9" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <p className="text-lg font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
            No activities found
          </p>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {search || filter !== 'all'
              ? 'Try a different search term or filter.'
              : 'Activities will appear here as you use SyncSpace.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([group, acts]) => (
            <motion.div key={group} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2.5 mb-3">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {group}
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border-light)' }} />
                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  {acts.length}
                </span>
              </div>
              <div className="relative pl-6">
                <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gradient-to-b from-brand-500/40 via-purple-500/20 to-transparent" />
                <AnimatePresence initial={false}>
                  {acts.map((act) => {
                    const userName = getUserName(act.user);
                    const color = getActionColor(act.action);
                    const meta = ENTITY_META[act.entityType];
                    return (
                      <motion.div
                        key={act._id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative flex items-start gap-3.5 pb-5"
                      >
                        <span
                          className={`absolute -left-6 w-3.5 h-3.5 rounded-full ${color} ring-2 ring-[var(--bg-secondary)] z-10 mt-1.5`}
                        />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 shadow-md">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm leading-relaxed"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <span
                              className="font-semibold"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {userName}
                            </span>{' '}
                            {act.action}
                            {act.entityName && (
                              <span className="font-semibold text-brand-400">
                                {' '}
                                {act.entityName}
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            {meta && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 bg-gradient-to-r ${meta.gradient} text-white font-semibold`}
                              >
                                {meta.icon}
                                {meta.label.replace(/s$/, '')}
                              </span>
                            )}
                            <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                              {timeAgo(act.createdAt)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
