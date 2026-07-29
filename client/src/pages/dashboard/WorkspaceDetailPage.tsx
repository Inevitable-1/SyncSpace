import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ChatBubbleLeftIcon,
  FireIcon,
  ClockIcon,
} from '../../components/Icons';
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
  toggleFavorite,
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

const AVATAR_COLORS = ['#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#fb7185'];
const ROOM_EMOJIS: Record<string, string> = { whiteboard: '🎨', code: '💻', document: '📝' };
const ROOM_GRADIENTS: Record<string, string> = {
  whiteboard: 'from-purple-500 to-pink-500',
  code: 'from-emerald-500 to-teal-500',
  document: 'from-blue-500 to-indigo-500',
};

function StatCard({
  value,
  label,
  icon,
  color,
  delay,
}: {
  value: string | number;
  label: string;
  icon: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="card-premium p-5"
    >
      <div className="flex items-center gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: `${color}15` }}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {label}
          </p>
        </div>
      </div>
    </motion.div>
  );
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
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [memberActionId, setMemberActionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
          data: { name: editName.trim(), description: editDesc.trim(), isPublic: editIsPublic },
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
      dispatch(suspendMember({ workspaceId: id, memberId })).then(() => setMemberActionId(null));
    }
  };

  const handleReactivateMember = (memberId: string) => {
    if (id) {
      dispatch(reactivateMember({ workspaceId: id, memberId })).then(() => setMemberActionId(null));
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (id) {
      dispatch(removeMember({ workspaceId: id, memberId })).then(() => setMemberActionId(null));
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
          className="h-48 rounded-2xl animate-pulse"
          style={{ background: 'var(--bg-tertiary)' }}
        />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const primaryColor = workspace.color || '#6366f1';
  const memberCount = workspace.members.length + 1;
  const filteredRooms = searchQuery
    ? wsRooms.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : wsRooms;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'rooms', label: 'Rooms', count: wsRooms.length },
    { id: 'members', label: 'Members', count: memberCount },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
      >
        <div className="absolute inset-0 bg-black/10" />
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ background: primaryColor }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-15"
          style={{ background: '#fff' }}
        />

        <div className="relative">
          <button
            onClick={() => navigate('/dashboard/workspaces')}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-all mb-4 inline-flex"
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

          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shrink-0 shadow-xl">
                <span className="text-3xl font-bold">
                  {workspace.icon || workspace.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-black truncate">{workspace.name}</h1>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(toggleFavorite(workspace._id));
                    }}
                    className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill={workspace.isFavorite ? '#facc15' : 'none'}
                      stroke={workspace.isFavorite ? '#facc15' : 'rgba(255,255,255,0.5)'}
                      strokeWidth="2"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                </div>
                {workspace.description && (
                  <p className="text-white/70 text-sm mt-1 truncate max-w-xl">
                    {workspace.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-white/60 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4" />
                    {memberCount} {memberCount === 1 ? 'member' : 'members'}
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1.5">
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
                    {wsRooms.length} {wsRooms.length === 1 ? 'room' : 'rooms'}
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-white/60" />
                    {workspace.isPublic ? 'Public' : 'Private'}
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1.5">
                    <ClockIcon className="w-4 h-4" />
                    Created {new Date(workspace.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0 mt-2 sm:mt-0">
              <button
                onClick={() => setShowInviteInput(true)}
                className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-sm font-semibold transition-all border border-white/20 flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" /> Invite
              </button>
              <button
                onClick={() => {
                  handleCopyInviteCode();
                }}
                className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all border border-white/20"
                title="Copy invite code"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Member avatars */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex -space-x-2">
              <div
                className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: primaryColor }}
              >
                {user?.name?.charAt(0) || 'Y'}
              </div>
              {members.slice(0, 5).map((m, i) => {
                const name =
                  typeof m.userId === 'object' ? (m.userId as { name: string }).name : '?';
                return (
                  <div
                    key={m._id}
                    className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {name.charAt(0).toUpperCase()}
                  </div>
                );
              })}
              {members.length > 5 && (
                <div className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center text-[10px] font-bold bg-white/20 text-white">
                  +{members.length - 5}
                </div>
              )}
            </div>
            <span className="text-xs text-white/50">{memberCount} total</span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
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
            {tab.count !== undefined && (
              <span
                className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: activeTab === tab.id ? `${primaryColor}15` : 'var(--bg-hover)',
                  color: activeTab === tab.id ? primaryColor : 'var(--text-tertiary)',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                value={wsRooms.length}
                label="Total Rooms"
                icon="💬"
                color="#8b5cf6"
                delay={0.05}
              />
              <StatCard value={memberCount} label="Members" icon="👥" color="#3b82f6" delay={0.1} />
              <StatCard
                value={rooms.filter((r) => r.isActive).length}
                label="Active Now"
                icon="🟢"
                color="#10b981"
                delay={0.15}
              />
              <StatCard
                value={activities.length}
                label="Activities"
                icon="📊"
                color="#f59e0b"
                delay={0.2}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Activity Feed */}
              <div className="lg:col-span-2 space-y-4">
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      Recent Activity
                    </h3>
                    <button
                      onClick={() => navigate('/dashboard/activity')}
                      className="text-xs font-semibold flex items-center gap-1"
                      style={{ color: primaryColor }}
                    >
                      View all
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </button>
                  </div>
                  {activities.length === 0 ? (
                    <div className="text-center py-8">
                      <div
                        className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--bg-tertiary)' }}
                      >
                        <FireIcon className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
                      </div>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                        No activity yet
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        Actions in this workspace will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {activities.slice(0, 8).map((act, i) => {
                        const actUser =
                          typeof act.user === 'object' ? (act.user as { name: string }) : null;
                        return (
                          <motion.div
                            key={act._id || i}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-start gap-3 py-2.5 border-b last:border-0"
                            style={{ borderColor: 'var(--border-light)' }}
                          >
                            <div
                              className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                              style={{ background: primaryColor }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs leading-relaxed">
                                <span
                                  className="font-semibold"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  {actUser?.name || 'Someone'}
                                </span>{' '}
                                <span style={{ color: 'var(--text-secondary)' }}>{act.action}</span>
                                {act.entityName && (
                                  <span className="font-semibold" style={{ color: primaryColor }}>
                                    {' '}
                                    {act.entityName}
                                  </span>
                                )}
                              </p>
                              <p
                                className="text-[10px] mt-0.5"
                                style={{ color: 'var(--text-tertiary)' }}
                              >
                                {timeAgo(act.createdAt)}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Quick Actions */}
                <div className="card p-5">
                  <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowCreateRoom(true)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:opacity-80"
                      style={{ background: 'var(--bg-hover)' }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: `${primaryColor}15` }}
                      >
                        <PlusIcon className="w-4 h-4" style={{ color: primaryColor }} />
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
                      onClick={() => setShowInviteInput(true)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:opacity-80"
                      style={{ background: 'var(--bg-hover)' }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(59,130,246,0.1)' }}
                      >
                        <svg
                          className="w-4 h-4"
                          style={{ color: '#3b82f6' }}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                          />
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
                    <button
                      onClick={() => navigate(`/dashboard/rooms/${id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:opacity-80"
                      style={{ background: 'var(--bg-hover)' }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(16,185,129,0.1)' }}
                      >
                        <ChatBubbleLeftIcon className="w-4 h-4" style={{ color: '#10b981' }} />
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          Open Chat
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          Team conversations
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Invite Code */}
                <div className="card p-5">
                  <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Invite Code
                  </h3>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
                    Share this code for instant access.
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 px-3 py-2 rounded-xl border font-mono text-xs tracking-wider truncate"
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
                      className="p-2 rounded-xl transition-all shrink-0"
                      style={{
                        background: copiedCode ? 'rgba(16,185,129,0.1)' : 'var(--bg-hover)',
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

                {/* Workspace Info */}
                <div className="card p-5">
                  <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Info
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-tertiary)' }}>Created</span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {new Date(workspace.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-tertiary)' }}>Visibility</span>
                      <span
                        style={{ color: workspace.isPublic ? '#10b981' : 'var(--text-primary)' }}
                      >
                        {workspace.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-tertiary)' }}>Updated</span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {timeAgo(workspace.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ROOMS TAB */}
        {activeTab === 'rooms' && (
          <motion.div
            key="rooms"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <MagnifyingGlassIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--text-tertiary)' }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-base pl-9 text-sm"
                  placeholder="Search rooms..."
                />
              </div>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="btn-primary flex items-center gap-2 text-sm shrink-0"
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
            ) : filteredRooms.length === 0 ? (
              <div className="card p-12 text-center">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{ background: `${primaryColor}10` }}
                >
                  <svg
                    className="w-8 h-8"
                    style={{ color: primaryColor }}
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
                  {searchQuery ? 'No rooms match your search' : 'No rooms yet'}
                </p>
                <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                  {searchQuery
                    ? 'Try a different search term.'
                    : 'Create a room to start collaborating.'}
                </p>
                {!searchQuery && (
                  <button onClick={() => setShowCreateRoom(true)} className="btn-primary">
                    Create Room
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room, i) => (
                  <motion.div
                    key={room._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="card-hover p-5 cursor-pointer group"
                    onClick={() =>
                      room.type === 'whiteboard'
                        ? navigate(`/whiteboard/${room._id}`)
                        : navigate(`/dashboard/rooms/${room._id}`)
                    }
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${ROOM_GRADIENTS[room.type] || 'from-gray-500 to-gray-600'} flex items-center justify-center shadow-lg`}
                        >
                          <span className="text-lg">{ROOM_EMOJIS[room.type] || '📁'}</span>
                        </div>
                        <div className="min-w-0">
                          <p
                            className="font-semibold text-sm truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {room.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-md font-medium text-white capitalize"
                              style={{
                                background: ROOM_GRADIENTS[room.type] ? primaryColor : '#6b7280',
                              }}
                            >
                              {room.type}
                            </span>
                            {room.isActive && (
                              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{' '}
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
                        className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:bg-red-500/10"
                        style={{ color: '#ef4444' }}
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
                          room.type === 'whiteboard'
                            ? navigate(`/whiteboard/${room._id}`)
                            : navigate(`/dashboard/rooms/${room._id}`);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90"
                        style={{ background: primaryColor }}
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

        {/* MEMBERS TAB */}
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
                {memberCount} total
              </p>
              <button
                onClick={() => setShowInviteInput(!showInviteInput)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <PlusIcon className="w-4 h-4" /> Invite
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
              <div className="card" style={{ borderColor: 'var(--border-color)' }}>
                <div
                  className="p-4 flex items-center gap-3 border-b"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: primaryColor }}
                  >
                    {user?.name?.charAt(0) || 'Y'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {user?.name || 'You'}
                      <span className="text-xs ml-2 font-normal" style={{ color: primaryColor }}>
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
                  const mUser = member.userId;
                  const mName =
                    typeof mUser === 'object' ? (mUser as { name: string }).name : 'Unknown';
                  const mEmail =
                    typeof mUser === 'object' ? (mUser as { email: string }).email : '';
                  return (
                    <div
                      key={member._id}
                      className="p-4 flex items-center gap-3 border-b last:border-0"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ background: AVATAR_COLORS[(i + 1) % AVATAR_COLORS.length] }}
                      >
                        {mName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {mName}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                          {mEmail}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-medium capitalize"
                          style={{
                            background:
                              member.role === 'admin' ? `${primaryColor}15` : 'var(--bg-tertiary)',
                            color: member.role === 'admin' ? primaryColor : 'var(--text-tertiary)',
                          }}
                        >
                          {member.role}
                        </span>
                        {member.status === 'suspended' && (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-medium"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                          >
                            Suspended
                          </span>
                        )}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setMemberActionId(memberActionId === member._id ? null : member._id)
                            }
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
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
                                {member.role !== 'admin' ? (
                                  <button
                                    onClick={() => handleMemberRole(member._id, 'admin')}
                                    className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-hover)] flex items-center gap-2"
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
                                ) : (
                                  <button
                                    onClick={() => handleMemberRole(member._id, 'member')}
                                    className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-hover)] flex items-center gap-2"
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
                                    className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-hover)] flex items-center gap-2"
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
                                    className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-hover)] flex items-center gap-2"
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
                                  className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-hover)] flex items-center gap-2"
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
                                  Remove
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

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="max-w-lg space-y-6"
          >
            <div className="card p-6 space-y-4">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
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
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(workspace.name);
                        setEditDesc(workspace.description);
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
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
                      style={{ background: primaryColor }}
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
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Visibility
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {editIsPublic ? 'Public' : 'Private'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {editIsPublic ? 'Anyone can find and join' : 'Only invited members can access'}
                  </p>
                </div>
                <Toggle checked={editIsPublic} onChange={setEditIsPublic} disabled={!isEditing} />
              </div>
            </div>

            <div className="card p-6 space-y-4">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Invite Code
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Share this code for instant access.
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
                onClick={() => dispatch(regenerateInviteCode(workspace._id))}
                className="text-xs font-medium"
                style={{ color: primaryColor }}
                disabled={wsLoading}
              >
                Regenerate Code
              </button>
            </div>

            <div className="card p-6" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: '#ef4444' }}>
                Danger Zone
              </h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                Permanently delete this workspace and all its rooms.
              </p>
              <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger text-sm">
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
