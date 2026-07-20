import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  FolderIcon,
  UserIcon,
} from '../../components/Icons';
import { CardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import CreateWorkspaceModal from '../../components/common/CreateWorkspaceModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../components/common/Toast';
import {
  fetchWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from '../../features/workspace/workspaceSlice';
import { fetchRooms } from '../../features/room/roomSlice';
import type { RootState, AppDispatch } from '../../store';
import type { Workspace } from '../../types';

export default function WorkspacesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { workspaces, isLoading } = useSelector((state: RootState) => state.workspace);
  const { rooms } = useSelector((state: RootState) => state.room);
  const { user } = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWs, setEditingWs] = useState<Workspace | null>(null);
  const [deletingWs, setDeletingWs] = useState<Workspace | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    dispatch(fetchWorkspaces());
    dispatch(fetchRooms(undefined));
  }, [dispatch]);

  const filtered = workspaces.filter((ws) => ws.name.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = (data: {
    name: string;
    description: string;
    color: string;
    icon: string;
    isPublic: boolean;
  }) => {
    dispatch(createWorkspace(data)).then((action) => {
      if (action.meta.requestStatus === 'fulfilled') {
        showToast('Workspace created!', 'success');
        setShowCreateModal(false);
      }
    });
  };

  const handleEdit = (ws: Workspace) => {
    setEditingWs(ws);
    setEditName(ws.name);
    setEditDesc(ws.description);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWs && editName.trim()) {
      dispatch(
        updateWorkspace({
          id: editingWs._id,
          data: { name: editName.trim(), description: editDesc.trim() },
        }),
      ).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          showToast('Workspace updated!', 'success');
          setEditingWs(null);
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
        }
      });
    }
  };

  const handleShare = (ws: Workspace) => {
    navigator.clipboard.writeText(ws._id);
    showToast('Workspace ID copied to clipboard', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            My Workspaces
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" /> New Workspace
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
          style={{ color: 'var(--text-tertiary)' }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base pl-10"
          placeholder="Search workspaces..."
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FolderIcon className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />}
          title={search ? 'No matches' : 'No workspaces yet'}
          description={
            search ? 'Try a different search term.' : 'Create your first workspace to get started.'
          }
          action={
            !search ? (
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                Create Workspace
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ws, i) => (
            <motion.div
              key={ws._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card-hover p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: ws.color || '#6366f1' }}
                >
                  <span className="text-white font-bold">{ws.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleShare(ws)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
                    style={{ color: 'var(--text-tertiary)' }}
                    title="Share"
                  >
                    <ShareIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(ws)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
                    style={{ color: 'var(--text-tertiary)' }}
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingWs(ws)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="font-semibold mb-1 truncate" style={{ color: 'var(--text-primary)' }}>
                {ws.name}
              </p>
              {ws.description && (
                <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
                  {ws.description}
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
                    {ws.owner === user?.id ? 'You' : 'Owner'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {
                      rooms.filter((r) =>
                        typeof r.workspace === 'object'
                          ? r.workspace._id === ws._id
                          : r.workspace === ws._id,
                      ).length
                    }{' '}
                    room
                    {rooms.filter((r) =>
                      typeof r.workspace === 'object'
                        ? r.workspace._id === ws._id
                        : r.workspace === ws._id,
                    ).length !== 1
                      ? 's'
                      : ''}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(ws.createdAt).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        isLoading={isLoading}
      />

      {editingWs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setEditingWs(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md rounded-2xl border shadow-xl"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Edit Workspace
              </h2>
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
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setEditingWs(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={!editName.trim()}>
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

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
