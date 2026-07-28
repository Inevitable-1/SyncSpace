import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  FolderIcon,
  ClockIcon,
  UserGroupIcon,
  TrashIcon,
  CheckIcon,
} from '../../components/Icons';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotifications,
} from '../../features/notification/notificationSlice';
import { useToast } from '../../components/common/Toast';
import type { RootState, AppDispatch } from '../../store';
import type { Notification } from '../../types';

const typeIcons: Record<string, typeof BellIcon> = {
  workspace: FolderIcon,
  room: ClockIcon,
  member: UserGroupIcon,
  activity: BellIcon,
  invite: UserGroupIcon,
};

const typeColors: Record<string, string> = {
  info: 'bg-blue-600',
  success: 'bg-emerald-600',
  warning: 'bg-amber-600',
  error: 'bg-red-600',
};

type FilterTab = 'all' | 'unread' | 'read';

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

export default function NotificationsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const { notifications, unreadCount, isLoading } = useSelector(
    (state: RootState) => state.notification,
  );
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useEffect(() => {
    dispatch(fetchNotifications(50));
  }, [dispatch]);

  const filtered = notifications.filter((n: Notification) => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'read') return n.isRead;
    return true;
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-600 text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  dispatch(markAllNotificationsRead());
                  showToast('All marked as read', 'success');
                }}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <CheckIcon className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
            <button
              onClick={() => {
                dispatch(clearNotifications());
                showToast('Notifications cleared', 'info');
              }}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <TrashIcon className="w-3.5 h-3.5" /> Clear all
            </button>
          </div>
        )}
      </motion.div>

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
        {(['all', 'unread', 'read'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-indigo-600 text-white shadow' : ''
            }`}
            style={activeTab !== tab ? { color: 'var(--text-secondary)' } : undefined}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 text-xs opacity-80">({unreadCount})</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl animate-pulse"
              style={{ background: 'var(--bg-tertiary)' }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BellIcon
            className="w-12 h-12 mx-auto mb-4 opacity-30"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            {activeTab === 'unread' ? 'No unread notifications' : 'All caught up!'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {activeTab === 'unread'
              ? 'You have read all your notifications.'
              : 'You have no notifications.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((notif: Notification, i: number) => {
              const Icon = typeIcons[notif.entityType || 'activity'] || BellIcon;
              const colorClass = typeColors[notif.type] || 'bg-blue-600';
              return (
                <motion.div
                  key={notif._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-4 p-4 rounded-xl transition-colors group"
                  style={{
                    background: notif.isRead ? 'transparent' : 'var(--bg-card)',
                    border: notif.isRead ? 'none' : '1px solid var(--border-color)',
                  }}
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center shrink-0`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => dispatch(markNotificationRead(notif._id))}
                  >
                    <div className="flex items-center gap-2">
                      <p
                        className="text-sm"
                        style={{
                          color: 'var(--text-primary)',
                          fontWeight: notif.isRead ? 400 : 600,
                        }}
                      >
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {notif.message}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      dispatch(markNotificationRead(notif._id));
                      showToast('Notification dismissed', 'info');
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 transition-all shrink-0"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
