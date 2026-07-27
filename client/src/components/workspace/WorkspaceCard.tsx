import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { PencilIcon, TrashIcon, ShareIcon, UserIcon } from '../Icons';
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

  if (variant === 'dashboard') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        className="card-hover overflow-hidden cursor-pointer group"
        onClick={() => navigate(`/dashboard/workspaces/${workspace._id}`)}
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="card-hover p-5 cursor-pointer"
      onClick={() => navigate(`/dashboard/workspaces/${workspace._id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: workspace.color || '#6366f1' }}
        >
          <span className="text-white font-bold">{workspace.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex gap-1">
          <motion.button
            onClick={handleToggleFavorite}
            whileTap={{ scale: 0.8 }}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: workspace.isFavorite ? '#facc15' : 'var(--text-tertiary)' }}
            title={workspace.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <motion.svg
              key={workspace.isFavorite ? 'filled' : 'outline'}
              initial={{ scale: 0.5, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill={workspace.isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </motion.svg>
          </motion.button>
          {onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(workspace);
              }}
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
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
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
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
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Delete"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <p className="font-semibold mb-1 truncate" style={{ color: 'var(--text-primary)' }}>
        {workspace.name}
      </p>
      {workspace.description && (
        <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
          {workspace.description}
        </p>
      )}
      <div
        className="flex items-center justify-between pt-3 border-t"
        style={{ borderColor: 'var(--border-light)' }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-xs flex items-center gap-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <UserIcon className="w-3 h-3" />
            {workspace.owner === user?.id ? 'You' : 'Owner'}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {workspace.members.length + 1} member{workspace.members.length + 1 !== 1 ? 's' : ''}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {roomCount} room{roomCount !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {new Date(workspace.createdAt).toLocaleDateString()}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            workspace.isPublic
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
          }`}
        >
          {workspace.isPublic ? 'Public' : 'Private'}
        </span>
      </div>
    </motion.div>
  );
}
