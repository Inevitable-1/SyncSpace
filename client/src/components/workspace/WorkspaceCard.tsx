import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  PencilIcon,
  TrashIcon,
  ShareIcon,
  UserIcon,
  FolderIcon,
  ArrowRightIcon,
  ClockIcon,
} from '../Icons';
import { toggleFavorite } from '../../features/workspace/workspaceSlice';
import type { Workspace } from '../../types';
import type { RootState, AppDispatch } from '../../store';

const GRADIENTS = [
  'from-indigo-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-fuchsia-600',
];

interface WorkspaceCardProps {
  workspace: Workspace;
  index: number;
  roomCount?: number;
  onEdit?: (ws: Workspace) => void;
  onDelete?: (ws: Workspace) => void;
  onShare?: (ws: Workspace) => void;
  variant?: 'grid' | 'dashboard';
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function WorkspaceCard({
  workspace,
  index,
  roomCount = 0,
  onEdit,
  onDelete,
  onShare,
  variant = 'grid',
}: WorkspaceCardProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const gradient = GRADIENTS[index % GRADIENTS.length];

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleFavorite(workspace._id));
  };

  const openWorkspace = () => navigate(`/dashboard/workspaces/${workspace._id}`);

  if (variant === 'dashboard') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        className="card-hover overflow-hidden cursor-pointer group"
        onClick={openWorkspace}
      >
        <div className={`h-24 bg-gradient-to-br ${gradient} relative`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <span className="text-white font-bold text-lg">
              {workspace.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {workspace.isPublic && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/20 text-white backdrop-blur-sm">
                Public
              </span>
            )}
            <motion.button
              onClick={handleToggleFavorite}
              whileTap={{ scale: 0.8 }}
              className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 transition-colors hover:bg-white/30"
              title={workspace.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <motion.svg
                key={workspace.isFavorite ? 'filled' : 'outline'}
                initial={{ scale: 0.5, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill={workspace.isFavorite ? '#facc15' : 'none'}
                stroke={workspace.isFavorite ? '#facc15' : 'white'}
                strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </motion.svg>
            </motion.button>
          </div>
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="px-3 py-1 rounded-lg bg-white/20 text-white text-xs font-medium backdrop-blur-sm">
              Open →
            </span>
          </div>
        </div>
        <div className="p-4">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {workspace.name}
          </p>
          {workspace.description && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
              {workspace.description}
            </p>
          )}
          <div
            className="flex items-center justify-between mt-3 pt-3 border-t"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {[0, 1, 2].slice(0, Math.min(3, workspace.members.length + 1)).map((j) => (
                  <div
                    key={j}
                    className="w-5 h-5 rounded-full border-2 border-[var(--bg-card)] flex items-center justify-center text-[8px] font-bold text-white"
                    style={{
                      background:
                        j === 0
                          ? workspace.color || '#6366f1'
                          : ['#818cf8', '#a78bfa', '#c084fc'][j - 1],
                    }}
                  >
                    {j === 0 ? user?.name?.charAt(0) || 'Y' : ''}
                  </div>
                ))}
              </div>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {workspace.members.length + 1} member{workspace.members.length + 1 !== 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {roomCount} room{roomCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl cursor-pointer border border-white/5 bg-white/[0.02] backdrop-blur-2xl hover:border-brand-500/30 hover:bg-white/[0.03] transition-all duration-300"
      onClick={openWorkspace}
    >
      <div className={`h-28 sm:h-32 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.35) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.25) 0%, transparent 45%)',
          }}
        />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-xl shadow-lg">
            {workspace.icon || workspace.name.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/20 text-white backdrop-blur-sm border border-white/30`}
          >
            {workspace.isPublic ? 'Public' : 'Private'}
          </span>
          <motion.button
            onClick={handleToggleFavorite}
            whileTap={{ scale: 0.8 }}
            className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 transition-colors hover:bg-white/30"
            title={workspace.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <motion.svg
              key={workspace.isFavorite ? 'filled' : 'outline'}
              initial={{ scale: 0.5, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill={workspace.isFavorite ? '#facc15' : 'none'}
              stroke={workspace.isFavorite ? '#facc15' : 'white'}
              strokeWidth="2"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </motion.svg>
          </motion.button>
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <FolderIcon className="w-3.5 h-3.5 text-white/90" />
          <span className="text-[11px] font-medium text-white/90 truncate max-w-[200px]">
            Project · {workspace.name}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p
            className="font-bold text-sm sm:text-base truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {workspace.name}
          </p>
          <span
            className="text-[10px] flex items-center gap-1 flex-shrink-0"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <ClockIcon className="w-3 h-3" />
            {timeAgo(workspace.updatedAt)}
          </span>
        </div>
        {workspace.description && (
          <p
            className="text-xs mt-1.5 line-clamp-2 leading-relaxed"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {workspace.description}
          </p>
        )}

        <div
          className="flex items-center justify-between mt-3.5 pt-3.5 border-t"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex -space-x-1.5">
              {[0, 1, 2].slice(0, Math.min(3, workspace.members.length + 1)).map((j) => (
                <div
                  key={j}
                  className="w-6 h-6 rounded-full border-2 border-[var(--bg-card)] flex items-center justify-center text-[9px] font-bold text-white"
                  style={{
                    background:
                      j === 0
                        ? workspace.color || '#6366f1'
                        : ['#818cf8', '#a78bfa', '#c084fc'][j - 1],
                  }}
                >
                  {j === 0 ? user?.name?.charAt(0) || 'Y' : ''}
                </div>
              ))}
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {workspace.members.length + 1}
            </span>
            <UserIcon
              className="w-3.5 h-3.5 opacity-40"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <span className="text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>
              {roomCount} room{roomCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-3">
          <div className="flex items-center gap-1">
            {onShare && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(workspace);
                }}
                className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-tertiary)' }}
                title="Share"
              >
                <ShareIcon className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(workspace);
                }}
                className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-tertiary)' }}
                title="Edit"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(workspace);
                }}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Delete"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={(e) => {
              e.stopPropagation();
              openWorkspace();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 transition-all shadow-lg shadow-brand-600/25 flex items-center gap-1.5"
          >
            Open
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
