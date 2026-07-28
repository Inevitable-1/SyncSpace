import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchWorkspaces } from '../../features/workspace/workspaceSlice';
import { fetchRooms } from '../../features/room/roomSlice';
import type { RootState, AppDispatch } from '../../store';

const weeklyData = [
  { day: 'Mon', tasks: 8, messages: 24, hours: 6.5 },
  { day: 'Tue', tasks: 12, messages: 38, hours: 7.2 },
  { day: 'Wed', tasks: 6, messages: 18, hours: 5.8 },
  { day: 'Thu', tasks: 15, messages: 42, hours: 8.1 },
  { day: 'Fri', tasks: 10, messages: 31, hours: 6.9 },
  { day: 'Sat', tasks: 3, messages: 8, hours: 2.5 },
  { day: 'Sun', tasks: 2, messages: 5, hours: 1.8 },
];

const topMembers = [
  {
    name: 'Alex Kim',
    avatar: 'AK',
    tasks: 42,
    messages: 156,
    color: 'from-brand-500 to-purple-500',
  },
  {
    name: 'Jordan Lee',
    avatar: 'JL',
    tasks: 38,
    messages: 203,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    name: 'Sam Chen',
    avatar: 'SC',
    tasks: 35,
    messages: 178,
    color: 'from-orange-500 to-pink-500',
  },
  {
    name: 'Taylor Swift',
    avatar: 'TS',
    tasks: 28,
    messages: 145,
    color: 'from-blue-500 to-indigo-500',
  },
];

export default function InsightsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const { rooms } = useSelector((state: RootState) => state.room);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    dispatch(fetchWorkspaces());
    dispatch(fetchRooms(undefined));
  }, [dispatch]);

  const maxTasks = Math.max(...weeklyData.map((d) => d.tasks));
  const maxMessages = Math.max(...weeklyData.map((d) => d.messages));

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
            label: 'Total Tasks',
            value: '56',
            change: '+12%',
            icon: '✅',
            color: 'from-emerald-500 to-teal-500',
          },
          {
            label: 'Messages Sent',
            value: '166',
            change: '+8%',
            icon: '💬',
            color: 'from-blue-500 to-indigo-500',
          },
          {
            label: 'Active Hours',
            value: '38.8h',
            change: '+5%',
            icon: '⏱️',
            color: 'from-purple-500 to-pink-500',
          },
          {
            label: 'Productivity',
            value: '87%',
            change: '+3%',
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
            {weeklyData.map((d, i) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full flex gap-0.5 items-end justify-center"
                  style={{ height: '160px' }}
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.tasks / maxTasks) * 100}%` }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                    className="w-3 rounded-t bg-gradient-to-t from-brand-600 to-brand-400"
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.messages / maxMessages) * 100}%` }}
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
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Messages
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
                    {m.tasks} tasks · {m.messages} messages
                  </div>
                </div>
                <div className="w-24 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500"
                    style={{ width: `${(m.tasks / topMembers[0].tasks) * 100}%` }}
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
            {workspaces.slice(0, 5).map((ws) => (
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
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <div
                      key={j}
                      className="w-2 h-6 rounded"
                      style={{
                        background:
                          j < Math.floor(Math.random() * 5) + 1
                            ? ws.color || '#6366f1'
                            : 'var(--bg-tertiary)',
                        opacity: j < Math.floor(Math.random() * 5) + 1 ? 0.7 : 1,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
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
    </div>
  );
}
