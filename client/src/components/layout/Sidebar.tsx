import { memo } from 'react';
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
} from '../Icons';
import { logout } from '../../features/auth/authSlice';
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

function DocumentTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    </svg>
  );
}

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

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const workspaceCount = workspaces.length;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div
        className={`flex items-center border-b border-white/5 transition-all duration-200 ${collapsed ? 'justify-center p-4' : 'justify-between p-5'}`}
      >
        {!collapsed ? (
          <NavLink to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-600/30">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-lg font-black tracking-tight">SyncSpace</span>
          </NavLink>
        ) : (
          <NavLink
            to="/dashboard"
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-600/30"
          >
            <span className="text-white font-bold text-sm">S</span>
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

        <NavLink
          to="/dashboard/profile"
          onClick={onClose}
          className={`flex items-center gap-3 p-3 rounded-xl transition-all mt-2 ${
            collapsed ? 'justify-center' : ''
          } bg-white/[0.03] border border-white/5 hover:bg-white/5`}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email || ''}</p>
            </div>
          )}
        </NavLink>

        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-red-500/10 text-red-400 hover:text-red-300 ${collapsed ? 'justify-center' : ''}`}
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
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 border-r border-white/5 z-30 transition-all duration-300 ${
          collapsed ? 'lg:w-20' : 'lg:w-64'
        } bg-[#060a14]/80 backdrop-blur-2xl`}
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
              className="fixed inset-y-0 left-0 w-64 z-50 lg:hidden border-r border-white/5 bg-[#060a14]/95 backdrop-blur-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
