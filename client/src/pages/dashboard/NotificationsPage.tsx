import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { BellIcon, FolderIcon, ClockIcon, UserGroupIcon } from '../../components/Icons';
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
};

const typeColors: Record<string, string> = {
  info: 'bg-blue-600',
  success: 'bg-emerald-600',
  warning: 'bg-amber-600',
  error: 'bg-red-600',
};

export default function NotificationsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const { notifications, unreadCount, isLoading } = useSelector(
    (state: RootState) => state.notification,
  );

  useEffect(() => {
    dispatch(fetchNotifications(50));
  }, [dispatch]);

  const handleMarkRead = (id: string) => {
    dispatch(markNotificationRead(id));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
    showToast('All notifications marked as read', 'success');
  };

  const handleClearAll = () => {
    dispatch(clearNotifications());
    showToast('All notifications cleared', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="btn-secondary text-xs">
                Mark all read
              </button>
            )}
            <button onClick={handleClearAll} className="btn-secondary text-xs">
              Clear all
            </button>
          </div>
        )}
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
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <BellIcon
            className="w-12 h-12 mx-auto mb-4 opacity-30"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            All caught up!
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            You have no notifications.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif: Notification, i: number) => {
            const Icon = typeIcons[notif.entityType || 'activity'] || BellIcon;
            const colorClass = typeColors[notif.type] || 'bg-blue-600';
            return (
              <motion.div
                key={notif._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-colors hover:bg-[var(--bg-hover)]"
                style={{
                  background: notif.isRead ? 'transparent' : 'var(--bg-card)',
                  border: notif.isRead ? 'none' : '1px solid var(--border-color)',
                }}
                onClick={() => handleMarkRead(notif._id)}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center shrink-0`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
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
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
