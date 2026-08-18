import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence, animate } from 'framer-motion';
import {
  FolderIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PencilIcon,
  CheckIcon,
  PaintBrushIcon,
} from '../../components/Icons';
import { useToast } from '../../components/common/Toast';
import { fetchWorkspaces } from '../../features/workspace/workspaceSlice';
import { fetchRooms } from '../../features/room/roomSlice';
import { fetchMeetings } from '../../features/meeting/meetingSlice';
import { setUser } from '../../features/auth/authSlice';
import { profileService } from '../../services/profileService';
import type { ContributionScore, HeatmapData } from '../../services/profileService';
import type { RootState, AppDispatch } from '../../store';
import type { User } from '../../types';

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

function ContributionHeatmap({ data }: { data: HeatmapData | null }) {
  const weeks = useMemo(() => {
    if (!data) return [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364 - dayOfWeek);
    const dateMap = new Map<string, number>();
    data.heatmap.forEach((d) => dateMap.set(d.date, d.count));
    const allWeeks: Array<Array<{ date: Date; count: number; dateStr: string }>> = [];
    let currentWeek: Array<{ date: Date; count: number; dateStr: string }> = [];
    for (let i = 0; i < 371; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      currentWeek.push({ date: d, count: dateMap.get(dateStr) || 0, dateStr });
      if (currentWeek.length === 7) {
        allWeeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) allWeeks.push(currentWeek);
    return allWeeks;
  }, [data]);

  const getIntensity = (count: number): string => {
    if (count === 0) return 'bg-white/5';
    if (count <= 2) return 'bg-brand-500/20';
    if (count <= 5) return 'bg-brand-500/40';
    if (count <= 10) return 'bg-brand-500/60';
    return 'bg-brand-500';
  };

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="rounded-2xl p-4 backdrop-blur-2xl border border-white/5 bg-white/[0.02]"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Contribution Activity
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {data?.totalContributions || 0} contributions in the last year
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 text-[10px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-white/5" />
          <div className="w-2.5 h-2.5 rounded-sm bg-brand-500/20" />
          <div className="w-2.5 h-2.5 rounded-sm bg-brand-500/40" />
          <div className="w-2.5 h-2.5 rounded-sm bg-brand-500/60" />
          <div className="w-2.5 h-2.5 rounded-sm bg-brand-500" />
          <span>More</span>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-thin pb-2">
        <div className="min-w-[720px]">
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`w-3 h-3 rounded-sm ${getIntensity(day.count)} hover:ring-1 hover:ring-brand-400/50 transition-all cursor-pointer group relative`}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-surface-800 text-[9px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                      {day.count} contributions on{' '}
                      {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex mt-2 gap-[3px]" style={{ marginLeft: '2px' }}>
            {months.map((m, i) => (
              <div
                key={i}
                className="text-[9px] w-3 text-center"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {i % 2 === 0 ? m : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const { showToast } = useToast();

  const [contributions, setContributions] = useState<ContributionScore | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState('');
  const [profileOverride, setProfileOverride] = useState<{
    name: string;
    email: string;
    bio: string;
    coverImage: string;
  } | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(() => {
    dispatch(fetchWorkspaces());
    dispatch(fetchRooms(undefined));
    dispatch(fetchMeetings());
    profileService
      .getContributionScore()
      .then(setContributions)
      .catch(() => {});
    profileService
      .getHeatmapData()
      .then(setHeatmapData)
      .catch(() => {});
  }, [dispatch]);

  const displayName = profileOverride?.name || user?.name || 'User';
  const displayEmail = profileOverride?.email || user?.email || '';
  const displayBio = profileOverride?.bio || '';
  const displayCover = profileOverride?.coverImage || '';

  const ownsWorkspace = workspaces.some((ws) => {
    const ownerId =
      typeof ws.owner === 'object' && ws.owner !== null ? (ws.owner as User).id : ws.owner;
    return ownerId === user?.id;
  });
  const role = ownsWorkspace ? 'Owner' : 'Member';

  const stats = [
    {
      label: 'Workspaces',
      value: workspaces.length,
      icon: FolderIcon,
      gradient: 'from-brand-500 to-brand-700',
    },
    {
      label: 'Files Uploaded',
      value: contributions?.breakdown.filesUploaded || 0,
      icon: DocumentTextIcon,
      gradient: 'from-secondary-500 to-secondary-700',
    },
    {
      label: 'Meetings Hosted',
      value: contributions?.breakdown.meetingsCreated || 0,
      icon: VideoCameraIcon,
      gradient: 'from-accent-500 to-accent-700',
    },
    {
      label: 'Contribution Score',
      value: contributions?.score || 0,
      icon: PaintBrushIcon,
      gradient: 'from-success-500 to-success-700',
    },
  ];

  const achievements = useMemo(
    () => [
      {
        label: 'First Workspace',
        icon: '🏗️',
        earned: (contributions?.breakdown.workspacesCreated || 0) >= 1,
      },
      {
        label: 'First File Upload',
        icon: '📤',
        earned: (contributions?.breakdown.filesUploaded || 0) >= 1,
      },
      {
        label: 'First Meeting',
        icon: '🎥',
        earned: (contributions?.breakdown.meetingsCreated || 0) >= 1,
      },
      {
        label: 'Team Creator',
        icon: '👥',
        earned: (contributions?.breakdown.invitesSent || 0) >= 5,
      },
      {
        label: 'Active Contributor',
        icon: '⭐',
        earned: (contributions?.breakdown.totalActivities || 0) >= 20,
      },
    ],
    [contributions],
  );

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const url = await profileService.uploadAvatar(file);
      await profileService.updateProfile({ avatar: url });
      dispatch(setUser({ ...user!, avatar: url } as any));
      showToast('Avatar updated!', 'success');
    } catch {
      showToast('Failed to upload avatar', 'error');
    }
    setAvatarUploading(false);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const url = await profileService.uploadCover(file);
      await profileService.updateProfile({ coverImage: url });
      setProfileOverride((prev) => (prev ? { ...prev, coverImage: url } : prev));
      showToast('Cover image updated!', 'success');
    } catch {
      showToast('Failed to upload cover', 'error');
    }
    setCoverUploading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    try {
      const profile = await profileService.updateProfile({
        name: editName.trim(),
        bio: editBio.trim(),
      });
      setProfileOverride({
        name: profile.name,
        email: profile.email,
        bio: profile.bio,
        coverImage: profile.coverImage,
      });
      dispatch(setUser(profile as any));
      setShowEdit(false);
      showToast('Profile updated successfully!', 'success');
    } catch {
      showToast('Failed to update profile', 'error');
    }
  };

  return (
    <div className="space-y-5 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-white/5"
      >
        <div className="h-28 sm:h-36 relative overflow-hidden">
          {displayCover ? (
            <img src={displayCover} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-brand-600 via-secondary-600 to-accent-500" />
          )}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.35) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.25) 0%, transparent 45%)',
            }}
          />
          <div className="absolute top-3 right-4">
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/20 text-white backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all cursor-pointer">
              {coverUploading ? (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <PencilIcon className="w-3.5 h-3.5" />
              )}
              Change Cover
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </label>
          </div>
        </div>
        <div className="p-5 pt-0 relative" style={{ background: 'var(--bg-card)' }}>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 -mt-10">
            <label className="relative group cursor-pointer">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 16 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-secondary-600 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-brand-600/40 ring-4 ring-[var(--bg-card)] flex-shrink-0 overflow-hidden"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </motion.div>
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {avatarUploading ? (
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <PencilIcon className="w-5 h-5 text-white" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </label>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1
                  className="text-xl sm:text-2xl font-black tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-500/15 text-success-400 border border-success-500/30">
                  <CheckIcon className="w-3 h-3" /> Verified
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-brand-600 to-secondary-600 text-white">
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
            <button
              onClick={() => {
                setEditName(displayName);
                setEditBio(displayBio || '');
                setShowEdit(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
            >
              <PencilIcon className="w-3.5 h-3.5" /> Edit Profile
            </button>
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

      <ContributionHeatmap data={heatmapData} />

      {achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-2xl p-4 backdrop-blur-2xl border border-white/5 bg-white/[0.02]"
        >
          <p className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Achievements
          </p>
          <div className="flex flex-wrap gap-2">
            {achievements.map((a) => (
              <div
                key={a.label}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${a.earned ? 'border-brand-500/30 bg-brand-500/10 text-brand-300' : 'border-white/5 bg-white/[0.02] text-gray-500 opacity-50'}`}
              >
                <span className="text-lg">{a.icon}</span>
                <span className="text-xs font-semibold">{a.label}</span>
                {a.earned && <CheckIcon className="w-3.5 h-3.5 text-brand-400" />}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {contributions && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="rounded-2xl p-4 backdrop-blur-2xl border border-white/5 bg-white/[0.02]"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Contribution Score
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                Level {contributions.level} · {contributions.score} points
              </p>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-secondary-500 transition-all duration-500"
              style={{ width: `${contributions.progress}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Workspaces', value: contributions.breakdown.workspacesCreated },
              { label: 'Rooms', value: contributions.breakdown.roomsCreated },
              { label: 'Files', value: contributions.breakdown.filesUploaded },
              { label: 'Tasks', value: contributions.breakdown.tasksCreated },
            ].map((item) => (
              <div key={item.label} className="p-2 rounded-lg bg-white/[0.03]">
                <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  {item.value}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
          {contributions.badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {contributions.badges.map((badge) => (
                <span
                  key={badge}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/15 text-brand-400 border border-brand-500/20"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </motion.div>
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
              <div className="h-1.5 bg-gradient-to-r from-brand-500 via-secondary-500 to-accent-500" />
              <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    Edit Profile
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Update your personal information
                  </p>
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
                    value={displayEmail}
                    className="input-base opacity-60"
                    readOnly
                  />
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Email cannot be changed.
                  </p>
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
                    disabled={!editName.trim()}
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
