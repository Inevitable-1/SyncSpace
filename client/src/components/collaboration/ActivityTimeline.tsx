import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityLog } from '../../types';

interface ActivityTimelineProps {
  activities: ActivityLog[];
  isLoading?: boolean;
}

function getRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getActionConfig(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes('created') || lower.includes('add'))
    return { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', iconPath: 'M12 4.5v15m7.5-7.5h-15' };
  if (lower.includes('deleted') || lower.includes('removed'))
    return {
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
      iconPath:
        'm14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0',
    };
  if (lower.includes('updated') || lower.includes('edited') || lower.includes('modified'))
    return {
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.1)',
      iconPath:
        'm16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10',
    };
  if (lower.includes('joined'))
    return {
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.1)',
      iconPath:
        'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
    };
  if (lower.includes('message') || lower.includes('sent'))
    return {
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.1)',
      iconPath:
        'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z',
    };
  if (lower.includes('task'))
    return {
      color: '#f97316',
      bg: 'rgba(249,115,22,0.1)',
      iconPath: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    };
  if (lower.includes('file') || lower.includes('upload'))
    return {
      color: '#a855f7',
      bg: 'rgba(168,85,247,0.1)',
      iconPath:
        'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5',
    };
  return {
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.1)',
    iconPath:
      'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z',
  };
}

const VISIBLE_INCREMENT = 10;

export default function ActivityTimeline({ activities, isLoading = false }: ActivityTimelineProps) {
  const [visibleCount, setVisibleCount] = useState(VISIBLE_INCREMENT);

  const visibleActivities = activities.slice(0, visibleCount);
  const hasMore = visibleCount < activities.length;

  return (
    <div
      className="border rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <div
        className="px-5 py-4 border-b flex items-center gap-2"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <svg
          className="w-5 h-5"
          style={{ color: 'var(--text-tertiary)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
          />
        </svg>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Activity Timeline
        </h3>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
        >
          {activities.length}
        </span>
      </div>

      <div className="px-5 py-4 max-h-[500px] overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  style={{ background: 'var(--bg-tertiary)' }}
                />
                <div className="flex-1 space-y-2 py-1">
                  <div
                    className="h-3 rounded-full w-3/4"
                    style={{ background: 'var(--bg-tertiary)' }}
                  />
                  <div
                    className="h-2 rounded-full w-1/3"
                    style={{ background: 'var(--bg-tertiary)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <svg
                className="w-7 h-7"
                style={{ color: 'var(--text-tertiary)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              No activity yet
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Actions will appear here as they happen
            </p>
          </div>
        ) : (
          <div className="relative">
            <div
              className="absolute left-[15px] top-0 bottom-0 w-px"
              style={{ background: 'var(--border-color)' }}
            />

            <AnimatePresence>
              {visibleActivities.map((activity, i) => {
                const config = getActionConfig(activity.action);
                const userName =
                  typeof activity.user === 'object' && activity.user !== null
                    ? (activity.user as { name: string }).name
                    : 'Someone';

                return (
                  <motion.div
                    key={`${activity.createdAt}-${i}`}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    className="relative flex items-start gap-3 pb-5 last:pb-0"
                  >
                    <div
                      className="relative z-10 w-[31px] h-[31px] rounded-full flex items-center justify-center flex-shrink-0 border-2"
                      style={{
                        background: config.bg,
                        borderColor: 'var(--bg-card)',
                      }}
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        style={{ color: config.color }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d={config.iconPath} />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <span className="font-semibold">{userName}</span>{' '}
                        <span style={{ color: 'var(--text-secondary)' }}>{activity.action}</span>
                        {activity.entityName && (
                          <span className="font-medium"> {activity.entityName}</span>
                        )}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {getRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {hasMore && (
        <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={() => setVisibleCount((c) => c + VISIBLE_INCREMENT)}
            className="w-full py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
          >
            Load More ({activities.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
