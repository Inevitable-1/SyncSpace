import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { PlusIcon, MagnifyingGlassIcon, FolderIcon } from '../../components/Icons';
import { CardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import CreateWorkspaceModal from '../../components/common/CreateWorkspaceModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import WorkspaceCard from '../../components/workspace/WorkspaceCard';
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
  const { workspaces, isLoading, error } = useSelector((state: RootState) => state.workspace);
  const { rooms } = useSelector((state: RootState) => state.room);
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
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
        showToast('Workspace created successfully!', 'success');
        setShowCreateModal(false);
      } else if (action.meta.requestStatus === 'rejected') {
        const msg = action.payload as string;
        if (msg.includes('already') || msg.includes('duplicate')) {
          showToast('A workspace with this name already exists', 'error');
        } else {
          showToast(msg || 'Failed to create workspace', 'error');
        }
      }
    });
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
          title={search ? 'No matches found' : 'No workspaces yet'}
          description={
            search
              ? 'Try a different search term.'
              : 'Create your first workspace to start collaborating with your team.'
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
                <button type="button" onClick={() => setEditingWs(null)} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!editName.trim() || isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save'}
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
