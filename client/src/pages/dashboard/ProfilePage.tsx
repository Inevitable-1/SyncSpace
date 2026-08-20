import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, animate } from 'framer-motion';
import {
  FolderIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PencilIcon,
  CheckIcon,
  UserGroupIcon,
  StarIcon,
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

function persistUser(user: User) {
  try {
    const stored = localStorage.getItem('auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.state) {
        parsed.state.user = user;
        localStorage.setItem('auth', JSON.stringify(parsed));
      }
    }
  } catch {
    // ignore
  }
}

function ContributionHeatmap({ heatmap }: { heatmap: HeatmapData }) {
  const [tooltip, setTooltip] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);

    const startDay = startDate.getDay();
    const adjustedStart = new Date(startDate);
    adjustedStart.setDate(adjustedStart.getDate() - startDay);

    const dateMap = new Map<string, number>();
    heatmap.heatmap.forEach((d) => dateMap.set(d.date, d.count));

    const weeks: { date: Date; count: number; dateStr: string }[][] = [];
    let currentWeek: { date: Date; count: number; dateStr: string }[] = [];
    const current = new Date(adjustedStart);
    const monthLabels: { label: string; index: number }[] = [];
    let lastMonth = -1;

    while (current <= today) {
      const dateStr = current.toISOString().split('T')[0];
      const count = dateMap.get(dateStr) || 0;
      currentWeek.push({ date: new Date(current), count, dateStr });

      if (current.getMonth() !== lastMonth) {
        monthLabels.push({
          label: current.toLocaleDateString('en', { month: 'short' }),
          index: weeks.length,
        });
        lastMonth = current.getMonth();
      }

      if (current.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      current.setDate(current.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return { weeks, monthLabels };
  }, [heatmap]);

  const maxCount = useMemo(() => Math.max(1, ...heatmap.heatmap.map((d) => d.count)), [heatmap]);

  const getIntensity = useCallback(
    (count: number) => {
      if (count === 0) return 0;
      const ratio = count / maxCount;
      if (ratio < 0.25) return 1;
      if (ratio < 0.5) return 2;
      if (ratio < 0.75) return 3;
      return 4;
    },
    [maxCount],
  );

  const intensityColors = [
    'bg-white/[0.04]',
    'bg-emerald-900/60',
    'bg-emerald-700/70',
    'bg-emerald-500/80',
    'bg-emerald-400',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="rounded-2xl p-4 sm:p-5 backdrop-blur-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)]"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,229,255,0.15)' }}
          >
            <svg
              className="w-4 h-4"
              style={{ color: '#00E5FF' }}
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm-.5 3.5a.5.5 0 011 0v3h3a.5.5 0 010 1h-3.5v3a.5.5 0 01-1 0v-3H4a.5.5 0 010-1h3v-3z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-white">
              {heatmap.totalContributions} contributions in the last year
            </p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Activity heatmap
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Less
          </span>
          {intensityColors.map((c, i) => (
            <span key={i} className={`w-2.5 h-2.5 rounded-sm ${c} border border-white/[0.06]`} />
          ))}
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            More
          </span>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <div className="inline-flex flex-col gap-0.5 min-w-full">
          <div className="flex gap-0.5 ml-8">
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="text-[9px] shrink-0"
                style={{
                  color: 'rgba(255,255,255,0.4)',
                  marginLeft: i === 0 ? `${m.index * 13}px` : undefined,
                }}
              >
                {m.label}
              </span>
            ))}
          </div>
          <div className="flex gap-0.5">
            <div className="flex flex-col gap-0.5 mr-1.5 justify-between py-0">
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                <span
                  key={i}
                  className="text-[8px] h-[11px] leading-[11px]"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  {d}
                </span>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day) => (
                  <div
                    key={day.dateStr}
                    className={`w-[11px] h-[11px] rounded-[2px] border border-white/[0.06] cursor-pointer transition-all hover:scale-150 hover:border-white/30 hover:z-10 relative ${intensityColors[getIntensity(day.count)]}`}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({
                        date: day.date.toLocaleDateString('en', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }),
                        count: day.count,
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed z-[100] px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-white bg-[#0a1628] border border-white/15 shadow-xl pointer-events-none whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
        >
          {tooltip.count} contribution{tooltip.count !== 1 ? 's' : ''} on {tooltip.date}
        </div>
      )}

      {heatmap.recentActions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          <p className="text-[10px] font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Recent activity
          </p>
          <div className="flex flex-wrap gap-1.5">
            {heatmap.recentActions.map((a, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-white/[0.06] text-white/60 border border-white/[0.06]"
              >
                {a.action}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const { showToast } = useToast();

  const [contributions, setContributions] = useState<ContributionScore | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

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
      .then(setHeatmap)
      .catch(() => {});
  }, [dispatch]);

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '';
  const displayBio = user?.bio || '';
  const displayAvatar = avatarPreview || user?.avatar || '';
  const displayCover = coverPreview || user?.coverImage || '';

  const ownsWorkspace = workspaces.some((ws) => {
    const ownerId =
      typeof ws.owner === 'object' && ws.owner !== null ? (ws.owner as User).id : ws.owner;
    return ownerId === user?.id;
  });
  const role = ownsWorkspace ? 'Owner' : 'Member';

  const stats = useMemo(
    () => [
      {
        label: 'Workspaces',
        value: contributions?.breakdown.workspacesCreated || 0,
        icon: FolderIcon,
        color: '#00E5FF',
      },
      {
        label: 'Rooms',
        value: contributions?.breakdown.roomsCreated || 0,
        icon: UserGroupIcon,
        color: '#7C3AED',
      },
      {
        label: 'Files',
        value: contributions?.breakdown.filesUploaded || 0,
        icon: DocumentTextIcon,
        color: '#14F195',
      },
      {
        label: 'Meetings',
        value: contributions?.breakdown.meetingsCreated || 0,
        icon: VideoCameraIcon,
        color: '#00E5FF',
      },
    ],
    [contributions],
  );

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const localPreview = URL.createObjectURL(file);
      setAvatarPreview(localPreview);
      const url = await profileService.uploadAvatar(file);
      const updated: User = { ...user!, avatar: url };
      dispatch(setUser(updated));
      persistUser(updated);
      showToast('Avatar updated!', 'success');
    } catch {
      setAvatarPreview(null);
      showToast('Failed to upload avatar', 'error');
    }
    setAvatarUploading(false);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const localPreview = URL.createObjectURL(file);
      setCoverPreview(localPreview);
      const url = await profileService.uploadCover(file);
      const updated: User = { ...user!, coverImage: url };
      dispatch(setUser(updated));
      persistUser(updated);
      showToast('Cover image updated!', 'success');
    } catch {
      setCoverPreview(null);
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
      const updated = { ...user!, ...profile } as User;
      dispatch(setUser(updated));
      persistUser(updated);
      setShowEdit(false);
      showToast('Profile updated!', 'success');
    } catch {
      showToast('Failed to update profile', 'error');
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Cover + Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl border border-white/[0.08] overflow-hidden"
        style={{ background: '#08111f' }}
      >
        {/* Cover */}
        <div className="h-44 sm:h-52 relative overflow-hidden">
          {displayCover ? (
            <img src={displayCover} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#00E5FF] via-[#7C3AED] to-[#14F195]" />
          )}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 30%, rgba(0,229,255,0.35) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(124,58,237,0.25) 0%, transparent 45%)',
            }}
          />
          <div className="absolute top-3 right-4">
            <label className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-black/30 text-white backdrop-blur-sm border border-white/20 hover:bg-black/50 transition-all cursor-pointer">
              {coverUploading ? (
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <PencilIcon className="w-3 h-3" />
              )}
              Cover
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </label>
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-4 sm:px-6 pb-5 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 -mt-12 sm:-mt-14">
            {/* Avatar */}
            <label className="relative group cursor-pointer flex-shrink-0 self-center sm:self-auto">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 16 }}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-[#00E5FF] to-[#7C3AED] flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-xl ring-4 ring-[#08111f] overflow-hidden"
              >
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
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

            {/* Name + Info */}
            <div className="flex-1 min-w-0 pb-1 text-center sm:text-left">
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate">
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-px rounded-full text-[9px] font-bold bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/30">
                  <CheckIcon className="w-2.5 h-2.5" /> Verified
                </span>
                <span className="px-2 py-px rounded-md text-[10px] font-semibold bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] text-white">
                  {role}
                </span>
              </div>
              <p
                className="text-xs sm:text-sm truncate mt-0.5"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                {displayEmail}
              </p>
              {displayBio && (
                <p
                  className="text-xs sm:text-sm mt-0.5 line-clamp-1"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  {displayBio}
                </p>
              )}
            </div>

            {/* Edit button */}
            <button
              onClick={() => {
                setEditName(displayName);
                setEditBio(displayBio || '');
                setShowEdit(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/10 text-white border border-white/15 hover:bg-white/15 transition-all flex-shrink-0 self-center sm:self-auto"
            >
              <PencilIcon className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats + Contribution Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            whileHover={{ y: -2 }}
            className="rounded-xl p-3 backdrop-blur-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] hover:border-[#00E5FF]/20 transition-all duration-200"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-lg font-black text-white">
                  <AnimatedNumber value={stat.value} />
                </p>
                <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {stat.label}
                </p>
              </div>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${stat.color}20` }}
              >
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
            </div>
          </motion.div>
        ))}

        {/* Contribution Score Card */}
        {contributions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            whileHover={{ y: -2 }}
            className="rounded-xl p-3 backdrop-blur-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] hover:border-[#00E5FF]/20 transition-all duration-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0,229,255,0.15)' }}
              >
                <StarIcon className="w-4 h-4" style={{ color: '#00E5FF' }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold" style={{ color: '#00E5FF' }}>
                  Score: {contributions.score}
                </p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Level {contributions.level}
                </p>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] transition-all duration-500"
                style={{ width: `${contributions.progress}%` }}
              />
            </div>
            <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {contributions.nextLevelAt - contributions.score} pts to next level
            </p>
          </motion.div>
        )}
      </div>

      {/* Contribution Heatmap */}
      {heatmap && heatmap.heatmap.length > 0 && <ContributionHeatmap heatmap={heatmap} />}

      {/* Edit Profile Modal */}
      {showEdit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEdit(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
            style={{ background: '#0a1628', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <div className="h-1.5 bg-gradient-to-r from-[#00E5FF] via-[#7C3AED] to-[#14F195]" />
            <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">Edit Profile</h2>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Update your personal information
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-white">Full Name</label>
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
                <label className="block text-sm font-medium mb-1.5 text-white">Email</label>
                <input
                  type="email"
                  value={displayEmail}
                  className="input-base opacity-60"
                  readOnly
                />
                <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Email cannot be changed.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-white">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="input-base resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowEdit(false)} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={!editName.trim()}
                >
                  <CheckIcon className="w-4 h-4" /> Save
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
