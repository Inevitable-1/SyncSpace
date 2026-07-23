import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../common/Avatar';
import type { RootState } from '../../store';

export default function PresenceSidebar() {
  const { onlineUsers, memberCount } = useSelector((state: RootState) => state.presence);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'typing':
        return 'bg-yellow-500';
      case 'idle':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'typing':
        return 'Typing...';
      case 'idle':
        return 'Idle';
      default:
        return 'Offline';
    }
  };

  return (
    <div
      className="flex flex-col h-full border border-[var(--border-color)] rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-card)' }}
    >
      <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-[var(--text-tertiary)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Online Members
          </h3>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
          {memberCount}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {onlineUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6 text-[var(--text-tertiary)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              No one else is here yet
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {onlineUsers.map((user) => (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors group"
              >
                <div className="relative flex-shrink-0">
                  <Avatar name={user.userName} src={user.userAvatar} size="sm" />
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${getStatusColor(user.status)}`}
                    style={{ borderColor: 'var(--bg-card)' }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {user.userName}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(user.status)}`} />
                    <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                      {user.currentActivity || getStatusLabel(user.status)}
                    </p>
                  </div>
                </div>

                {user.status === 'typing' && (
                  <div className="flex gap-0.5">
                    <span
                      className="w-1 h-1 rounded-full bg-yellow-500 animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-1 h-1 rounded-full bg-yellow-500 animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-1 h-1 rounded-full bg-yellow-500 animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
