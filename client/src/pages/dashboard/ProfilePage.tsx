import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

const achievements = [
  { icon: '🚀', title: 'Quick Starter', description: 'Created first workspace', unlocked: true },
  { icon: '🎨', title: 'Creative Mind', description: 'Created 5 whiteboards', unlocked: true },
  { icon: '💬', title: 'Team Player', description: 'Sent 100 messages', unlocked: true },
  { icon: '🏆', title: 'Top Performer', description: 'Completed 50 tasks', unlocked: false },
  { icon: '🌟', title: 'Rising Star', description: 'Earned 1000 XP', unlocked: false },
  { icon: '🔥', title: 'On Fire', description: '7-day streak', unlocked: false },
];

const badges = [
  { icon: '👑', title: 'Admin', color: 'from-yellow-500 to-amber-600' },
  { icon: '🎯', title: 'Precision', color: 'from-blue-500 to-indigo-600' },
  { icon: '⚡', title: 'Speed', color: 'from-purple-500 to-pink-600' },
  { icon: '🔥', title: 'Consistency', color: 'from-orange-500 to-red-600' },
];

const contributionData = Array.from({ length: 52 }, () =>
  Array.from({ length: 7 }, () => Math.floor(Math.random() * 5)),
);

const levels = [
  { level: 1, xp: 0, title: 'Newcomer' },
  { level: 5, xp: 500, title: 'Explorer' },
  { level: 10, xp: 2000, title: 'Contributor' },
  { level: 15, xp: 5000, title: 'Expert' },
  { level: 20, xp: 10000, title: 'Master' },
];

export default function ProfilePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentLevel = 8;
  const currentXP = 1250;
  const nextLevelXP = 2000;
  const streak = 5;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-brand-600/30">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            {user?.name || 'User'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {user?.email}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-brand-500 to-purple-500 text-white">
              Level {currentLevel}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {currentXP}/{nextLevelXP} XP
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400">
              🔥 {streak} day streak
            </span>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Level Progress
        </h2>
        <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(currentXP / nextLevelXP) * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500"
          />
        </div>
        <div
          className="flex justify-between mt-2 text-xs"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <span>Level {currentLevel}</span>
          <span>
            {nextLevelXP - currentXP} XP to Level {currentLevel + 1}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total XP', value: currentXP.toLocaleString(), icon: '⭐' },
          { label: 'Workspaces', value: '12', icon: '📁' },
          { label: 'Tasks Done', value: '48', icon: '✅' },
          { label: 'Day Streak', value: `${streak}`, icon: '🔥' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-4 text-center"
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
              {stat.value}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Badges
        </h2>
        <div className="flex flex-wrap gap-3">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5"
            >
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${badge.color} flex items-center justify-center text-sm`}
              >
                {badge.icon}
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {badge.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Contributions
        </h2>
        <div className="overflow-x-auto">
          <div className="flex gap-[3px] min-w-max">
            {contributionData.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((level, di) => (
                  <div
                    key={di}
                    className="w-3 h-3 rounded-[2px]"
                    style={{
                      background:
                        level === 0
                          ? 'var(--bg-tertiary)'
                          : level === 1
                            ? 'rgba(99,102,241,0.2)'
                            : level === 2
                              ? 'rgba(99,102,241,0.4)'
                              : level === 3
                                ? 'rgba(99,102,241,0.7)'
                                : '#6366f1',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Achievements
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.title}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                ach.unlocked
                  ? 'bg-white/5 border-brand-500/20'
                  : 'bg-white/[0.02] border-white/5 opacity-50'
              }`}
            >
              <div className="text-2xl">{ach.icon}</div>
              <div>
                <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {ach.title}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {ach.description}
                </div>
              </div>
              {ach.unlocked && (
                <div className="ml-auto">
                  <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Level Journey
        </h2>
        <div className="space-y-3">
          {levels.map((lvl) => (
            <div key={lvl.level} className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                  currentLevel >= lvl.level
                    ? 'bg-gradient-to-br from-brand-500 to-purple-500 text-white'
                    : 'bg-white/5 text-gray-500'
                }`}
              >
                {lvl.level}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {lvl.title}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {lvl.xp} XP required
                </div>
              </div>
              {currentLevel >= lvl.level ? (
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {lvl.xp - currentXP} XP away
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
