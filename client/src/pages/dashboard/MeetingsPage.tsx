import { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  VideoCameraIcon,
  ClockIcon,
  CheckIcon,
  ChartBarIcon,
} from '../../components/Icons';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { StatCardSkeleton } from '../../components/common/Skeleton';
import MeetingRoom from '../../components/meeting/MeetingRoom';
import { useToast } from '../../components/common/Toast';
import {
  fetchMeetings,
  fetchMeetingStats,
  createMeeting,
  joinMeeting,
  startMeeting,
  endMeeting,
} from '../../features/meeting/meetingSlice';
import { fetchWorkspaces } from '../../features/workspace/workspaceSlice';
import type { RootState, AppDispatch } from '../../store';
import type { Meeting, MeetingStatus, User } from '../../types';

const STATUS_STYLES: Record<MeetingStatus, { label: string; className: string; dot: string }> = {
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    dot: 'bg-blue-400',
  },
  ongoing: {
    label: 'Live',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  completed: {
    label: 'Completed',
    className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    dot: 'bg-gray-400',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
    dot: 'bg-red-400',
  },
};

function formatDate(date: string): string {
  return new Date(date).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function timeUntil(date: string): string {
  const diff = new Date(date).getTime() - Date.now();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'starting now';
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `in ${hours}h ${mins % 60}m`;
  const days = Math.floor(hours / 24);
  return `in ${days}d`;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

function getMemberName(member: User | string): string {
  return typeof member === 'string' ? 'Member' : member.name;
}

function getMemberId(member: User | string): string {
  if (typeof member === 'string') return member;
  const m = member as { id?: string; _id?: string };
  return m.id || m._id || '';
}

function getMemberAvatar(member: User | string): string | null {
  return typeof member === 'string' ? null : member.avatar || null;
}

function formatInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function ParticipantStack({ members }: { members: (User | string)[] }) {
  const shown = members.slice(0, 4);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((member, i) => {
        const name = getMemberName(member);
        const avatar = getMemberAvatar(member);
        return (
          <div
            key={`${getMemberId(member)}-${i}`}
            className="w-8 h-8 rounded-full ring-2 ring-[var(--bg-secondary)] overflow-hidden -ml-2 first:ml-0 flex items-center justify-center"
          >
            {avatar ? (
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                {formatInitials(name)}
              </div>
            )}
          </div>
        );
      })}
      {extra > 0 && (
        <div className="w-8 h-8 rounded-full -ml-2 ring-2 ring-[var(--bg-secondary)] bg-white/10 flex items-center justify-center text-[10px] font-bold">
          +{extra}
        </div>
      )}
    </div>
  );
}

function StatCard({
  value,
  label,
  icon,
  accent,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5 flex items-center gap-4"
    >
      <div
        className={`w-12 h-12 rounded-xl ${accent} flex items-center justify-center flex-shrink-0`}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
          {value}
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {label}
        </div>
      </div>
    </motion.div>
  );
}

interface MeetingCardProps {
  meeting: Meeting;
  currentUser: User | null;
  index: number;
  joining: boolean;
  onJoin: (m: Meeting) => void;
  onStart: (m: Meeting) => void;
  onEnd: (m: Meeting) => void;
}

function MeetingCard({
  meeting,
  currentUser,
  index,
  joining,
  onJoin,
  onStart,
  onEnd,
}: MeetingCardProps) {
  const style = STATUS_STYLES[meeting.status];
  const wsName = typeof meeting.workspace === 'object' ? meeting.workspace.name : 'Workspace';
  const wsColor = typeof meeting.workspace === 'object' ? meeting.workspace.color : '#6366f1';
  const isHost = currentUser !== null && getMemberId(meeting.host) === currentUser.id;

  const canJoin = meeting.status === 'scheduled' || meeting.status === 'ongoing';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="card-hover p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${wsColor}1a`, color: wsColor }}
        >
          <VideoCameraIcon className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate">{meeting.name}</h3>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.className}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${style.dot} ${meeting.status === 'ongoing' ? 'animate-pulse' : ''}`}
              />
              {style.label}
            </span>
          </div>
          <p
            className="text-xs mt-1 flex items-center gap-2 flex-wrap"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: wsColor }} />
              {wsName}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              {meeting.status === 'completed'
                ? `ended ${timeAgo(meeting.endedAt || meeting.updatedAt)}`
                : formatDate(meeting.scheduledAt)}
            </span>
            {meeting.status === 'scheduled' && (
              <>
                <span>·</span>
                <span className="text-brand-400 font-semibold">
                  {timeUntil(meeting.scheduledAt)}
                </span>
              </>
            )}
            <span>·</span>
            <span>{meeting.duration} min</span>
          </p>
          {meeting.description && (
            <p className="text-xs mt-1.5 line-clamp-1" style={{ color: 'var(--text-tertiary)' }}>
              {meeting.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 sm:gap-3">
          <div className="hidden sm:block">
            <ParticipantStack members={[meeting.host, ...meeting.participants]} />
          </div>

          {canJoin && (
            <button
              onClick={() => onJoin(meeting)}
              disabled={joining}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 text-white hover:from-brand-500 hover:to-purple-500 transition-all shadow-lg shadow-brand-600/20 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {joining ? (
                <>
                  <Spinner size="sm" className="text-white" /> Joining
                </>
              ) : meeting.status === 'ongoing' ? (
                'Join now'
              ) : (
                'Join'
              )}
            </button>
          )}

          {isHost && meeting.status === 'scheduled' && (
            <button
              onClick={() => onStart(meeting)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white transition-all whitespace-nowrap"
            >
              Start
            </button>
          )}

          {isHost && meeting.status === 'ongoing' && (
            <button
              onClick={() => onEnd(meeting)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-500/90 hover:bg-red-500 text-white transition-all whitespace-nowrap"
            >
              End
            </button>
          )}

          {meeting.status === 'completed' && (
            <span className="text-[10px] font-semibold text-gray-500 whitespace-nowrap">
              {meeting.participants.length + 1} attended
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    workspace: string;
    scheduledAt: string;
    duration: number;
    agenda: string;
  }) => void;
  isLoading?: boolean;
}

function ScheduleModal({ isOpen, onClose, onSubmit, isLoading = false }: ScheduleModalProps) {
  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const [name, setName] = useState('');
  const [workspace, setWorkspace] = useState(workspaces[0]?._id || '');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState(30);
  const [description, setDescription] = useState('');
  const [agenda, setAgenda] = useState('');

  useEffect(() => {
    if (isOpen && workspaces.length > 0 && !workspace) {
      setWorkspace(workspaces[0]._id);
    }
  }, [isOpen, workspaces, workspace]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && workspace && scheduledAt) {
      onSubmit({
        name: name.trim(),
        description: description.trim(),
        workspace,
        scheduledAt: new Date(scheduledAt).toISOString(),
        duration,
        agenda: agenda.trim(),
      });
      setName('');
      setDescription('');
      setAgenda('');
    }
  };

  const minDateTime = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <VideoCameraIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Schedule Meeting
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Plan a video session with your team
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            Meeting Title
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-base"
            placeholder="Weekly sync"
            required
            autoFocus
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Workspace
            </label>
            <select
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              className="input-base"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              required
            >
              {workspaces.map((ws) => (
                <option key={ws._id} value={ws._id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Date &amp; Time
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={minDateTime}
              className="input-base"
              required
            />
          </div>
        </div>
        <div>
          <label
            className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            Duration (minutes)
          </label>
          <div className="flex gap-2">
            {[15, 30, 45, 60].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                  duration === d
                    ? 'border-emerald-500 bg-emerald-600/10 text-emerald-500'
                    : 'hover:bg-[var(--bg-hover)]'
                }`}
                style={
                  duration !== d
                    ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
                    : undefined
                }
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label
            className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            Agenda
          </label>
          <input
            type="text"
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            className="input-base"
            placeholder="Review sprint progress"
          />
        </div>
        <div>
          <label
            className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="input-base resize-none"
            placeholder="Optional details"
          />
        </div>
        <div
          className="flex gap-3 justify-end pt-3 border-t"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={!name.trim() || !workspace || !scheduledAt || isLoading}
          >
            {isLoading ? (
              <Spinner size="sm" className="text-white" />
            ) : (
              <CheckIcon className="w-4 h-4" />
            )}
            Schedule Meeting
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function MeetingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const { meetings, stats, isLoading, error } = useSelector((state: RootState) => state.meeting);

  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchMeetings());
    dispatch(fetchMeetingStats());
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  useEffect(() => {
    if (error) showToast(error, 'error');
  }, [error, showToast]);

  const { ongoing, upcoming, previous } = useMemo(() => {
    const sorted = [...meetings].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
    return {
      ongoing: sorted.filter((m) => m.status === 'ongoing'),
      upcoming: sorted.filter((m) => m.status === 'scheduled'),
      previous: sorted
        .filter((m) => m.status === 'completed')
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()),
    };
  }, [meetings]);

  const handleSchedule = (
    data: Parameters<typeof ScheduleModal>[0]['onSubmit'] extends (d: infer T) => void ? T : never,
  ) => {
    setScheduling(true);
    dispatch(createMeeting(data)).then((action) => {
      setScheduling(false);
      if (action.meta.requestStatus === 'fulfilled') {
        showToast('Meeting scheduled!', 'success');
        setShowSchedule(false);
        dispatch(fetchMeetingStats());
      } else {
        showToast((action.payload as string) || 'Failed to schedule meeting', 'error');
      }
    });
  };

  const handleJoin = (meeting: Meeting) => {
    setJoiningId(meeting._id);
    dispatch(joinMeeting(meeting._id)).then((action) => {
      setJoiningId(null);
      if (action.meta.requestStatus === 'fulfilled') {
        setActiveMeeting(action.payload as Meeting);
      } else {
        showToast((action.payload as string) || 'Failed to join meeting', 'error');
      }
    });
  };

  const handleStart = (meeting: Meeting) => {
    dispatch(startMeeting(meeting._id)).then((action) => {
      if (action.meta.requestStatus === 'fulfilled') {
        showToast('Meeting started — you can now join', 'success');
        setActiveMeeting(action.payload as Meeting);
      } else {
        showToast((action.payload as string) || 'Failed to start meeting', 'error');
      }
    });
  };

  const handleEnd = (meeting: Meeting) => {
    dispatch(endMeeting(meeting._id)).then((action) => {
      if (action.meta.requestStatus === 'fulfilled') {
        showToast('Meeting ended', 'info');
        setActiveMeeting(null);
        dispatch(fetchMeetingStats());
      } else {
        showToast((action.payload as string) || 'Failed to end meeting', 'error');
      }
    });
  };

  const renderSection = (
    title: string,
    items: Meeting[],
    emptyTitle: string,
    emptyDesc: string,
  ) => {
    if (items.length === 0) {
      return (
        <EmptyState
          icon={<VideoCameraIcon className="w-9 h-9" />}
          title={emptyTitle}
          description={emptyDesc}
          action={
            title === 'Ongoing' && (
              <button onClick={() => setShowSchedule(true)} className="btn-primary">
                Schedule a meeting
              </button>
            )
          }
        />
      );
    }
    return (
      <div className="space-y-3">
        {items.map((meeting, i) => (
          <MeetingCard
            key={meeting._id}
            meeting={meeting}
            currentUser={user}
            index={i}
            joining={joiningId === meeting._id}
            onJoin={handleJoin}
            onStart={handleStart}
            onEnd={handleEnd}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Meetings
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {stats?.upcoming ?? 0} upcoming · {stats?.ongoing ?? 0} live now
          </p>
        </div>
        <button
          onClick={() => setShowSchedule(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" /> Schedule Meeting
        </button>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats ? (
          <>
            <StatCard
              value={stats.total}
              label="Total meetings"
              icon={<ChartBarIcon className="w-5 h-5 text-brand-500" />}
              accent="bg-brand-500/10"
            />
            <StatCard
              value={stats.upcoming}
              label="Upcoming"
              icon={<ClockIcon className="w-5 h-5 text-blue-500" />}
              accent="bg-blue-500/10"
            />
            <StatCard
              value={stats.ongoing}
              label="Live now"
              icon={<VideoCameraIcon className="w-5 h-5 text-emerald-500" />}
              accent="bg-emerald-500/10"
            />
            <StatCard
              value={stats.completed}
              label="Completed"
              icon={<CheckIcon className="w-5 h-5 text-gray-400" />}
              accent="bg-gray-500/10"
            />
          </>
        ) : (
          <>
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </>
        )}
      </div>

      {isLoading && meetings.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5">
              <div className="h-4 w-48 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-72 bg-white/5 rounded mt-3 animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Ongoing
            </h2>
            {renderSection(
              'Ongoing',
              ongoing,
              'No live meetings',
              'Nothing is live right now. Schedule a meeting or start one from the list below.',
            )}
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" /> Upcoming
            </h2>
            {renderSection(
              'Upcoming',
              upcoming,
              'No upcoming meetings',
              'When you schedule a meeting it will appear here.',
            )}
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400" /> Previous
            </h2>
            {renderSection(
              'Previous',
              previous,
              'No past meetings',
              'Completed meetings will show up here.',
            )}
          </section>
        </div>
      )}

      <ScheduleModal
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
        onSubmit={handleSchedule}
        isLoading={scheduling}
      />

      <AnimatePresence>
        {activeMeeting && (
          <MeetingRoom
            meeting={activeMeeting}
            currentUser={user}
            onLeave={() => setActiveMeeting(null)}
            onEnd={() => handleEnd(activeMeeting)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
