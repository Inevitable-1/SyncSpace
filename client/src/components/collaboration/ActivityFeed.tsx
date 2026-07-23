import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityLog } from '../../types';

interface ActivityFeedProps {
  activities: ActivityLog[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getActionIcon = (action: string) => {
    if (action.includes('message')) return '💬';
    if (action.includes('joined')) return '🟢';
    if (action.includes('left')) return '🔴';
    if (action.includes('edited')) return '✏️';
    if (action.includes('shared')) return '🔗';
    return '📌';
  };

  return (
    <div
      className="border border-[var(--border-color)] rounded-xl overflow-hidden flex flex-col"
      style={{ background: 'var(--bg-card)' }}
    >
      <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center gap-2">
        <svg
          className="w-5 h-5 text-[var(--text-tertiary)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Activity
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[300px]">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <svg
              className="w-8 h-8 text-[var(--text-tertiary)] mb-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              No activity yet
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {activities.map((activity, i) => (
              <motion.div
                key={`${activity.action}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: i * 0.03 }}
                className="px-4 py-2.5 border-b border-[var(--border-color)] last:border-b-0 hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-sm mt-0.5 flex-shrink-0">
                    {getActionIcon(activity.action)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      <span className="font-medium">
                        {typeof activity.user === 'object' ? activity.user.name : 'Someone'}
                      </span>{' '}
                      <span style={{ color: 'var(--text-tertiary)' }}>{activity.action}</span>
                      {activity.entityName && (
                        <span className="font-medium"> {activity.entityName}</span>
                      )}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {formatTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
