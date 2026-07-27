import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, LinkIcon } from '../../components/Icons';
import { CardSkeleton } from '../../components/common/Skeleton';
import CreateRoomModal from '../../components/common/CreateRoomModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Toggle from '../../components/common/Toggle';
import { useToast } from '../../components/common/Toast';
import {
  fetchWorkspaces,
  updateWorkspace,
  deleteWorkspace,
  regenerateInviteCode,
} from '../../features/workspace/workspaceSlice';
import { fetchRooms, createRoom, deleteRoom } from '../../features/room/roomSlice';
import {
  fetchMembers,
  removeMember,
  updateMemberRole,
  suspendMember,
  reactivateMember,
} from '../../features/collaboration/memberSlice';
import { createInvite } from '../../features/collaboration/inviteSlice';
import { fetchActivities } from '../../features/activity/activitySlice';
import type { RootState, AppDispatch } from '../../store';
import type { Member } from '../../types';

type Tab = 'overview' | 'rooms' | 'members' | 'settings';

const WORKSPACE_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
];

const WORKSPACE_ICONS = [
  '📁',
  '🎯',
  '🚀',
  '💡',
  '🎨',
  '📊',
  '🔧',
  '🎮',
  '📚',
  '🌟',
  '💼',
  '🏠',
  '🎵',
  '🔬',
  '📱',
  '🌐',
  '⭐',
  '🔥',
  '💎',
  '🌈',
];

const ROOM_TYPE_COLORS: Record<string, string> = {
  whiteboard: '#8b5cf6',
  code: '#10b981',
  document: '#3b82f6',
};

const AVATAR_COLORS = ['#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#fb7185'];

export default function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const { workspaces, isLoading: wsLoading } = useSelector((state: RootState) => state.workspace);
  const { rooms, isLoading: roomLoading } = useSelector((state: RootState) => state.room);
  const { members, isLoading: memberLoading } = useSelector((state: RootState) => state.members);
  const { activities } = useSelector((state: RootState) => state.activity);
  const { user } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<{ id: string; name: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('#6366f1');
  const [editIcon, setEditIcon] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [memberActionId, setMemberActionId] = useState<string | null>(null);

  const workspace = workspaces.find((w) => w._id === id);
  const wsRooms = rooms.filter(
    (r) => (typeof r.workspace === 'object' ? r.workspace._id : r.workspace) === id,
  );

  useEffect(() => {
    if (workspaces.length === 0) dispatch(fetchWorkspaces());
    dispatch(fetchRooms(id));
    if (id) {
      dispatch(fetchMembers({ workspaceId: id }));
      dispatch(fetchActivities());
    }
  }, [dispatch, id, workspaces.length]);

  useEffect(() => {
    if (workspace) {
      setEditName(workspace.name);
      setEditDesc(workspace.description);
      setEditColor(workspace.color);
      setEditIcon(workspace.icon);
      setEditIsPublic(workspace.isPublic);
    }
  }, [workspace]);

  const handleCreateRoom = useCallback(
    (data: { name: string; type: string; workspaceId: string }) => {
      dispatch(createRoom(data)).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          showToast('Room created!', 'success');
          setShowCreateRoom(false);
        }
      });
    },
    [dispatch, showToast],
  );

  const handleDeleteRoom = () => {
    if (deletingRoom) {
      dispatch(deleteRoom(deletingRoom.id)).then(() => {
        showToast('Room deleted', 'info');
        setDeletingRoom(null);
      });
    }
  };

  const handleSaveSettings = () => {
    if (editName.trim()) {
      dispatch(
        updateWorkspace({
          id: id!,
          data: {
            name: editName.trim(),
            description: editDesc.trim(),
            color: editColor,
            icon: editIcon,
            isPublic: editIsPublic,
          },
        }),
      ).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          showToast('Workspace updated!', 'success');
          setIsEditing(false);
        }
      });
    }
  };

  const handleDeleteWorkspace = () => {
    dispatch(deleteWorkspace(id!)).then((action) => {
      if (action.meta.requestStatus === 'fulfilled') {
        showToast('Workspace deleted', 'info');
        navigate('/dashboard/workspaces');
      }
    });
  };

  const handleCopyInviteCode = () => {
    if (workspace?.inviteCode) {
      navigator.clipboard.writeText(workspace.inviteCode);
      setCopiedCode(true);
      showToast('Invite code copied!', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleInviteMember = () => {
    if (inviteEmail.trim() && id) {
      dispatch(createInvite({ workspaceId: id, email: inviteEmail.trim(), role: 'member' })).then(
        (action) => {
          if (action.meta.requestStatus === 'fulfilled') {
            showToast('Invite sent!', 'success');
            setInviteEmail('');
            setShowInviteInput(false);
          } else {
            showToast('Failed to send invite', 'error');
          }
        },
      );
    }
  };

  const handleMemberRole = (memberId: string, newRole: string) => {
    if (id) {
      dispatch(updateMemberRole({ workspaceId: id, memberId, role: newRole })).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          showToast(`Role updated to ${newRole}`, 'success');
          setMemberActionId(null);
        }
      });
    }
  };

  const handleSuspendMember = (memberId: string) => {
    if (id) {
      dispatch(suspendMember({ workspaceId: id, memberId })).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          showToast('Member suspended', 'info');
          setMemberActionId(null);
        }
      });
    }
  };

  const handleReactivateMember = (memberId: string) => {
    if (id) {
      dispatch(reactivateMember({ workspaceId: id, memberId })).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          showToast('Member reactivated', 'success');
          setMemberActionId(null);
        }
      });
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (id) {
      dispatch(removeMember({ workspaceId: id, memberId })).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          showToast('Member removed', 'info');
          setMemberActionId(null);
        }
      });
    }
  };

  if (!workspace && !wsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: 'var(--text-tertiary)' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21"
              />
            </svg>
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Workspace not found
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
            This workspace may have been deleted.
          </p>
          <button onClick={() => navigate('/dashboard/workspaces')} className="btn-primary text-sm">
            Back to Workspaces
          </button>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="space-y-6">
        <div
          className="h-40 rounded-2xl animate-pulse"
          style={{ background: 'var(--bg-tertiary)' }}
        />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const gradient = workspace.color || '#6366f1';
  const memberCount = workspace.members.length + 1;
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'rooms', label: 'Rooms', count: wsRooms.length },
    { id: 'members', label: 'Members', count: memberCount },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="space-y-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${gradient}, ${gradient}cc)` }}
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex items-start gap-4">
          <button
            onClick={() => navigate('/dashboard/workspaces')}
            className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition-all mt-1 flex-shrink-0"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 flex-shrink-0">
                <span className="text-2xl">
                  {workspace.icon || workspace.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold truncate">{workspace.name}</h1>
                {workspace.description && (
                  <p className="text-white/70 text-sm mt-0.5 truncate">{workspace.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm text-white/60 flex-wrap">
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                {memberCount} members
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
                {wsRooms.length} rooms
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-white/60" />
                {workspace.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div
        className="flex items-center gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent',
              boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card p-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(139, 92, 246, 0.1)' }}
                  >
                    <svg
                      className="w-5 h-5"
                      style={{ color: '#8b5cf6' }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <path d="M8 21h8M12 17v4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {wsRooms.length}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Rooms
                    </p>
                  </div>
                </div>
              </div>
              <div className="card p-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(59, 130, 246, 0.1)' }}
                  >
                    <svg
                      className="w-5 h-5"
                      style={{ color: '#3b82f6' }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {memberCount}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Members
                    </p>
                  </div>
                </div>
              </div>
              <div className="card p-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(16, 185, 129, 0.1)' }}
                  >
                    <svg
                      className="w-5 h-5"
                      style={{ color: '#10b981' }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {activities.length}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Activities
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-4">
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Recent Activity
                    </h3>
                    <button
                      onClick={() => setActiveTab('rooms')}
                      className="text-xs font-medium"
                      style={{ color: workspace.color || '#6366f1' }}
                    >
                      View All
                    </button>
                  </div>
                  {activities.length === 0 ? (
                    <p
                      className="text-xs py-4 text-center"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      No recent activity
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activities.slice(0, 5).map((activity, i) => {
                        const actUser = typeof activity.user === 'object' ? activity.user : null;
                        return (
                          <div key={activity._id || i} className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                            >
                              {actUser?.name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-xs truncate"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                <span
                                  className="font-medium"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  {actUser?.name || 'Unknown'}
                                </span>{' '}
                                {activity.action}
                                {activity.entityName && (
                                  <>
                                    {' '}
                                    <span style={{ color: 'var(--text-primary)' }}>
                                      {activity.entityName}
                                    </span>
                                  </>
                                )}
                              </p>
                              <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                                {new Date(activity.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-72 flex-shrink-0 hidden lg:block space-y-4">
                <div className="card p-5">
                  <h3
                    className="text-sm font-semibold mb-4"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowCreateRoom(true)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:opacity-80"
                      style={{ background: 'var(--bg-hover)' }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: `${gradient}20` }}
                      >
                        <PlusIcon className="w-4 h-4" style={{ color: gradient }} />
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          Create Room
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          Start collaborating
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('members');
                        setShowInviteInput(true);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:opacity-80"
                      style={{ background: 'var(--bg-hover)' }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(59, 130, 246, 0.1)' }}
                      >
                        <svg
                          className="w-4 h-4"
                          style={{ color: '#3b82f6' }}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          Invite Member
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          Grow your team
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="card p-5">
                  <h3
                    className="text-sm font-semibold mb-3"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Invite Code
                  </h3>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
                    Share this code to let others join.
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 px-3 py-2 rounded-lg border font-mono text-xs tracking-wider truncate"
                      style={{
                        borderColor: 'var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {workspace.inviteCode || 'No code'}
                    </div>
                    <button
                      onClick={handleCopyInviteCode}
                      className="p-2 rounded-lg transition-colors flex-shrink-0"
                      style={{
                        background: copiedCode ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-hover)',
                        color: copiedCode ? '#10b981' : 'var(--text-secondary)',
                      }}
                      disabled={!workspace.inviteCode}
                    >
                      {copiedCode ? (
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      ) : (
                        <LinkIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'rooms' && (
          <motion.div
            key="rooms"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {wsRooms.length} room{wsRooms.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <PlusIcon className="w-4 h-4" /> New Room
              </button>
            </div>

            {roomLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : wsRooms.length === 0 ? (
              <div className="card p-12 text-center">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(139, 92, 246, 0.1)' }}
                >
                  <svg
                    className="w-8 h-8"
                    style={{ color: '#8b5cf6' }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                  </svg>
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  No rooms yet
                </p>
                <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                  Create a room to start collaborating.
                </p>
                <button onClick={() => setShowCreateRoom(true)} className="btn-primary">
                  Create Room
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wsRooms.map((room, i) => (
                  <motion.div
                    key={room._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="card-hover p-5 cursor-pointer group"
                    onClick={() => {
                      if (room.type === 'whiteboard') navigate(`/whiteboard/${room._id}`);
                      else navigate(`/dashboard/rooms/${room._id}`);
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center"
                          style={{ background: ROOM_TYPE_COLORS[room.type] || '#6b7280' }}
                        >
                          <span className="text-white text-xs font-bold uppercase">
                            {room.type.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p
                            className="font-semibold text-sm"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {room.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                              style={{ background: ROOM_TYPE_COLORS[room.type] || '#6b7280' }}
                            >
                              {room.type}
                            </span>
                            {room.isActive && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                                style={{ background: '#22c55e' }}
                              >
                                Live
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingRoom({ id: room._id, name: room.name });
                        }}
                        className="p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        style={{ color: '#ef4444' }}
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                    <div
                      className="flex items-center justify-between pt-3 border-t"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {room.participants.length} participant
                        {room.participants.length !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (room.type === 'whiteboard') navigate(`/whiteboard/${room._id}`);
                          else navigate(`/dashboard/rooms/${room._id}`);
                        }}
                        className="px-3 py-1 text-xs font-medium rounded-lg text-white transition-all"
                        style={{ background: workspace.color || '#6366f1' }}
                      >
                        Open
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'members' && (
          <motion.div
            key="members"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {memberCount} member{memberCount !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => setShowInviteInput(!showInviteInput)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
                Invite Member
              </button>
            </div>

            <AnimatePresence>
              {showInviteInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="card p-4 overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="input-base flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && handleInviteMember()}
                    />
                    <button
                      onClick={handleInviteMember}
                      className="btn-primary text-sm"
                      disabled={!inviteEmail.trim()}
                    >
                      Send Invite
                    </button>
                    <button
                      onClick={() => {
                        setShowInviteInput(false);
                        setInviteEmail('');
                      }}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {memberLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full"
                        style={{ background: 'var(--bg-tertiary)' }}
                      />
                      <div className="flex-1 space-y-2">
                        <div
                          className="h-4 w-32 rounded"
                          style={{ background: 'var(--bg-tertiary)' }}
                        />
                        <div
                          className="h-3 w-48 rounded"
                          style={{ background: 'var(--bg-tertiary)' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card divide-y" style={{ borderColor: 'var(--border-color)' }}>
                <div className="p-4 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: gradient }}
                  >
                    {user?.name?.charAt(0) || 'Y'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {user?.name || 'You'}{' '}
                      <span
                        className="text-xs ml-1"
                        style={{ color: workspace.color || '#6366f1' }}
                      >
                        (Owner)
                      </span>
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {user?.email}
                    </p>
                  </div>
                  <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
                </div>

                {members.map((member: Member, i: number) => {
                  const memberUser = member.userId;
                  const memberName = typeof memberUser === 'object' ? memberUser.name : 'Unknown';
                  const memberEmail = typeof memberUser === 'object' ? memberUser.email : '';

                  return (
                    <div key={member._id} className="p-4 flex items-center gap-3 relative">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ background: AVATAR_COLORS[(i + 1) % AVATAR_COLORS.length] }}
                      >
                        {memberName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {memberName}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {memberEmail}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-medium capitalize"
                          style={{
                            background:
                              member.role === 'admin'
                                ? 'rgba(139, 92, 246, 0.1)'
                                : 'var(--bg-tertiary)',
                            color: member.role === 'admin' ? '#8b5cf6' : 'var(--text-tertiary)',
                          }}
                        >
                          {member.role}
                        </span>
                        {member.status === 'suspended' && (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-medium"
                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                          >
                            Suspended
                          </span>
                        )}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setMemberActionId(memberActionId === member._id ? null : member._id)
                            }
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="19" cy="12" r="1" />
                              <circle cx="5" cy="12" r="1" />
                            </svg>
                          </button>
                          <AnimatePresence>
                            {memberActionId === member._id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                className="absolute right-0 top-full mt-1 w-48 rounded-xl border z-50 py-1"
                                style={{
                                  background: 'var(--bg-card)',
                                  borderColor: 'var(--border-color)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                }}
                              >
                                {member.role !== 'admin' && (
                                  <button
                                    onClick={() => handleMemberRole(member._id, 'admin')}
                                    className="w-full px-3 py-2 text-left text-xs hover:opacity-80 transition-colors flex items-center gap-2"
                                    style={{ color: 'var(--text-secondary)' }}
                                  >
                                    <svg
                                      className="w-3.5 h-3.5"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                    </svg>
                                    Promote to Admin
                                  </button>
                                )}
                                {member.role === 'admin' && (
                                  <button
                                    onClick={() => handleMemberRole(member._id, 'member')}
                                    className="w-full px-3 py-2 text-left text-xs hover:opacity-80 transition-colors flex items-center gap-2"
                                    style={{ color: 'var(--text-secondary)' }}
                                  >
                                    <svg
                                      className="w-3.5 h-3.5"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                                    </svg>
                                    Demote to Member
                                  </button>
                                )}
                                {member.status !== 'suspended' ? (
                                  <button
                                    onClick={() => handleSuspendMember(member._id)}
                                    className="w-full px-3 py-2 text-left text-xs hover:opacity-80 transition-colors flex items-center gap-2"
                                    style={{ color: '#f59e0b' }}
                                  >
                                    <svg
                                      className="w-3.5 h-3.5"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                                    </svg>
                                    Suspend
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleReactivateMember(member._id)}
                                    className="w-full px-3 py-2 text-left text-xs hover:opacity-80 transition-colors flex items-center gap-2"
                                    style={{ color: '#22c55e' }}
                                  >
                                    <svg
                                      className="w-3.5 h-3.5"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Reactivate
                                  </button>
                                )}
                                <div
                                  className="my-1 border-t"
                                  style={{ borderColor: 'var(--border-color)' }}
                                />
                                <button
                                  onClick={() => handleRemoveMember(member._id)}
                                  className="w-full px-3 py-2 text-left text-xs hover:opacity-80 transition-colors flex items-center gap-2"
                                  style={{ color: '#ef4444' }}
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Remove Member
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="max-w-lg space-y-6"
          >
            <div className="card p-6 space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Workspace Details
              </h3>
              {isEditing ? (
                <>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
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
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {WORKSPACE_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setEditColor(color)}
                          className="w-8 h-8 rounded-lg transition-all"
                          style={{
                            background: color,
                            outline: editColor === color ? '2px solid var(--text-primary)' : 'none',
                            outlineOffset: editColor === color ? '2px' : '0',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Icon
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {WORKSPACE_ICONS.map((icon) => (
                        <button
                          key={icon}
                          onClick={() => setEditIcon(icon)}
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all"
                          style={{
                            background: editIcon === icon ? `${editColor}20` : 'var(--bg-hover)',
                            outline: editIcon === icon ? `2px solid ${editColor}` : 'none',
                            outlineOffset: editIcon === icon ? '2px' : '0',
                          }}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(workspace.name);
                        setEditDesc(workspace.description);
                        setEditColor(workspace.color);
                        setEditIcon(workspace.icon);
                        setEditIsPublic(workspace.isPublic);
                      }}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveSettings}
                      className="btn-primary text-sm"
                      disabled={!editName.trim() || wsLoading}
                    >
                      {wsLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ background: workspace.color }}
                    >
                      {workspace.icon || workspace.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {workspace.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {workspace.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsEditing(true)} className="btn-secondary text-sm">
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div className="card p-6 space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Visibility
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {editIsPublic ? 'Public' : 'Private'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {editIsPublic
                      ? 'Anyone can find and join this workspace'
                      : 'Only invited members can access this workspace'}
                  </p>
                </div>
                <Toggle checked={editIsPublic} onChange={setEditIsPublic} disabled={!isEditing} />
              </div>
            </div>

            <div className="card p-6 space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Invite Code
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Share this code with others to let them join your workspace.
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 px-3 py-2 rounded-lg border font-mono text-sm tracking-wider"
                  style={{
                    borderColor: 'var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {workspace.inviteCode || 'No code'}
                </div>
                <button
                  onClick={handleCopyInviteCode}
                  className="btn-secondary text-sm flex items-center gap-1"
                  disabled={!workspace.inviteCode}
                >
                  <LinkIcon className="w-3.5 h-3.5" /> {copiedCode ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <button
                onClick={() => {
                  dispatch(regenerateInviteCode(workspace._id)).then((action) => {
                    if (action.meta.requestStatus === 'fulfilled') {
                      showToast('Invite code regenerated!', 'success');
                    } else {
                      showToast('Failed to regenerate invite code', 'error');
                    }
                  });
                }}
                className="text-xs font-medium"
                style={{ color: workspace.color || '#6366f1' }}
                disabled={wsLoading}
              >
                Regenerate Code
              </button>
            </div>

            <div className="card p-6" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#ef4444' }}>
                Danger Zone
              </h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                Permanently delete this workspace and all its rooms.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
                style={{ background: '#ef4444' }}
              >
                Delete Workspace
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showCreateRoom && (
        <CreateRoomModal
          isOpen={showCreateRoom}
          onClose={() => setShowCreateRoom(false)}
          onSubmit={handleCreateRoom}
          workspaceId={id}
          isLoading={roomLoading}
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingRoom}
        onClose={() => setDeletingRoom(null)}
        onConfirm={handleDeleteRoom}
        title="Delete Room"
        message={`Are you sure you want to delete "${deletingRoom?.name}"?`}
        isLoading={roomLoading}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteWorkspace}
        title="Delete Workspace"
        message={`Are you sure you want to delete "${workspace?.name}"? This cannot be undone.`}
        isLoading={wsLoading}
      />
    </div>
  );
}
