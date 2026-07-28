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
  const { workspaces: _workspaces } = useSelector((state: RootState) => state.workspace);
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
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-[#030712]/80 backdrop-blur-2xl">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
            }}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all"
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
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <span>Search...</span>
            <kbd className="text-[10px] font-mono text-gray-500 border border-white/10 rounded px-1.5 py-0.5 ml-4">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
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
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#030712]" />
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
                    className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/10 bg-[#0a0f1e]/95 backdrop-blur-2xl shadow-2xl z-50 overflow-hidden"
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
                    className="absolute right-0 mt-2 w-60 rounded-2xl border border-white/10 bg-[#0a0f1e]/95 backdrop-blur-2xl shadow-2xl z-50 overflow-hidden"
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
