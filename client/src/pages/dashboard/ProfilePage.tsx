import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, animate } from 'framer-motion';
import {
  FolderIcon,
  UserGroupIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PencilIcon,
  ShareIcon,
  CheckIcon,
  ArrowRightIcon,
  PaintBrushIcon,
  CodeBracketIcon,
  ClockIcon,
} from '../../components/Icons';
import { useToast } from '../../components/common/Toast';
import { fetchWorkspaces } from '../../features/workspace/workspaceSlice';
import { fetchRooms } from '../../features/room/roomSlice';
import { fetchMeetings } from '../../features/meeting/meetingSlice';
import { activityService } from '../../services/activityService';
import { fileService } from '../../services/fileService';
import type { RootState, AppDispatch } from '../../store';
import type { Activity, UploadedFile, Workspace, User } from '../../types';

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.9,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]);
  return <span>{display.toLocaleString()}</span>;
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

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatMeetingTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function fileTypeIcon(file: UploadedFile, className: string) {
  const mime = file.mimeType || '';
  if (mime.startsWith('image/')) {
    return <PaintBrushIcon className={className} />;
  }
  if (mime.startsWith('audio/') || mime.startsWith('video/')) {
    return <VideoCameraIcon className={className} />;
  }
  if (
    mime.includes('javascript') ||
    mime.includes('typescript') ||
    mime.includes('json') ||
    mime.includes('html') ||
    mime.includes('css') ||
    mime.includes('python') ||
    mime.includes('text')
  ) {
    return <CodeBracketIcon className={className} />;
  }
  return <DocumentTextIcon className={className} />;
}

function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-1 h-4 rounded-full bg-gradient-to-b from-brand-500 to-purple-500 flex-shrink-0" />
        <div className="min-w-0">
          <h2 className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const { rooms } = useSelector((state: RootState) => state.room);
  const { meetings } = useSelector((state: RootState) => state.meeting);
  const { showToast } = useToast();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editBio, setEditBio] = useState('');
  const [profileOverride, setProfileOverride] = useState<{
    name: string;
    email: string;
    bio: string;
  } | null>(null);

  useEffect(() => {
    dispatch(fetchWorkspaces());
    dispatch(fetchRooms(undefined));
    dispatch(fetchMeetings());
    activityService
      .getAll()
      .then(setActivities)
      .catch(() => {});
  }, [dispatch]);

  const loadFiles = useCallback(async () => {
    if (workspaces.length === 0) return;
    try {
      const lists = await Promise.all(
        workspaces.map((w) => fileService.getAll({ workspaceId: w._id })),
      );
      setFiles(lists.flat());
    } catch {
      // ignore demo fallback errors
    }
  }, [workspaces]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const ownsWorkspace = workspaces.some((ws) => {
    const ownerId =
      typeof ws.owner === 'object' && ws.owner !== null ? (ws.owner as User).id : ws.owner;
    return ownerId === user?.id;
  });
  const role = ownsWorkspace ? 'Owner' : 'Member';

  const displayName = profileOverride?.name || user?.name || 'User';
  const displayEmail = profileOverride?.email || user?.email || '';
  const displayBio = profileOverride?.bio || '';

  const hasAnyActivity =
    workspaces.length > 0 ||
    rooms.length > 0 ||
    meetings.length > 0 ||
    files.length > 0 ||
    activities.length > 0;

  const stats = [
    {
      label: 'Workspaces',
      value: workspaces.length,
      icon: FolderIcon,
      gradient: 'from-brand-500 to-purple-600',
    },
    {
      label: 'Rooms',
      value: rooms.length,
      icon: UserGroupIcon,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Meetings',
      value: meetings.length,
      icon: VideoCameraIcon,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Files Shared',
      value: files.length,
      icon: DocumentTextIcon,
      gradient: 'from-cyan-500 to-blue-600',
    },
  ];

  const recentActivities = activities
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const upcomingMeetings = meetings
    .filter((m) => m.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);

  const quickLinks = [
    { label: 'Rooms', icon: <PaintBrushIcon className="w-4 h-4" />, to: '/dashboard/rooms' },
    { label: 'Meetings', icon: <VideoCameraIcon className="w-4 h-4" />, to: '/dashboard/meetings' },
    { label: 'Files', icon: <DocumentTextIcon className="w-4 h-4" />, to: '/dashboard/files' },
  ];

  const handleShareProfile = () => {
    if (!displayEmail) return;
    navigator.clipboard.writeText(displayEmail);
    showToast('Profile link copied to clipboard!', 'success');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) return;
    setProfileOverride({
      name: editName.trim(),
      email: editEmail.trim(),
      bio: editBio.trim(),
    });
    setShowEdit(false);
    showToast('Profile updated successfully!', 'success');
  };

  return (
    <div className="space-y-5 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-white/5"
      >
        <div className="h-24 sm:h-32 relative bg-gradient-to-r from-brand-600 via-purple-600 to-pink-600">
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.35) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.25) 0%, transparent 45%)',
            }}
          />
          <div className="absolute top-3 right-4 flex items-center gap-2">
            <button
              onClick={handleShareProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/20 text-white backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all"
            >
              <ShareIcon className="w-3.5 h-3.5" /> Share
            </button>
            <button
              onClick={() => {
                setEditName(displayName);
                setEditEmail(displayEmail);
                setEditBio(displayBio || '');
                setShowEdit(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/20 text-white backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all"
            >
              <PencilIcon className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>
        </div>
        <div className="p-5 pt-0 relative" style={{ background: 'var(--bg-card)' }}>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 -mt-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 16 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-brand-600/40 ring-4 ring-[var(--bg-card)] flex-shrink-0"
            >
              {displayName.charAt(0).toUpperCase()}
            </motion.div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1
                  className="text-xl sm:text-2xl font-black tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckIcon className="w-3 h-3" /> Verified
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  {role}
                </span>
              </div>
              <p className="text-sm mt-1 truncate" style={{ color: 'var(--text-tertiary)' }}>
                {displayEmail}
              </p>
              {displayBio && (
                <p
                  className="text-sm mt-2 leading-relaxed line-clamp-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {displayBio}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      {!hasAnyActivity ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-10 text-center"
        >
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-600/25">
            <UserGroupIcon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            No activity yet
          </h2>
          <p className="text-sm mt-1.5 max-w-sm mx-auto" style={{ color: 'var(--text-tertiary)' }}>
            Your profile is ready. Create your first workspace to start collaborating.
          </p>
          <button onClick={() => navigate('/dashboard/workspaces')} className="btn-primary mt-6">
            Create Workspace
          </button>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {quickLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(link.to)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                {link.icon} {link.label}
              </button>
            ))}
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="rounded-2xl p-4 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/20 transition-all duration-300"
          >
            <SectionTitle
              title="Projects"
              subtitle={`${workspaces.length} workspace${workspaces.length !== 1 ? 's' : ''} you belong to`}
              action={
                <button
                  onClick={() => navigate('/dashboard/workspaces')}
                  className="text-xs font-semibold flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors"
                >
                  View all <ArrowRightIcon className="w-3 h-3" />
                </button>
              }
            />
            <div className="space-y-1.5">
              {workspaces.slice(0, 5).map((ws: Workspace, i: number) => {
                const wsRooms = rooms.filter((r) =>
                  typeof r.workspace === 'object'
                    ? r.workspace._id === ws._id
                    : r.workspace === ws._id,
                ).length;
                const wsMembers = ws.memberCount || ws.members.length + 1;
                return (
                  <motion.button
                    key={ws._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    onClick={() => navigate(`/dashboard/workspaces/${ws._id}`)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:border-brand-500/20 hover:bg-white/[0.03] transition-all text-left group"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md flex-shrink-0"
                      style={{ background: ws.color || '#6366f1' }}
                    >
                      {ws.icon || ws.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {ws.name}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {wsRooms} room{wsRooms !== 1 ? 's' : ''} · {wsMembers} member
                        {wsMembers !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-brand-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all flex-shrink-0" />
                  </motion.button>
                );
              })}
              {workspaces.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
                  No projects yet.
                </p>
              )}
            </div>
          </motion.div>

          {meetings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="rounded-2xl p-4 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/20 transition-all duration-300"
            >
              <SectionTitle
                title="Meetings"
                subtitle={`${meetings.length} total`}
                action={
                  <button
                    onClick={() => navigate('/dashboard/meetings')}
                    className="text-xs font-semibold flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    View all <ArrowRightIcon className="w-3 h-3" />
                  </button>
                }
              />
              <div className="space-y-1.5">
                {upcomingMeetings.map((m) => {
                  const wsName =
                    typeof m.workspace === 'object' && m.workspace !== null
                      ? m.workspace.name
                      : 'Workspace';
                  return (
                    <button
                      key={m._id}
                      onClick={() => navigate(`/dashboard/meetings/${m._id}`)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:border-brand-500/20 hover:bg-white/[0.03] transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md flex-shrink-0">
                        <VideoCameraIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {m.name}
                        </p>
                        <p
                          className="text-[11px] mt-0.5 flex items-center gap-1.5"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          <ClockIcon className="w-3 h-3 flex-shrink-0" />
                          {formatMeetingTime(m.scheduledAt)} · {m.duration} min · {wsName}
                        </p>
                      </div>
                      <ArrowRightIcon className="w-4 h-4 text-brand-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="rounded-2xl p-4 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/20 transition-all duration-300"
            >
              <SectionTitle
                title="Files"
                subtitle={`${files.length} shared`}
                action={
                  <button
                    onClick={() => navigate('/dashboard/files')}
                    className="text-xs font-semibold flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    View all <ArrowRightIcon className="w-3 h-3" />
                  </button>
                }
              />
              <div className="space-y-1.5">
                {files.slice(0, 6).map((f) => (
                  <div
                    key={f._id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:border-brand-500/20 hover:bg-white/[0.03] transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
                      {fileTypeIcon(f, 'w-5 h-5 text-white')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {f.originalName || f.name}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {formatFileSize(f.size)} · {timeAgo(f.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="rounded-2xl p-4 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/20 transition-all duration-300"
          >
            <SectionTitle
              title="Recent Activity"
              subtitle="Live team updates"
              action={
                <button
                  onClick={() => navigate('/dashboard/activity')}
                  className="text-xs font-semibold flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors"
                >
                  View all <ArrowRightIcon className="w-3 h-3" />
                </button>
              }
            />
            <div className="space-y-1">
              {recentActivities.map((act: Activity) => {
                const userName =
                  typeof act.user === 'object' && act.user !== null
                    ? (act.user as { name: string }).name
                    : 'Someone';
                return (
                  <div
                    key={act._id}
                    className="flex items-start gap-3 p-2.5 rounded-xl transition-colors hover:bg-white/[0.03]"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {userName}
                        </span>{' '}
                        {act.action}
                        {act.entityName && (
                          <span className="font-semibold text-brand-400"> {act.entityName}</span>
                        )}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {timeAgo(act.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {recentActivities.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
                  No activity yet.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowEdit(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <div className="h-1.5 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500" />
              <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-600/25">
                    {editName.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      Edit Profile
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Update your personal information
                    </p>
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Full Name
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
                    Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="input-base"
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Bio
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="input-base resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowEdit(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center gap-2"
                    disabled={!editName.trim() || !editEmail.trim()}
                  >
                    <CheckIcon className="w-4 h-4" /> Save Profile
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
