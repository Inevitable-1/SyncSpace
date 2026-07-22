import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
import GlobalSearch from '../common/GlobalSearch';
import type { RootState, AppDispatch } from '../../store';

interface TopNavProps {
  onMenuClick: () => void;
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const { notifications, unreadCount } = useSelector((state: RootState) => state.notification);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWorkspaceSwitcher, setShowWorkspaceSwitcher] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<HTMLDivElement>(null);

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
      if (wsRef.current && !wsRef.current.contains(e.target as Node))
        setShowWorkspaceSwitcher(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
    showToast('All notifications marked as read', 'success');
  };

  const handleNotifClick = (notifId: string) => {
    dispatch(markNotificationRead(notifId));
  };

  return (
    <header
      className="sticky top-0 z-20 border-b bg-glass border-glass"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div className="hidden sm:flex items-center">
            <GlobalSearch />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Workspace Switcher */}
          <div className="relative" ref={wsRef}>
            <button
              onClick={() => setShowWorkspaceSwitcher(!showWorkspaceSwitcher)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)' }}
            >
              <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">W</span>
              </div>
              <span className="max-w-[100px] truncate">{workspaces[0]?.name || 'Workspaces'}</span>
              <ChevronDownIcon className="w-3.5 h-3.5" />
            </button>
            <AnimatePresence>
              {showWorkspaceSwitcher && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowWorkspaceSwitcher(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 rounded-xl border shadow-xl z-50 overflow-hidden"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                  >
                    <div className="p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <p
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        Workspaces
                      </p>
                    </div>
                    <div className="p-2 max-h-60 overflow-y-auto">
                      {workspaces.slice(0, 10).map((ws) => (
                        <button
                          key={ws._id}
                          onClick={() => {
                            navigate('/dashboard/workspaces');
                            setShowWorkspaceSwitcher(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-[var(--bg-hover)]"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: ws.color || '#6366f1' }}
                          >
                            {ws.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate font-medium">{ws.name}</span>
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          navigate('/dashboard/workspaces');
                          setShowWorkspaceSwitcher(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-indigo-500 font-medium hover:bg-[var(--bg-hover)]"
                      >
                        View all workspaces
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl transition-colors duration-200 hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl transition-colors hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2"
                  style={{ borderColor: 'var(--bg-card)' }}
                />
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
                    className="absolute right-0 mt-2 w-80 rounded-xl border shadow-xl z-50 overflow-hidden"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                  >
                    <div
                      className="flex items-center justify-between p-4 border-b"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Notifications
                      </p>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-indigo-500 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center" style={{ color: 'var(--text-tertiary)' }}>
                          <BellIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((notif) => (
                          <button
                            key={notif._id}
                            onClick={() => handleNotifClick(notif._id)}
                            className="w-full text-left px-4 py-3 border-b transition-colors hover:bg-[var(--bg-hover)]"
                            style={{
                              borderColor: 'var(--border-light)',
                              opacity: notif.isRead ? 0.6 : 1,
                            }}
                          >
                            <div className="flex items-start gap-3">
                              {!notif.isRead && (
                                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                              )}
                              <div className={!notif.isRead ? '' : 'ml-5'}>
                                <p
                                  className="text-sm font-medium"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  {notif.title}
                                </p>
                                <p
                                  className="text-xs mt-0.5"
                                  style={{ color: 'var(--text-tertiary)' }}
                                >
                                  {notif.message}
                                </p>
                                <p
                                  className="text-[10px] mt-1"
                                  style={{ color: 'var(--text-tertiary)' }}
                                >
                                  {new Date(notif.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                        <button
                          onClick={() => {
                            navigate('/dashboard/notifications');
                            setShowNotifications(false);
                          }}
                          className="w-full text-center text-xs text-indigo-500 font-medium"
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-1.5 rounded-xl transition-colors duration-200 hover:bg-[var(--bg-hover)]"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <ChevronDownIcon
                className="w-4 h-4 hidden sm:block"
                style={{ color: 'var(--text-secondary)' }}
              />
            </button>
            <AnimatePresence>
              {showProfile && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-60 rounded-xl border shadow-xl z-50 overflow-hidden"
                    style={{
                      background: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  >
                    <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {user?.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {user?.email}
                      </p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          navigate('/dashboard/settings');
                          setShowProfile(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-[var(--bg-hover)]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <UserIcon className="w-4 h-4" /> My Profile
                      </button>
                      <button
                        onClick={() => {
                          navigate('/dashboard/settings');
                          setShowProfile(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-[var(--bg-hover)]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <Cog6ToothIcon className="w-4 h-4" /> Settings
                      </button>
                      <button
                        onClick={() => {
                          navigate('/dashboard/notifications');
                          setShowProfile(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-[var(--bg-hover)]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <BellIcon className="w-4 h-4" /> Notifications
                      </button>
                      <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-[var(--bg-hover)]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {theme === 'dark' ? (
                          <SunIcon className="w-4 h-4" />
                        ) : (
                          <MoonIcon className="w-4 h-4" />
                        )}
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                      </button>
                      <div
                        className="my-1 border-t"
                        style={{ borderColor: 'var(--border-color)' }}
                      />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
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
