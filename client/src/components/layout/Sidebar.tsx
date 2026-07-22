import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  FolderIcon,
  ClockIcon,
  UserGroupIcon,
  BellIcon,
  TrashIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XIcon,
  ChartBarIcon,
  ChevronLeftIcon,
} from '../Icons';
import { logout } from '../../features/auth/authSlice';
import { fetchWorkspaces } from '../../features/workspace/workspaceSlice';
import type { RootState, AppDispatch } from '../../store';

const mainNavItems = [
  { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
  { to: '/dashboard/workspaces', icon: FolderIcon, label: 'My Workspaces', showCount: true },
  { to: '/dashboard/rooms', icon: ClockIcon, label: 'Recent Rooms' },
  { to: '/dashboard/shared', icon: UserGroupIcon, label: 'Shared With Me' },
  { to: '/dashboard/activity', icon: ChartBarIcon, label: 'Activity' },
];

const bottomNavItems = [
  { to: '/dashboard/notifications', icon: BellIcon, label: 'Notifications' },
  { to: '/dashboard/trash', icon: TrashIcon, label: 'Trash' },
  { to: '/dashboard/settings', icon: Cog6ToothIcon, label: 'Settings' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { workspaces } = useSelector((state: RootState) => state.workspace);

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const NavItem = ({
    to,
    icon: Icon,
    label,
    showCount,
  }: {
    to: string;
    icon: React.ElementType;
    label: string;
    showCount?: boolean;
  }) => {
    const count = showCount ? workspaces.length : 0;
    return (
      <NavLink to={to} end={to === '/dashboard'} onClick={onClose} className="group relative">
        {({ isActive }) => (
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'hover:bg-[var(--bg-hover)]'
            }`}
            style={!isActive ? { color: 'var(--text-secondary)' } : undefined}
            title={collapsed ? label : undefined}
          >
            {isActive && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/25"
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-3 w-full">
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{label}</span>
                  {showCount && count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </>
              )}
            </span>
          </div>
        )}
      </NavLink>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div
        className={`flex items-center border-b transition-all duration-200 ${collapsed ? 'justify-center p-4' : 'justify-between p-5'}`}
        style={{ borderColor: 'var(--border-color)' }}
      >
        {!collapsed && (
          <NavLink to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              SyncSpace
            </span>
          </NavLink>
        )}
        {collapsed && (
          <NavLink
            to="/dashboard"
            className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center"
          >
            <span className="text-white font-bold text-sm">S</span>
          </NavLink>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <ChevronLeftIcon
              className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>
      </nav>

      <div className="p-3 space-y-1 border-t" style={{ borderColor: 'var(--border-color)' }}>
        {bottomNavItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        <div
          className={`pt-2 mt-2 border-t flex items-center gap-3 transition-all ${collapsed ? 'justify-center px-1' : 'px-3'} py-2.5 rounded-xl`}
          style={{ borderColor: 'var(--border-color)', background: 'var(--bg-tertiary)' }}
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.name || 'User'}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                {user?.email || ''}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 ${collapsed ? 'justify-center' : ''}`}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 border-r z-30 transition-all duration-300 ${
          collapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
        }}
      >
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 z-50 lg:hidden border-r"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
              }}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
