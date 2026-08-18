import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../common/Toast';
import { Bars3Icon, SunIcon, MoonIcon, BellIcon } from '../Icons';
import { fetchWorkspaces } from '../../features/workspace/workspaceSlice';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../features/notification/notificationSlice';
import type { RootState, AppDispatch } from '../../store';

interface TopNavProps {
  onMenuClick: () => void;
}

const PAGE_TITLES: Array<{ pattern: RegExp; title: string }> = [
  { pattern: /^\/dashboard\/workspaces\/.+/, title: 'Workspace' },
  { pattern: /^\/dashboard\/workspaces/, title: 'Workspaces' },
  { pattern: /^\/dashboard\/rooms\/.+/, title: 'Room' },
  { pattern: /^\/dashboard\/rooms/, title: 'Rooms' },
  { pattern: /^\/dashboard\/meetings/, title: 'Meetings' },
  { pattern: /^\/dashboard\/files/, title: 'Files' },
  { pattern: /^\/dashboard\/shared/, title: 'Shared' },
  { pattern: /^\/dashboard\/insights/, title: 'Insights' },
  { pattern: /^\/dashboard\/activity/, title: 'Activity' },
  { pattern: /^\/dashboard\/notifications/, title: 'Notifications' },
  { pattern: /^\/dashboard\/trash/, title: 'Trash' },
  { pattern: /^\/dashboard\/settings/, title: 'Settings' },
  { pattern: /^\/dashboard\/profile/, title: 'Profile' },
  { pattern: /^\/dashboard$/, title: 'Dashboard' },
];

export default function TopNav({ onMenuClick }: TopNavProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const { notifications, unreadCount } = useSelector((state: RootState) => state.notification);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchWorkspaces());
    dispatch(fetchNotifications(20));
  }, [dispatch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setShowProfileMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pageTitle =
    PAGE_TITLES.find((p) => p.pattern.test(location.pathname))?.title || 'Dashboard';

  const handleLogout = async () => {
    const { logout } = await import('../../features/auth/authSlice');
    await dispatch(logout());
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-surface-900/80 backdrop-blur-2xl">
      <div className="flex items-center gap-3 h-16 px-4 sm:px-6">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all flex-shrink-0"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0 flex-shrink-0">
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
            {pageTitle}
          </h1>
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-gradient-to-r from-brand-500/20 to-secondary-500/20 border-brand-500/20 text-brand-300">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
            Overview
          </span>
        </div>

        <div className="flex-1 flex justify-center min-w-0">
          <button
            onClick={() => {
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
            }}
            className="hidden sm:flex items-center gap-2 w-full max-w-md px-3.5 py-2 rounded-xl text-sm text-gray-400 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
          >
            <svg
              className="w-4 h-4 group-hover:text-brand-300 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <span className="truncate">Search workspaces, rooms, files...</span>
            <kbd className="text-[10px] font-mono text-gray-500 border border-white/10 rounded px-1.5 py-0.5 ml-auto flex-shrink-0">
              Ctrl+K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
          <button
            onClick={() => window.dispatchEvent(new Event('syncspace:open-shortcuts'))}
            className="hidden sm:flex items-center gap-1 px-2.5 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            title="Keyboard shortcuts (?)"
          >
            <kbd className="text-[10px] font-mono border border-white/10 rounded px-1.5 py-0.5">
              ?
            </kbd>
          </button>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-accent-500 rounded-full border-2 border-surface-900" />
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/10 bg-surface-850/95 backdrop-blur-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                      <p className="font-bold text-sm">Notifications</p>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            dispatch(markAllNotificationsRead());
                            showToast('All marked as read', 'success');
                          }}
                          className="text-xs text-brand-400 font-semibold"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto scrollbar-thin">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <BellIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((notif) => (
                          <button
                            key={notif._id}
                            onClick={() => dispatch(markNotificationRead(notif._id))}
                            className="w-full text-left px-4 py-3 border-b border-white/5 transition-colors hover:bg-white/5"
                            style={{ opacity: notif.isRead ? 0.5 : 1 }}
                          >
                            <div className="flex items-start gap-3">
                              {!notif.isRead && (
                                <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                              )}
                              <div className={!notif.isRead ? '' : 'ml-5'}>
                                <p className="text-sm font-semibold">{notif.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{notif.message}</p>
                                <p className="text-[10px] text-gray-500 mt-1">
                                  {new Date(notif.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-white/5">
                        <button
                          onClick={() => {
                            navigate('/dashboard/notifications');
                            setShowNotifications(false);
                          }}
                          className="w-full text-center text-xs text-brand-400 font-semibold"
                        >
                          View all
                        </button>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-secondary-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-brand-600/20">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </button>
            <AnimatePresence>
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-surface-850/95 backdrop-blur-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-white/5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-secondary-600 flex items-center justify-center text-white font-bold text-sm">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{user?.name || 'User'}</p>
                          <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/dashboard/profile');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                          />
                        </svg>
                        My Profile
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/dashboard/settings');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                          />
                        </svg>
                        Settings
                      </button>
                      <div className="my-1 border-t border-white/5" />
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                          />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
