import { memo, useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  FolderIcon,
  ClockIcon,
  VideoCameraIcon,
  UserGroupIcon,
  BellIcon,
  TrashIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  UserIcon,
  DocumentTextIcon,
} from '../Icons';
import { logout } from '../../features/auth/authSlice';
import LogoMark from '../logo/LogoMark';
import type { RootState, AppDispatch } from '../../store';

const mainNavItems = [
  { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
  { to: '/dashboard/workspaces', icon: FolderIcon, label: 'Workspaces', showCount: true },
  { to: '/dashboard/rooms', icon: ClockIcon, label: 'Rooms' },
  { to: '/dashboard/meetings', icon: VideoCameraIcon, label: 'Meetings' },
  { to: '/dashboard/files', icon: DocumentTextIcon, label: 'Files' },
  { to: '/dashboard/shared', icon: UserGroupIcon, label: 'Shared' },
  { to: '/dashboard/insights', icon: ChartBarIcon, label: 'Insights' },
  { to: '/dashboard/activity', icon: ChartBarIcon, label: 'Activity' },
];

const bottomNavItems = [
  { to: '/dashboard/notifications', icon: BellIcon, label: 'Notifications' },
  { to: '/dashboard/trash', icon: TrashIcon, label: 'Trash' },
  { to: '/dashboard/settings', icon: Cog6ToothIcon, label: 'Settings' },
];

const NavItem = memo(
  ({
    to,
    icon: Icon,
    label,
    showCount,
    count,
    collapsed,
    onClose,
  }: {
    to: string;
    icon: React.ElementType;
    label: string;
    showCount?: boolean;
    count: number;
    collapsed: boolean;
    onClose: () => void;
  }) => (
    <NavLink to={to} end={to === '/dashboard'} onClick={onClose} className="group relative">
      {({ isActive }) => (
        <div
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            isActive
              ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-lg shadow-brand-600/25'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
          title={collapsed ? label : undefined}
        >
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 bg-gradient-to-r from-brand-600 to-purple-600 rounded-xl shadow-lg shadow-brand-600/25"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-3 w-full">
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1">{label}</span>
                {showCount && count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-white/10 text-white/80">
                    {count}
                  </span>
                )}
              </>
            )}
          </span>
        </div>
      )}
    </NavLink>
  ),
);

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
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  const workspaceCount = workspaces.length;

  const profileCard = collapsed ? (
    <NavLink
      to="/dashboard/profile"
      onClick={onClose}
      title={user?.name || 'Profile'}
      className="flex items-center justify-center p-3 rounded-xl transition-all bg-white/[0.03] border border-white/5 hover:bg-white/5"
    >
      <div className="relative">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface-900" />
      </div>
    </NavLink>
  ) : (
    <div ref={profileRef} className="relative">
      <button
        onClick={() => setProfileOpen((v) => !v)}
        className="flex items-center gap-3 w-full p-3 rounded-xl transition-all bg-white/[0.03] border border-white/5 hover:bg-white/5 hover:border-white/10"
      >
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-brand-600/20">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface-900" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold truncate flex items-center gap-1.5">
            {user?.name || 'User'}
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </p>
          <p className="text-[10px] text-gray-500 truncate">{user?.email || ''}</p>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {profileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-3 right-3 bottom-full mb-2 rounded-xl border border-white/10 bg-surface-850/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </p>
                </div>
              </div>
            </div>
            <div className="p-1.5">
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/dashboard/profile');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
              >
                <UserIcon className="w-4 h-4" /> Profile
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/dashboard/settings');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
              >
                <Cog6ToothIcon className="w-4 h-4" /> Settings
              </button>
              <div className="my-1 border-t border-white/5" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div
        className={`flex items-center border-b border-white/5 transition-all duration-200 ${collapsed ? 'justify-center p-4' : 'justify-between p-5'}`}
      >
        {!collapsed ? (
          <NavLink to="/dashboard" className="flex items-center gap-2.5">
            <LogoMark size={32} showGlow={false} />
            <span className="text-lg font-black tracking-tight">SyncSpace</span>
          </NavLink>
        ) : (
          <NavLink to="/dashboard" className="block">
            <LogoMark size={32} showGlow={false} />
          </NavLink>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ChevronLeftIcon
              className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              count={item.showCount ? workspaceCount : 0}
              collapsed={collapsed}
              onClose={onClose}
            />
          ))}
        </div>
      </nav>

      <div className="p-3 space-y-1 border-t border-white/5">
        {bottomNavItems.map((item) => (
          <NavItem key={item.to} {...item} count={0} collapsed={collapsed} onClose={onClose} />
        ))}

        <div className="mt-2">{profileCard}</div>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 border-r border-white/5 z-30 transition-all duration-300 ${
          collapsed ? 'lg:w-20' : 'lg:w-64'
        } bg-surface-900/80 backdrop-blur-2xl`}
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 z-50 lg:hidden border-r border-white/5 bg-surface-900/95 backdrop-blur-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
