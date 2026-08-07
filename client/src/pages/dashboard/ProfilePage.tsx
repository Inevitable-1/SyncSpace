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
  ClockIcon,
} from '../../components/Icons';
import { useToast } from '../../components/common/Toast';
import { fetchWorkspaces } from '../../features/workspace/workspaceSlice';
import { fetchRooms } from '../../features/room/roomSlice';
import { fetchMeetings } from '../../features/meeting/meetingSlice';
import { activityService } from '../../services/activityService';
import { fileService } from '../../services/fileService';
import type { RootState, AppDispatch } from '../../store';
import type { Activity, Meeting, UploadedFile, Workspace } from '../../types';

const achievements = [
  { icon: '🚀', title: 'Quick Starter', description: 'Created first workspace', unlocked: true },
  { icon: '🎨', title: 'Creative Mind', description: 'Created 5 whiteboards', unlocked: true },
  { icon: '💬', title: 'Team Player', description: 'Sent 100 messages', unlocked: true },
  { icon: '🏆', title: 'Top Performer', description: 'Completed 50 tasks', unlocked: false },
  { icon: '🌟', title: 'Rising Star', description: 'Earned 1000 XP', unlocked: false },
  { icon: '🔥', title: 'On Fire', description: '7-day streak', unlocked: false },
];

const badges = [
  { icon: '👑', title: 'Admin', color: 'from-yellow-500 to-amber-600' },
  { icon: '🎯', title: 'Precision', color: 'from-blue-500 to-indigo-600' },
  { icon: '⚡', title: 'Speed', color: 'from-purple-500 to-pink-600' },
  { icon: '🔥', title: 'Consistency', color: 'from-orange-500 to-red-600' },
];

const contributionData = Array.from({ length: 52 }, () =>
  Array.from({ length: 7 }, () => Math.floor(Math.random() * 5)),
);

const levels = [
  { level: 1, xp: 0, title: 'Newcomer' },
  { level: 5, xp: 500, title: 'Explorer' },
  { level: 10, xp: 2000, title: 'Contributor' },
  { level: 15, xp: 5000, title: 'Expert' },
  { level: 20, xp: 10000, title: 'Master' },
];

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
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-1 h-5 rounded-full bg-gradient-to-b from-brand-500 to-purple-500 flex-shrink-0" />
        <div className="min-w-0">
          <h2 className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
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
  const [editRole, setEditRole] = useState('Full-Stack Developer');
  const [editBio, setEditBio] = useState(
    'Building real-time collaborative tools with a passion for clean UX and scalable systems.',
  );
  const [profileOverride, setProfileOverride] = useState<{
    name: string;
    email: string;
    role: string;
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

  const currentLevel = 8;
  const currentXP = 1250;
  const nextLevelXP = 2000;
  const streak = 5;

  const displayName = profileOverride?.name || user?.name || 'User';
  const displayEmail = profileOverride?.email || user?.email || '';
  const displayRole = profileOverride?.role || 'Full-Stack Developer';
  const displayBio = profileOverride?.bio;

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

  const upcomingMeetings = [...meetings]
    .filter((m) => m.status === 'scheduled' || m.status === 'ongoing')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 4);

  const recentActivities = activities
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const handleShareProfile = () => {
    navigator.clipboard.writeText(displayEmail || 'mr.manojmanu05@gmail.com');
    showToast('Profile link copied to clipboard!', 'success');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) return;
    setProfileOverride({
      name: editName.trim(),
      email: editEmail.trim(),
      role: editRole.trim() || 'Full-Stack Developer',
      bio: editBio.trim(),
    });
    setShowEdit(false);
    showToast('Profile updated successfully!', 'success');
  };

  return (
    <div className="space-y-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-white/5"
      >
        <div className="h-36 sm:h-44 relative bg-gradient-to-r from-brand-600 via-purple-600 to-pink-600">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.3) 0%, transparent 45%)',
            }}
          />
          <div className="absolute -top-16 left-1/3 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-10 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-4 right-5 flex items-center gap-2">
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
                setEditRole(displayRole);
                setEditBio(displayBio || '');
                setShowEdit(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/20 text-white backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all"
            >
              <PencilIcon className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>
        </div>
        <div className="p-5 sm:p-6 pt-0 relative" style={{ background: 'var(--bg-card)' }}>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 16 }}
              className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-brand-600/40 ring-4 ring-[var(--bg-card)] flex-shrink-0"
            >
              {displayName.charAt(0).toUpperCase()}
            </motion.div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1
                  className="text-2xl sm:text-3xl font-black tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckIcon className="w-3 h-3" /> Verified
                </span>
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {displayEmail}
              </p>
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-brand-600 to-purple-600 text-white">
                  {displayRole}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  Workspace Admin
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  🔥 {streak} day streak
                </span>
              </div>
              {displayBio && (
                <p
                  className="text-sm mt-3 leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {displayBio}
                </p>
              )}
            </div>
          </div>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 items-start">
        <div className="lg:col-span-2 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="rounded-2xl p-4 sm:p-5 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/20 transition-all duration-300"
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
            <div className="space-y-2">
              {workspaces.slice(0, 5).map((ws: Workspace, i: number) => {
                const wsRooms = rooms.filter((r) =>
                  typeof r.workspace === 'object'
                    ? r.workspace._id === ws._id
                    : r.workspace === ws._id,
                ).length;
                const wsMembers = ws.memberCount || ws.members.length + 1;
                const pct = Math.min(100, wsRooms * 25 + wsMembers * 5);
                return (
                  <motion.button
                    key={ws._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    onClick={() => navigate(`/dashboard/workspaces/${ws._id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-brand-500/20 hover:bg-white/[0.03] transition-all text-left group"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md flex-shrink-0"
                      style={{ background: ws.color || '#6366f1' }}
                    >
                      {ws.icon || ws.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {ws.name}
                        </p>
                        <span
                          className="text-[10px] flex-shrink-0"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {wsRooms} room{wsRooms !== 1 ? 's' : ''} · {wsMembers} member
                          {wsMembers !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.3 + i * 0.05, duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500"
                        />
                      </div>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-brand-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all flex-shrink-0" />
                  </motion.button>
                );
              })}
              {workspaces.length === 0 && (
                <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>
                  No projects yet.
                </p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="rounded-2xl p-4 sm:p-5 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/20 transition-all duration-300"
          >
            <SectionTitle
              title="Meetings"
              subtitle="Upcoming and live sessions"
              action={
                <button
                  onClick={() => navigate('/dashboard/meetings')}
                  className="text-xs font-semibold flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors"
                >
                  View all <ArrowRightIcon className="w-3 h-3" />
                </button>
              }
            />
            {upcomingMeetings.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>
                No upcoming meetings scheduled.
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingMeetings.map((m: Meeting) => {
                  const isLive = m.status === 'ongoing';
                  const wsColor = typeof m.workspace === 'object' ? m.workspace.color : '#6366f1';
                  return (
                    <div
                      key={m._id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-brand-500/20 hover:bg-white/[0.03] transition-all"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${wsColor}1a`, color: wsColor }}
                      >
                        <VideoCameraIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className="text-sm font-semibold truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {m.name}
                          </p>
                          {isLive && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                              Live
                            </span>
                          )}
                        </div>
                        <p
                          className="text-[11px] mt-0.5 flex items-center gap-1.5"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          <ClockIcon className="w-3 h-3" />
                          {new Date(m.scheduledAt).toLocaleString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                          <span className="mx-0.5">·</span>
                          {m.duration}m
                        </p>
                      </div>
                      <button
                        onClick={() => navigate('/dashboard/meetings')}
                        className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg text-white transition-all shadow-lg flex-shrink-0 ${
                          isLive
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                            : 'bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500'
                        }`}
                      >
                        {isLive ? 'Join now' : 'Join'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="rounded-2xl p-4 sm:p-5 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/20 transition-all duration-300"
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
                <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>
                  No activity yet.
                </p>
              )}
            </div>
          </motion.div>
        </div>

        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="rounded-2xl p-5 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="font-bold flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Level {currentLevel}
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                {currentXP.toLocaleString()} XP
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(currentXP / nextLevelXP) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500 shadow-lg shadow-brand-500/30"
              />
            </div>
            <div
              className="flex justify-between mt-2 text-xs"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <span>
                {currentXP} / {nextLevelXP} XP
              </span>
              <span>
                {nextLevelXP - currentXP} XP to Level {currentLevel + 1}
              </span>
            </div>
            <div
              className="mt-4 pt-4 border-t space-y-2.5"
              style={{ borderColor: 'var(--border-light)' }}
            >
              {levels.map((lvl) => (
                <div key={lvl.level} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      currentLevel >= lvl.level
                        ? 'bg-gradient-to-br from-brand-500 to-purple-500 text-white'
                        : 'bg-white/5 text-gray-500'
                    }`}
                  >
                    {lvl.level}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {lvl.title}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      {lvl.xp} XP required
                    </p>
                  </div>
                  {currentLevel >= lvl.level && (
                    <CheckIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="rounded-2xl p-5 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/20 transition-all duration-300"
          >
            <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Badges
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {badges.map((badge) => (
                <div
                  key={badge.title}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5"
                >
                  <div
                    className={`w-7 h-7 rounded-lg bg-gradient-to-br ${badge.color} flex items-center justify-center text-sm`}
                  >
                    {badge.icon}
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {badge.title}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="rounded-2xl p-5 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/20 transition-all duration-300"
          >
            <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Achievements
            </h2>
            <div className="space-y-2.5">
              {achievements.map((ach) => (
                <div
                  key={ach.title}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    ach.unlocked
                      ? 'bg-white/5 border-brand-500/20'
                      : 'bg-white/[0.02] border-white/5 opacity-50'
                  }`}
                >
                  <div className="text-xl flex-shrink-0">{ach.icon}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      {ach.title}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      {ach.description}
                    </p>
                  </div>
                  {ach.unlocked && (
                    <CheckIcon className="w-4 h-4 text-emerald-400 ml-auto flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="rounded-2xl p-4 sm:p-5 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/20 transition-all duration-300"
      >
        <SectionTitle title="Contributions" subtitle="Last 12 months of activity" />
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-[3px] min-w-max">
            {contributionData.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((level, di) => (
                  <div
                    key={di}
                    className="w-3 h-3 rounded-[2px]"
                    style={{
                      background:
                        level === 0
                          ? 'var(--bg-tertiary)'
                          : level === 1
                            ? 'rgba(99,102,241,0.2)'
                            : level === 2
                              ? 'rgba(99,102,241,0.4)'
                              : level === 3
                                ? 'rgba(99,102,241,0.7)'
                                : '#6366f1',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 mt-3 text-[10px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span
              key={l}
              className="w-3 h-3 rounded-[2px]"
              style={{
                background:
                  l === 0
                    ? 'var(--bg-tertiary)'
                    : l === 1
                      ? 'rgba(99,102,241,0.2)'
                      : l === 2
                        ? 'rgba(99,102,241,0.4)'
                        : l === 3
                          ? 'rgba(99,102,241,0.7)'
                          : '#6366f1',
              }}
            />
          ))}
          <span>More</span>
        </div>
      </motion.div>

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
                    Role
                  </label>
                  <input
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="input-base"
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
