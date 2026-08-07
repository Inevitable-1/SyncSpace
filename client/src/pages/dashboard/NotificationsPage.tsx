import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  FolderIcon,
  ClockIcon,
  UserGroupIcon,
  LinkIcon,
  TrashIcon,
  CheckIcon,
} from '../../components/Icons';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotifications,
  deleteNotification,
} from '../../features/notification/notificationSlice';
import { useToast } from '../../components/common/Toast';
import type { RootState, AppDispatch } from '../../store';
import type { Notification } from '../../types';

const typeIcons: Record<string, typeof BellIcon> = {
  workspace: FolderIcon,
  room: ClockIcon,
  member: UserGroupIcon,
  invite: LinkIcon,
  activity: BellIcon,
};

const typeColors: Record<string, string> = {
  info: 'from-blue-500 to-indigo-600',
  success: 'from-emerald-500 to-teal-600',
  warning: 'from-amber-500 to-orange-600',
  error: 'from-red-500 to-rose-600',
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

  const readCount = notifications.length - unreadCount;

  const filtered = notifications.filter((n: Notification) => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'read') return n.isRead;
    return true;
  });

  const handleMarkRead = (id: string) => {
    dispatch(markNotificationRead(id));
  };

  const handleDelete = (n: Notification) => {
    dispatch(deleteNotification(n._id));
    showToast('Notification deleted', 'info');
  };

  const tabs: { value: FilterTab; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: notifications.length },
    { value: 'unread', label: 'Unread', count: unreadCount },
    { value: 'read', label: 'Read', count: readCount },
  ];

  return (
    <div className="space-y-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <span className="w-1 h-8 rounded-full bg-gradient-to-b from-brand-500 to-purple-500 flex-shrink-0" />
          <div>
            <h1
              className="text-2xl font-black tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Notifications
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-lg shadow-brand-600/25">
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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: 'var(--bg-tertiary)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === tab.value
                ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-lg shadow-brand-600/20'
                : ''
            }`}
            style={activeTab !== tab.value ? { color: 'var(--text-secondary)' } : undefined}
          >
            {tab.label}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.value ? 'bg-white/20 text-white' : 'bg-[var(--bg-hover)]'
              }`}
              style={activeTab !== tab.value ? { color: 'var(--text-tertiary)' } : undefined}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl animate-pulse"
              style={{ background: 'var(--bg-tertiary)' }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 bg-[var(--surface-subtle)] ring-1 ring-[var(--border-light)]">
            {activeTab === 'read' ? (
              <CheckIcon className="w-9 h-9" style={{ color: 'var(--text-tertiary)' }} />
            ) : (
              <BellIcon className="w-9 h-9" style={{ color: 'var(--text-tertiary)' }} />
            )}
          </div>
          <p className="text-lg font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
            {activeTab === 'unread'
              ? 'No unread notifications'
              : activeTab === 'read'
                ? 'Nothing read yet'
                : 'All caught up!'}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {activeTab === 'unread'
              ? 'You have read all your notifications.'
              : activeTab === 'read'
                ? 'Notifications you open will appear here.'
                : 'You have no notifications.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map((notif: Notification) => {
              const Icon = typeIcons[notif.entityType || 'activity'] || BellIcon;
              const colorClass = typeColors[notif.type] || typeColors.info;
              return (
                <motion.div
                  key={notif._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:border-brand-500/30"
                  style={{
                    background: notif.isRead ? 'rgba(255,255,255,0.01)' : 'var(--bg-card)',
                    borderColor: notif.isRead ? 'var(--border-color)' : 'var(--border-color)',
                  }}
                >
                  {!notif.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-500 to-purple-500" />
                  )}
                  <div className="flex items-start gap-3.5 p-4 pl-5">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shrink-0 shadow-lg`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleMarkRead(notif._id)}
                    >
                      <div className="flex items-center gap-2">
                        <p
                          className="text-sm truncate"
                          style={{
                            color: 'var(--text-primary)',
                            fontWeight: notif.isRead ? 400 : 700,
                          }}
                        >
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {notif.message}
                      </p>
                      <p
                        className="text-[10px] mt-1 flex items-center gap-1"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        <ClockIcon className="w-3 h-3" />
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkRead(notif._id)}
                          className="p-2 rounded-lg hover:bg-emerald-500/10 transition-all"
                          style={{ color: 'var(--text-tertiary)' }}
                          title="Mark as read"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notif)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-all"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
