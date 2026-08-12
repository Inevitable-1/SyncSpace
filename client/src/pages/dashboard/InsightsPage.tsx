import { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchWorkspaces } from '../../features/workspace/workspaceSlice';
import { fetchRooms } from '../../features/room/roomSlice';
import { fetchMeetingStats } from '../../features/meeting/meetingSlice';
import { fetchActivities } from '../../features/activity/activitySlice';
import type { RootState, AppDispatch } from '../../store';
import type { Activity } from '../../types';

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getUserName(user: Activity['user']): string {
  return typeof user === 'object' && user !== null ? (user as { name: string }).name : 'Someone';
}

const AVATAR_COLORS = [
  'from-brand-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-pink-500',
  'from-blue-500 to-indigo-500',
  'from-cyan-500 to-blue-600',
  'from-rose-500 to-pink-600',
];

export default function InsightsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const { rooms } = useSelector((state: RootState) => state.room);
  const { stats: meetingStats } = useSelector((state: RootState) => state.meeting);
  const { activities } = useSelector((state: RootState) => state.activity);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    dispatch(fetchWorkspaces());
    dispatch(fetchRooms(undefined));
    dispatch(fetchMeetingStats());
    dispatch(fetchActivities());
  }, [dispatch]);

  const weeklyActivity = useMemo(() => {
    const days: { day: string; tasks: number; activities: number; hours: number }[] = DAY_ORDER.map(
      (day) => ({ day, tasks: 0, activities: 0, hours: 0 }),
    );
    const now = Date.now();
    for (const act of activities) {
      const created = Date.parse(act.createdAt);
      if (Number.isNaN(created) || now - created > 7 * 86400000) continue;
      const d = new Date(created);
      const idx = d.getDay(); // 0 = Sunday
      const orderIdx = idx === 0 ? 6 : idx - 1;
      const target = days[orderIdx];
      if (act.entityType === 'task') target.tasks += 1;
      target.activities += 1;
      target.hours += 0.5;
    }
    const maxTasks = Math.max(1, ...days.map((d) => d.tasks));
    const maxItems = Math.max(1, ...days.map((d) => d.activities));
    return { days, maxTasks, maxItems };
  }, [activities]);

  const topMembers = useMemo(() => {
    const counts = new Map<string, { name: string; tasks: number; activities: number }>();
    for (const act of activities) {
      const name = getUserName(act.user);
      if (!counts.has(name)) counts.set(name, { name, tasks: 0, activities: 0 });
      const entry = counts.get(name)!;
      entry.activities += 1;
      if (act.entityType === 'task') entry.tasks += 1;
    }
    return Array.from(counts.values())
      .sort((a, b) => b.activities - a.activities)
      .slice(0, 4)
      .map((m, i) => ({
        ...m,
        avatar: formatInitials(m.name),
        color: AVATAR_COLORS[i % AVATAR_COLORS.length],
      }));
  }, [activities]);

  const workspaceActivity = useMemo(() => {
    const counts = new Map<string, number>();
    for (const act of activities) {
      const key = act.entityName || act.entityType;
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [activities]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            Team Insights
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Analytics and productivity overview
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p ? 'bg-brand-600 text-white shadow' : ''
              }`}
              style={period !== p ? { color: 'var(--text-secondary)' } : undefined}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Meetings',
            value: String(meetingStats?.total ?? 0),
            change: `${meetingStats?.upcoming ?? 0} upcoming`,
            icon: '🎥',
            color: 'from-brand-500 to-purple-500',
          },
          {
            label: 'Active Members',
            value: String(new Set(activities.map((a) => getUserName(a.user))).size),
            change: 'across workspaces',
            icon: '👥',
            color: 'from-blue-500 to-indigo-500',
          },
          {
            label: 'Meetings Completed',
            value: String(meetingStats?.completed ?? 0),
            change: `${meetingStats?.ongoing ?? 0} live now`,
            icon: '✅',
            color: 'from-emerald-500 to-teal-500',
          },
          {
            label: 'Total Activities',
            value: String(activities.length),
            change: 'tracked',
            icon: '📈',
            color: 'from-orange-500 to-amber-500',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-sm`}
              >
                {stat.icon}
              </div>
              <span className="text-xs font-bold text-emerald-400">{stat.change}</span>
            </div>
            <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
              {stat.value}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Weekly Activity
          </h3>
          <div className="flex items-end gap-2 h-48">
            {weeklyActivity.days.map((d, i) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full flex gap-0.5 items-end justify-center"
                  style={{ height: '160px' }}
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.tasks / weeklyActivity.maxTasks) * 100}%` }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                    className="w-3 rounded-t bg-gradient-to-t from-brand-600 to-brand-400"
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.activities / weeklyActivity.maxItems) * 100}%` }}
                    transition={{ delay: 0.35 + i * 0.05, duration: 0.5 }}
                    className="w-3 rounded-t bg-gradient-to-t from-purple-600 to-purple-400"
                  />
                </div>
                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  {d.day}
                </span>
              </div>
            ))}
          </div>
          <div
            className="flex items-center gap-4 mt-4 text-xs"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500" /> Tasks
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Activities
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Most Active Members
          </h3>
          <div className="space-y-4">
            {topMembers.map((m, i) => (
              <div key={m.name} className="flex items-center gap-3">
                <span className="text-xs font-bold w-4" style={{ color: 'var(--text-tertiary)' }}>
                  #{i + 1}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-white text-xs font-bold`}
                >
                  {m.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {m.name}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {m.tasks} tasks · {m.activities} activities
                  </div>
                </div>
                <div className="w-24 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500"
                    style={{
                      width: `${(m.activities / Math.max(1, topMembers[0]?.activities)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Workspace Activity
          </h3>
          <div className="space-y-3">
            {workspaces.slice(0, 5).map((ws) => {
              const count = workspaceActivity.get(ws.name) || 0;
              const pct = Math.max(
                5,
                Math.round((count / Math.max(1, Math.max(1, ...workspaceActivity.values()))) * 5),
              );
              return (
                <div key={ws._id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: ws.color || '#6366f1' }}
                  >
                    {ws.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {ws.name}
                    </div>
                  </div>
                  <div className="flex gap-1 items-end">
                    {[...Array(5)].map((_, j) => (
                      <div
                        key={j}
                        className="w-2 h-6 rounded"
                        style={{
                          background: j < pct ? ws.color || '#6366f1' : 'var(--bg-tertiary)',
                          opacity: j < pct ? 0.7 : 1,
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="text-[10px] w-8 text-right"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
            {workspaces.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
                No workspace data yet
              </p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6"
        >
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Room Distribution
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                type: 'Whiteboard',
                count: rooms.filter((r) => r.type === 'whiteboard').length,
                color: 'from-purple-500 to-pink-500',
                icon: '🎨',
              },
              {
                type: 'Code',
                count: rooms.filter((r) => r.type === 'code').length,
                color: 'from-emerald-500 to-teal-500',
                icon: '💻',
              },
              {
                type: 'Document',
                count: rooms.filter((r) => r.type === 'document').length,
                color: 'from-blue-500 to-indigo-500',
                icon: '📝',
              },
            ].map((rt) => (
              <div
                key={rt.type}
                className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/5"
              >
                <div className="text-2xl mb-2">{rt.icon}</div>
                <div className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                  {rt.count}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {rt.type}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="card p-6"
      >
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Meeting Statistics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Scheduled', value: meetingStats?.upcoming ?? 0, color: 'text-blue-400' },
            { label: 'Live now', value: meetingStats?.ongoing ?? 0, color: 'text-emerald-400' },
            { label: 'Completed', value: meetingStats?.completed ?? 0, color: 'text-gray-400' },
            { label: 'Total', value: meetingStats?.total ?? 0, color: 'text-brand-400' },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/5"
            >
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
