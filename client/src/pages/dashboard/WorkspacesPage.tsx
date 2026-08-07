import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  UserGroupIcon,
  StarIcon,
  ClockIcon,
  XIcon,
} from '../../components/Icons';
import { CardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import WorkspaceOnboarding from '../../components/workspace/WorkspaceOnboarding';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import WorkspaceCard from '../../components/workspace/WorkspaceCard';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../components/common/Toast';
import {
  fetchWorkspaces,
  updateWorkspace,
  deleteWorkspace,
} from '../../features/workspace/workspaceSlice';
import { fetchRooms } from '../../features/room/roomSlice';
import type { RootState, AppDispatch } from '../../store';
import type { Workspace } from '../../types';

type WorkspaceFilter = 'all' | 'favorites';

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const duration = 700;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span>{display.toLocaleString()}</span>;
}

export default function WorkspacesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { workspaces, isLoading, error } = useSelector((state: RootState) => state.workspace);
  const { rooms } = useSelector((state: RootState) => state.room);
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<WorkspaceFilter>('all');
  const [showWizard, setShowWizard] = useState(false);
  const [editingWs, setEditingWs] = useState<Workspace | null>(null);
  const [deletingWs, setDeletingWs] = useState<Workspace | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);

  useEffect(() => {
    dispatch(fetchWorkspaces());
    dispatch(fetchRooms(undefined));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error, showToast]);

  const favorites = workspaces.filter((ws) => ws.isFavorite).length;
  const totalMembers = useMemo(
    () => workspaces.reduce((sum, ws) => sum + (ws.memberCount || ws.members.length + 1), 0),
    [workspaces],
  );

  const filtered = useMemo(() => {
    return workspaces.filter((ws) => {
      const matchesFilter = filter === 'all' || ws.isFavorite;
      const matchesSearch = ws.name.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [workspaces, filter, search]);

  const handleWizardCreated = (workspaceId: string) => {
    setShowWizard(false);
    dispatch(fetchWorkspaces());
    navigate(`/dashboard/workspaces/${workspaceId}`);
  };

  const handleEdit = (ws: Workspace) => {
    setEditingWs(ws);
    setEditName(ws.name);
    setEditDesc(ws.description);
    setEditIsPublic(ws.isPublic);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWs && editName.trim()) {
      dispatch(
        updateWorkspace({
          id: editingWs._id,
          data: { name: editName.trim(), description: editDesc.trim(), isPublic: editIsPublic },
        }),
      ).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          showToast('Workspace updated successfully!', 'success');
          setEditingWs(null);
        } else {
          showToast((action.payload as string) || 'Failed to update workspace', 'error');
        }
      });
    }
  };

  const handleDelete = () => {
    if (deletingWs) {
      dispatch(deleteWorkspace(deletingWs._id)).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          showToast('Workspace deleted', 'info');
          setDeletingWs(null);
        } else {
          showToast((action.payload as string) || 'Failed to delete workspace', 'error');
        }
      });
    }
  };

  const handleShare = (ws: Workspace) => {
    navigator.clipboard.writeText(ws.inviteCode || ws._id);
    showToast('Invite code copied to clipboard!', 'success');
  };

  const stats = [
    {
      label: 'Total Workspaces',
      value: workspaces.length,
      icon: FolderIcon,
      gradient: 'from-brand-500 to-purple-600',
      accent: 'border-brand-500/30 text-brand-300',
    },
    {
      label: 'Favorites',
      value: favorites,
      icon: StarIcon,
      gradient: 'from-amber-500 to-orange-600',
      accent: 'border-amber-500/30 text-amber-300',
    },
    {
      label: 'Team Members',
      value: totalMembers,
      icon: UserGroupIcon,
      gradient: 'from-emerald-500 to-teal-600',
      accent: 'border-emerald-500/30 text-emerald-300',
    },
    {
      label: 'Rooms',
      value: rooms.length,
      icon: ClockIcon,
      gradient: 'from-cyan-500 to-blue-600',
      accent: 'border-cyan-500/30 text-cyan-300',
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <span className="w-1 h-8 rounded-full bg-gradient-to-b from-brand-500 to-purple-500 flex-shrink-0" />
          <div>
            <h1
              className="text-2xl font-black tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Workspaces
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''} · {favorites}{' '}
              favorite{favorites !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button onClick={() => setShowWizard(true)} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> New Workspace
        </button>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            whileHover={{ y: -3 }}
            className="rounded-2xl p-4 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/25 transition-all duration-300"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p
                  className="text-xl sm:text-2xl font-black"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <AnimatedNumber value={stat.value} />
                </p>
                <p
                  className="text-[11px] mt-0.5 truncate"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {stat.label}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col md:flex-row gap-3"
      >
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-10"
            placeholder="Search workspaces by name..."
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
          {(['all', 'favorites'] as WorkspaceFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filter === f
                  ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-lg shadow-brand-600/20'
                  : ''
              }`}
              style={filter !== f ? { color: 'var(--text-secondary)' } : undefined}
            >
              {f === 'favorites' && <StarIcon className="w-3.5 h-3.5" />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FolderIcon className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />}
          title={search || filter === 'favorites' ? 'No matches found' : 'No workspaces yet'}
          description={
            search
              ? 'Try a different search term.'
              : filter === 'favorites'
                ? 'You have not favorited any workspaces yet. Tap the star on a workspace to save it here.'
                : 'Create your first workspace to start collaborating with your team.'
          }
          action={
            !search && filter === 'all' ? (
              <button onClick={() => setShowWizard(true)} className="btn-primary">
                Create Workspace
              </button>
            ) : undefined
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
        >
          {filtered.map((ws, i) => {
            const roomCount = rooms.filter((r) =>
              typeof r.workspace === 'object' ? r.workspace._id === ws._id : r.workspace === ws._id,
            ).length;
            return (
              <WorkspaceCard
                key={ws._id}
                workspace={ws}
                index={i}
                roomCount={roomCount}
                onEdit={handleEdit}
                onDelete={setDeletingWs}
                onShare={handleShare}
              />
            );
          })}
        </motion.div>
      )}

      <WorkspaceOnboarding
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onCreated={handleWizardCreated}
      />

      <AnimatePresence>
        {editingWs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingWs(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <div className="h-1.5 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500" />
              <form onSubmit={handleUpdate} className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-600/25">
                    {editingWs.icon || editingWs.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      Edit Workspace
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Update the details of this workspace
                    </p>
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-base"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Description
                  </label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="input-base resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Visibility
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditIsPublic(false)}
                      className={`flex-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        !editIsPublic ? 'border-indigo-500 bg-indigo-600/10 text-indigo-500' : ''
                      }`}
                      style={
                        editIsPublic
                          ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
                          : undefined
                      }
                    >
                      🔒 Private
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditIsPublic(true)}
                      className={`flex-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        editIsPublic ? 'border-indigo-500 bg-indigo-600/10 text-indigo-500' : ''
                      }`}
                      style={
                        !editIsPublic
                          ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
                          : undefined
                      }
                    >
                      🌐 Public
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingWs(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center gap-2"
                    disabled={!editName.trim() || isLoading}
                  >
                    {isLoading ? <Spinner size="sm" /> : null}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!deletingWs}
        onClose={() => setDeletingWs(null)}
        onConfirm={handleDelete}
        title="Delete Workspace"
        message={`Are you sure you want to delete "${deletingWs?.name}"? This will also delete all rooms in this workspace.`}
        isLoading={isLoading}
      />
    </div>
  );
}
