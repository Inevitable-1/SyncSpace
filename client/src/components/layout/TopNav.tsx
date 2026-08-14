import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../common/Toast';
import {
  Bars3Icon,
  SunIcon,
  MoonIcon,
  BellIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
} from '../Icons';
import { logout } from '../../features/auth/authSlice';
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
  const { user, isDemo } = useSelector((state: RootState) => state.auth);
  const { notifications, unreadCount } = useSelector((state: RootState) => state.notification);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchWorkspaces());
    dispatch(fetchNotifications(20));
  }, [dispatch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotifications(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  const pageTitle =
    PAGE_TITLES.find((p) => p.pattern.test(location.pathname))?.title || 'Dashboard';

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
          <span
            className={`hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              isDemo
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                : 'bg-gradient-to-r from-brand-600/20 to-purple-600/20 border-brand-500/20 text-brand-300'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isDemo ? 'bg-amber-400' : 'bg-brand-400'}`}
            />
            {isDemo ? 'Demo Mode' : 'Overview'}
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
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
          <button
            onClick={() => window.dispatchEvent(new Event('syncspace:open-shortcuts'))}
            className="hidden sm:flex items-center gap-1 px-2.5 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
          >
            <kbd className="text-[10px] font-mono border border-white/10 rounded px-1.5 py-0.5">
              ?
            </kbd>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface-900" />
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

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <ChevronDownIcon className="w-4 h-4 text-gray-400 hidden sm:block" />
            </button>
            <AnimatePresence>
              {showProfile && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-60 rounded-2xl border border-white/10 bg-surface-850/95 backdrop-blur-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/5">
                      <p className="text-sm font-bold">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      {[
                        {
                          icon: UserIcon,
                          label: 'Profile',
                          action: () => navigate('/dashboard/profile'),
                        },
                        {
                          icon: Cog6ToothIcon,
                          label: 'Settings',
                          action: () => navigate('/dashboard/settings'),
                        },
                        {
                          icon: BellIcon,
                          label: 'Notifications',
                          action: () => navigate('/dashboard/notifications'),
                        },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={() => {
                            item.action();
                            setShowProfile(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                          <item.icon className="w-4 h-4" /> {item.label}
                        </button>
                      ))}
                      <div className="my-1 border-t border-white/5" />
                      <button
                        onClick={() => {
                          toggleTheme();
                          setShowProfile(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                      >
                        {theme === 'dark' ? (
                          <SunIcon className="w-4 h-4" />
                        ) : (
                          <MoonIcon className="w-4 h-4" />
                        )}
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" /> Logout
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
