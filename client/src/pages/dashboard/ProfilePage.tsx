import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, animate } from 'framer-motion';
import {
  FolderIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PencilIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserGroupIcon,
} from '../../components/Icons';
import { useToast } from '../../components/common/Toast';
import { fetchWorkspaces } from '../../features/workspace/workspaceSlice';
import { fetchRooms } from '../../features/room/roomSlice';
import { fetchMeetings } from '../../features/meeting/meetingSlice';
import { setUser } from '../../features/auth/authSlice';
import { profileService } from '../../services/profileService';
import type { ContributionScore, MonthlyCalendar } from '../../services/profileService';
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

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ContributionCalendar({
  calendar,
  month,
  year,
  onPrev,
  onNext,
  total,
}: {
  calendar: MonthlyCalendar | null;
  month: number;
  year: number;
  onPrev: () => void;
  onNext: () => void;
  total: number;
}) {
  const days = useMemo(() => {
    if (!calendar) return [];
    const dateMap = new Map<string, number>();
    calendar.calendar.forEach((d) => dateMap.set(d.date, d.count));
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: Array<{ day: number; count: number; dateStr: string; empty: boolean }> = [];
    for (let i = 0; i < firstDay; i++) {
      result.push({ day: 0, count: 0, dateStr: '', empty: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = new Date(year, month, d).toISOString().split('T')[0];
      result.push({ day: d, count: dateMap.get(dateStr) || 0, dateStr, empty: false });
    }
    return result;
  }, [calendar, month, year]);

  const getIntensity = (count: number): string => {
    if (count === 0) return 'rgba(255,255,255,0.04)';
    if (count <= 2) return 'rgba(0,229,255,0.2)';
    if (count <= 5) return 'rgba(0,229,255,0.4)';
    if (count <= 10) return 'rgba(0,229,255,0.6)';
    return 'rgba(0,229,255,0.9)';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="rounded-2xl p-5 backdrop-blur-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)]"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold" style={{ color: '#00E5FF' }}>
            Contribution Calendar
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {total} activities this month
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <span
            className="text-sm font-semibold min-w-[140px] text-center"
            style={{ color: 'rgba(255,255,255,0.9)' }}
          >
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={onNext}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-semibold py-1"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => (
          <div
            key={i}
            className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-medium transition-all ${d.empty ? '' : 'cursor-pointer hover:ring-1 hover:ring-[#00E5FF]/50'}`}
            style={{
              background: d.empty ? 'transparent' : getIntensity(d.count),
              color: d.empty
                ? 'transparent'
                : d.count > 0
                  ? 'rgba(255,255,255,0.9)'
                  : 'rgba(255,255,255,0.3)',
            }}
            title={d.empty ? undefined : `${d.count} activities on ${MONTH_NAMES[month]} ${d.day}`}
          >
            {d.empty ? '' : d.day}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Less
        </span>
        {[0, 2, 5, 10].map((c) => (
          <div key={c} className="w-3 h-3 rounded-sm" style={{ background: getIntensity(c) }} />
        ))}
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          More
        </span>
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
  const [calendar, setCalendar] = useState<MonthlyCalendar | null>(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
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
  }, [dispatch]);

  const loadCalendar = useCallback((month: number, year: number) => {
    profileService
      .getMonthlyCalendar(month, year)
      .then(setCalendar)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadCalendar(calMonth, calYear);
  }, [calMonth, calYear, loadCalendar]);

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

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
      value: contributions?.breakdown.workspacesCreated || 0,
      icon: FolderIcon,
      gradient: 'from-[#00E5FF] to-[#0088cc]',
    },
    {
      label: 'Rooms',
      value: contributions?.breakdown.roomsCreated || 0,
      icon: UserGroupIcon,
      gradient: 'from-[#7C3AED] to-[#5B21B6]',
    },
    {
      label: 'Files Uploaded',
      value: contributions?.breakdown.filesUploaded || 0,
      icon: DocumentTextIcon,
      gradient: 'from-[#14F195] to-[#059669]',
    },
    {
      label: 'Meetings Hosted',
      value: contributions?.breakdown.meetingsCreated || 0,
      icon: VideoCameraIcon,
      gradient: 'from-[#00E5FF] to-[#7C3AED]',
    },
  ];

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
      {/* Cover + Avatar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-white/[0.08]"
        style={{ background: '#08111f' }}
      >
        <div className="h-28 sm:h-36 relative overflow-hidden">
          {displayCover ? (
            <img src={displayCover} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#00E5FF] via-[#7C3AED] to-[#14F195]" />
          )}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 30%, rgba(0,229,255,0.35) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(124,58,237,0.25) 0%, transparent 45%)',
            }}
          />
          <div className="absolute top-3 right-4">
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/30 text-white backdrop-blur-sm border border-white/20 hover:bg-black/50 transition-all cursor-pointer">
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
        <div className="p-5 pt-0 relative" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 -mt-10">
            <label className="relative group cursor-pointer">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 16 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00E5FF] to-[#7C3AED] flex items-center justify-center text-white text-2xl font-black shadow-xl ring-4 ring-[#08111f] flex-shrink-0 overflow-hidden"
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
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/30">
                  <CheckIcon className="w-3 h-3" /> Verified
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] text-white">
                  {role}
                </span>
              </div>
              <p className="text-sm mt-1 truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {displayEmail}
              </p>
              {displayBio && (
                <p
                  className="text-sm mt-2 leading-relaxed line-clamp-2"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            whileHover={{ y: -3 }}
            className="rounded-2xl p-4 backdrop-blur-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] hover:border-[#00E5FF]/25 transition-all duration-300"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-black text-white">
                  <AnimatedNumber value={stat.value} />
                </p>
                <p
                  className="text-[11px] mt-0.5 truncate"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
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

      {/* Monthly Calendar */}
      <ContributionCalendar
        calendar={calendar}
        month={calMonth}
        year={calYear}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
        total={calendar?.totalActivities || 0}
      />

      {/* Contribution Score */}
      {contributions && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="rounded-2xl p-5 backdrop-blur-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)]"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold" style={{ color: '#00E5FF' }}>
                Contribution Score
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Level {contributions.level} · {contributions.score} points
              </p>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] transition-all duration-500"
              style={{ width: `${contributions.progress}%` }}
            />
          </div>
          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              { label: 'Workspaces', value: contributions.breakdown.workspacesCreated, points: 10 },
              { label: 'Rooms', value: contributions.breakdown.roomsCreated, points: 5 },
              { label: 'Files', value: contributions.breakdown.filesUploaded, points: 2 },
              { label: 'Meetings', value: contributions.breakdown.meetingsCreated, points: 5 },
              { label: 'Shares', value: contributions.breakdown.invitesSent, points: 3 },
            ].map((item) => (
              <div key={item.label} className="p-2 rounded-lg bg-white/[0.03]">
                <p className="text-base font-bold text-white">{item.value}</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {item.label}
                </p>
                <p className="text-[9px] mt-0.5" style={{ color: '#00E5FF' }}>
                  +{item.points}pts
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Edit Profile Modal */}
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
                  <CheckIcon className="w-4 h-4" /> Save Profile
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
