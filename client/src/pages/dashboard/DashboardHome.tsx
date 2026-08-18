import { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, animate } from 'framer-motion';
import {
  FolderIcon,
  ClockIcon,
  VideoCameraIcon,
  UserGroupIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  PaintBrushIcon,
  CheckIcon,
  BellIcon,
  LinkIcon,
  StarIcon,
} from '../../components/Icons';
import { CardSkeleton } from '../../components/common/Skeleton';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import CreateRoomModal from '../../components/common/CreateRoomModal';
import WorkspaceOnboarding from '../../components/workspace/WorkspaceOnboarding';
import InviteModal from '../../components/collaboration/InviteModal';
import { useToast } from '../../components/common/Toast';
import { fetchWorkspaces } from '../../features/workspace/workspaceSlice';
import { fetchRooms, createRoom } from '../../features/room/roomSlice';
import { fetchMeetings, createMeeting } from '../../features/meeting/meetingSlice';
import { fetchNotifications } from '../../features/notification/notificationSlice';
import { activityService } from '../../services/activityService';
import { fileService } from '../../services/fileService';
import { taskService } from '../../services/taskService';
import type { RootState, AppDispatch } from '../../store';
import type { Activity, Task, UploadedFile, Meeting, Room, User } from '../../types';

const ROOM_TYPE_META: Record<string, { icon: React.ReactNode; gradient: string }> = {
  whiteboard: {
    icon: <PaintBrushIcon className="w-5 h-5 text-white" />,
    gradient: 'from-purple-500 to-pink-500',
  },
  code: {
    icon: <CodeBracketIcon className="w-5 h-5 text-white" />,
    gradient: 'from-emerald-500 to-teal-500',
  },
  document: {
    icon: <DocumentTextIcon className="w-5 h-5 text-white" />,
    gradient: 'from-blue-500 to-indigo-500',
  },
};

const PRIORITY_META: Record<string, { label: string; className: string }> = {
  urgent: { label: 'Urgent', className: 'bg-red-500/10 text-red-400' },
  high: { label: 'High', className: 'bg-orange-500/10 text-orange-400' },
  medium: { label: 'Medium', className: 'bg-amber-500/10 text-amber-400' },
  low: { label: 'Low', className: 'bg-blue-500/10 text-blue-400' },
};

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

function formatTime(date: string): string {
  return new Date(date).toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
}

function fileMeta(name: string): { label: string; gradient: string } {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['md', 'txt', 'doc', 'docx', 'pdf', 'xlsx', 'pptx', 'csv', 'yaml'].includes(ext)) {
    return { label: ext.toUpperCase(), gradient: 'from-blue-500 to-indigo-600' };
  }
  if (['js', 'ts', 'tsx', 'jsx', 'css', 'html', 'sql', 'json'].includes(ext)) {
    return { label: 'CODE', gradient: 'from-emerald-500 to-teal-600' };
  }
  if (['png', 'jpg', 'jpeg', 'svg', 'fig', 'gif'].includes(ext)) {
    return { label: 'IMG', gradient: 'from-purple-500 to-pink-600' };
  }
  return { label: 'FILE', gradient: 'from-gray-500 to-slate-600' };
}

function getTaskAssigneeId(task: Task): string {
  if (!task.assignee) return '';
  if (typeof task.assignee === 'object') {
    const a = task.assignee as { id?: string; _id?: string };
    return a.id || a._id || '';
  }
  return task.assignee;
}

function getName(user: User | string | null): string {
  if (!user) return 'Someone';
  return typeof user === 'object' ? user.name : 'Someone';
}

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

function ViewAllLink({ to, label = 'View all' }: { to: string; label?: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="text-xs font-semibold flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors whitespace-nowrap"
    >
      {label} <ArrowRightIcon className="w-3 h-3" />
    </button>
  );
}

interface StatDef {
  label: string;
  value: number;
  icon: React.ElementType;
  trend: string;
  trendUp: boolean;
  iconGradient: string;
  borderGradient: string;
}

function StatCards({ stats }: { stats: StatDef[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.08, duration: 0.45, ease: 'easeOut' }}
          whileHover={{ y: -5 }}
          className="group relative p-px rounded-2xl bg-gradient-to-br transition-all duration-300"
          style={{
            backgroundImage: `linear-gradient(135deg, ${stat.borderGradient})`,
          }}
        >
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60 pointer-events-none" />
          <div
            className="relative rounded-[calc(1rem-1px)] p-4 sm:p-5 backdrop-blur-2xl h-full overflow-hidden"
            style={{ background: 'var(--bg-card)' }}
          >
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-brand-500/10 blur-2xl group-hover:bg-brand-500/20 transition-colors duration-300" />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p
                  className="text-2xl sm:text-3xl font-black tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <AnimatedNumber value={stat.value} />
                </p>
                <p
                  className="text-[11px] sm:text-xs mt-1 truncate"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {stat.label}
                </p>
              </div>
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${stat.iconGradient} flex items-center justify-center shadow-lg flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div
              className="flex items-center gap-1.5 mt-3 pt-3 border-t"
              style={{ borderColor: 'var(--border-light)' }}
            >
              {stat.trendUp ? (
                <ArrowUpIcon className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              ) : (
                <ArrowDownIcon className="w-3 h-3 text-red-400 flex-shrink-0" />
              )}
              <span
                className={`text-[11px] font-semibold ${stat.trendUp ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {stat.trend}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function MeetingTimeline({
  meetings,
  onJoin,
}: {
  meetings: Meeting[];
  onJoin: (m: Meeting) => void;
}) {
  if (meetings.length === 0) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center text-center py-10 px-4 rounded-2xl border border-dashed"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <VideoCameraIcon
          className="w-8 h-8 mb-2 opacity-30"
          style={{ color: 'var(--text-tertiary)' }}
        />
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          No meetings scheduled
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Schedule one from Quick Actions
        </p>
      </div>
    );
  }
  return (
    <div className="relative max-h-[300px] overflow-y-auto scrollbar-thin pr-1 -ml-1 pl-1">
      <div className="absolute left-[13px] top-3 bottom-3 w-px bg-gradient-to-b from-brand-500/60 via-purple-500/30 to-transparent" />
      <div className="space-y-4">
        {meetings.map((m, i) => {
          const wsName = typeof m.workspace === 'object' ? m.workspace.name : 'Workspace';
          const wsColor = typeof m.workspace === 'object' ? m.workspace.color : '#6366f1';
          const isLive = m.status === 'ongoing';
          return (
            <motion.div
              key={m._id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="relative pl-9"
            >
              <span
                className={`absolute left-[7px] top-3 w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${
                  isLive ? 'bg-emerald-400 border-emerald-400 animate-pulse' : 'bg-[var(--bg-card)]'
                }`}
                style={!isLive ? { borderColor: wsColor } : undefined}
              />
              <div className="group flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-white/[0.04] border border-transparent hover:border-white/5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
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
                    className="text-[11px] mt-0.5 truncate"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ background: wsColor }}
                      />
                      {wsName}
                    </span>
                    <span className="mx-1">·</span>
                    {formatTime(m.scheduledAt)}
                    <span className="mx-1">·</span>
                    {m.duration}m
                  </p>
                </div>
                {(m.status === 'scheduled' || isLive) && (
                  <button
                    onClick={() => onJoin(m)}
                    className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 text-white hover:from-brand-500 hover:to-purple-500 transition-all shadow-lg shadow-brand-600/20 flex-shrink-0"
                  >
                    {isLive ? 'Join now' : 'Join'}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const meta = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const isDone = task.status === 'completed';
  const isOverdue = task.dueDate && !isDone && new Date(task.dueDate).getTime() < Date.now();
  return (
    <div className="group flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-white/[0.04] border border-transparent hover:border-white/5">
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
          isDone
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'bg-white/5 text-gray-500 group-hover:bg-brand-500/10 group-hover:text-brand-300'
        }`}
      >
        <CheckIcon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${isDone ? 'line-through opacity-50' : ''}`}
          style={{ color: 'var(--text-primary)' }}
        >
          {task.title}
        </p>
        <p
          className="text-[11px] mt-0.5 flex items-center gap-1.5"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <span className={`px-1.5 py-px rounded text-[9px] font-bold ${meta.className}`}>
            {meta.label}
          </span>
          {task.dueDate && (
            <span className={isOverdue ? 'text-red-400 font-semibold' : ''}>
              {isDone
                ? 'Completed'
                : isOverdue
                  ? `Overdue · ${formatShortDate(task.dueDate)}`
                  : `Due ${formatShortDate(task.dueDate)}`}
            </span>
          )}
        </p>
      </div>
      <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
        {timeAgo(task.updatedAt)}
      </span>
    </div>
  );
}

function FileRow({ file }: { file: UploadedFile }) {
  const meta = fileMeta(file.name);
  return (
    <div className="group flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-white/[0.04] border border-transparent hover:border-white/5">
      <div
        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}
      >
        <DocumentTextIcon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {file.name}
        </p>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
          {file.folder || 'Root'} · {formatFileSize(file.size)}
        </p>
      </div>
      <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
        {timeAgo(file.updatedAt)}
      </span>
    </div>
  );
}

function ActivityFeed({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center text-center py-10 px-4 rounded-2xl border border-dashed"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <BellIcon className="w-8 h-8 mb-2 opacity-30" style={{ color: 'var(--text-tertiary)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          No recent activity
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-1 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
      {activities.slice(0, 8).map((act, i) => {
        const userName = getName(act.user as User | string | null);
        return (
          <motion.div
            key={act._id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-start gap-3 p-2.5 rounded-xl transition-colors hover:bg-white/[0.03]"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
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
          </motion.div>
        );
      })}
    </div>
  );
}

function WidgetCard({
  title,
  subtitle,
  action,
  children,
  delay = 0,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl p-4 sm:p-5 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/20 hover:bg-white/[0.03] transition-all duration-300"
    >
      <SectionTitle title={title} subtitle={subtitle} action={action} />
      {children}
    </motion.div>
  );
}

function TodaysWork({
  meetings,
  tasks,
  files,
  activities,
  onJoinMeeting,
}: {
  meetings: Meeting[];
  tasks: Task[];
  files: UploadedFile[];
  activities: Activity[];
  onJoinMeeting: (m: Meeting) => void;
}) {
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const pending = tasks.filter((t) => t.status !== 'completed');
  const upcoming = pending.find((t) => t.dueDate) || null;
  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const openTasks = pending.length;

  const showHeader = tasks.length > 0;
  if (
    tasks.length === 0 &&
    meetings.length === 0 &&
    files.length === 0 &&
    activities.length === 0
  ) {
    return null;
  }

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.45 }}
        className="rounded-3xl p-5 sm:p-6 relative overflow-hidden border border-white/5 bg-white/[0.02] backdrop-blur-2xl"
      >
        <div className="absolute -top-20 right-0 w-72 h-72 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {showHeader && (
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h1
                className="text-2xl font-black tracking-tight flex items-center gap-2.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Today&apos;s Work
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {dateLabel} · {openTasks} open task{openTasks !== 1 ? 's' : ''}
                {upcoming?.dueDate && (
                  <>
                    {' '}
                    · Next deadline{' '}
                    <span className="font-semibold text-brand-400">
                      {formatShortDate(upcoming.dueDate)}
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                  {pct}%
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  complete
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-600/25">
                <CheckIcon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        )}

        {tasks.length > 0 && (
          <div className="relative mb-6">
            <div
              className="flex items-center justify-between text-[11px] mb-1.5"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <span className="font-semibold">Daily progress</span>
              <span className="font-semibold">
                {completed}/{tasks.length} tasks
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden bg-white/5 border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.1, ease: 'easeOut', delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500 shadow-lg shadow-brand-500/30"
              />
            </div>
          </div>
        )}

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {meetings.length > 0 && (
            <WidgetCard
              title="Upcoming Meetings"
              subtitle="Your schedule today"
              action={<ViewAllLink to="/dashboard/meetings" />}
            >
              <MeetingTimeline meetings={meetings} onJoin={onJoinMeeting} />
            </WidgetCard>
          )}

          {tasks.length > 0 && (
            <WidgetCard
              title="Assigned Tasks"
              subtitle={`${openTasks} pending · ${completed} done`}
              action={<ViewAllLink to="/dashboard/workspaces" label="My tasks" />}
            >
              <div className="max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
                <div className="space-y-1">
                  {tasks.slice(0, 6).map((t) => (
                    <TaskRow key={t._id} task={t} />
                  ))}
                </div>
              </div>
            </WidgetCard>
          )}

          {files.length > 0 && (
            <WidgetCard
              title="Recent Files"
              subtitle="Latest uploads"
              action={<ViewAllLink to="/dashboard/files" />}
            >
              <div className="max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
                <div className="space-y-1">
                  {files.slice(0, 6).map((f) => (
                    <FileRow key={f._id} file={f} />
                  ))}
                </div>
              </div>
            </WidgetCard>
          )}

          {activities.length > 0 && (
            <WidgetCard
              title="Recent Activity"
              subtitle="Live team updates"
              action={<ViewAllLink to="/dashboard/activity" />}
            >
              <ActivityFeed activities={activities} />
            </WidgetCard>
          )}
        </div>
      </motion.div>
    </section>
  );
}

function QuickActions({
  onCreateWorkspace,
  onCreateRoom,
  onCreateMeeting,
  onInviteMember,
  onUploadFile,
}: {
  onCreateWorkspace: () => void;
  onCreateRoom: () => void;
  onCreateMeeting: () => void;
  onInviteMember: () => void;
  onUploadFile: () => void;
}) {
  const actions = [
    {
      label: 'Create Room',
      desc: 'Start a whiteboard, doc or code session',
      icon: <PaintBrushIcon className="w-6 h-6 text-white" />,
      gradient: 'from-purple-500 to-pink-600',
      onClick: onCreateRoom,
    },
    {
      label: 'Create Workspace',
      desc: 'Spin up a space for your team',
      icon: <FolderIcon className="w-6 h-6 text-white" />,
      gradient: 'from-brand-500 to-purple-600',
      onClick: onCreateWorkspace,
    },
    {
      label: 'Create Meeting',
      desc: 'Schedule a video call with your team',
      icon: <VideoCameraIcon className="w-6 h-6 text-white" />,
      gradient: 'from-amber-500 to-orange-600',
      onClick: onCreateMeeting,
    },
    {
      label: 'Invite Member',
      desc: 'Share an invite link with teammates',
      icon: <LinkIcon className="w-6 h-6 text-white" />,
      gradient: 'from-emerald-500 to-teal-600',
      onClick: onInviteMember,
    },
    {
      label: 'Upload File',
      desc: 'Drop a file into your workspace',
      icon: <DocumentTextIcon className="w-6 h-6 text-white" />,
      gradient: 'from-cyan-500 to-blue-600',
      onClick: onUploadFile,
    },
  ];

  return (
    <div className="lg:sticky lg:top-24 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="rounded-3xl p-5 relative overflow-hidden border border-white/5 bg-white/[0.02] backdrop-blur-2xl"
      >
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="font-bold flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Quick Actions
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                {actions.length}
              </span>
            </h2>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="space-y-2.5">
            {actions.map((a, i) => (
              <motion.button
                key={a.label}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                whileHover={{ y: -3, scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                onClick={a.onClick}
                className="group relative w-full flex items-center gap-3.5 p-3.5 rounded-2xl text-left border transition-all duration-300 gradient-border"
                style={{ background: 'var(--bg-card)' }}
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center shadow-lg flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}
                >
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {a.label}
                  </p>
                  <p
                    className="text-[11px] mt-0.5 truncate"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {a.desc}
                  </p>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-brand-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl p-4 border border-white/5 bg-gradient-to-br from-brand-600/10 via-purple-600/5 to-transparent backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <StarIcon className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Pro tip
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              Press ⌘K anywhere to jump between pages.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function WelcomeSection({
  onCreateWorkspace,
  onCreateRoom,
  onCreateMeeting,
  onUploadFile,
}: {
  onCreateWorkspace: () => void;
  onCreateRoom: () => void;
  onCreateMeeting: () => void;
  onUploadFile: () => void;
}) {
  const actions = [
    {
      label: 'Create Workspace',
      desc: 'Spin up a space for your team',
      icon: <FolderIcon className="w-6 h-6 text-white" />,
      gradient: 'from-brand-500 to-purple-600',
      onClick: onCreateWorkspace,
    },
    {
      label: 'Create Room',
      desc: 'Start a whiteboard, doc or code session',
      icon: <PaintBrushIcon className="w-6 h-6 text-white" />,
      gradient: 'from-purple-500 to-pink-600',
      onClick: onCreateRoom,
    },
    {
      label: 'Create Meeting',
      desc: 'Schedule a video call with your team',
      icon: <VideoCameraIcon className="w-6 h-6 text-white" />,
      gradient: 'from-amber-500 to-orange-600',
      onClick: onCreateMeeting,
    },
    {
      label: 'Upload File',
      desc: 'Drop a file into your workspace',
      icon: <DocumentTextIcon className="w-6 h-6 text-white" />,
      gradient: 'from-cyan-500 to-blue-600',
      onClick: onUploadFile,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-2xl px-6 py-14 sm:py-20 text-center"
    >
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="relative w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-xl shadow-brand-600/30"
      >
        <FolderIcon className="w-8 h-8 text-white" />
      </motion.div>

      <h1
        className="relative text-3xl sm:text-4xl font-black tracking-tight mb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        Welcome to SyncSpace
      </h1>
      <p
        className="relative text-sm sm:text-base max-w-md mx-auto mb-10"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Create your first workspace to start collaborating. Your dashboard will grow as you add
        content.
      </p>

      <div className="relative grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
        {actions.map((a, i) => (
          <motion.button
            key={a.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.07, duration: 0.35 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={a.onClick}
            className="group relative p-px rounded-2xl bg-gradient-to-br transition-all duration-300"
            style={{ backgroundImage: `linear-gradient(135deg, ${a.gradient})` }}
          >
            <div
              className="relative rounded-[calc(1rem-1px)] p-5 flex flex-col items-center text-center h-full overflow-hidden"
              style={{ background: 'var(--bg-card)' }}
            >
              <div
                className={`w-12 h-12 mb-3 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center shadow-lg flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}
              >
                {a.icon}
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {a.label}
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {a.desc}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function WorkspaceMiniRow({
  workspace,
}: {
  workspace: {
    _id: string;
    name: string;
    icon?: string;
    color?: string;
    memberCount?: number;
    updatedAt: string;
  };
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/dashboard/workspaces/${workspace._id}`)}
      className="group w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 hover:bg-white/[0.04] text-left"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0"
        style={{ background: workspace.color || '#6366f1' }}
      >
        {workspace.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {workspace.name}
        </p>
        <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          {workspace.memberCount || 0} members
        </p>
      </div>
      <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
        {timeAgo(workspace.updatedAt)}
      </span>
    </button>
  );
}

function RoomRow({ room }: { room: Room }) {
  const navigate = useNavigate();
  const meta = ROOM_TYPE_META[room.type] || ROOM_TYPE_META.document;
  const wsName = typeof room.workspace === 'object' ? room.workspace.name : 'Workspace';
  return (
    <button
      onClick={() =>
        room.type === 'whiteboard'
          ? navigate(`/whiteboard/${room._id}`)
          : navigate(`/dashboard/rooms/${room._id}`)
      }
      className="group w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 hover:bg-white/[0.04] text-left"
    >
      <div
        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}
      >
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {room.name}
          </p>
          {room.isActive && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 flex-shrink-0">
              Live
            </span>
          )}
        </div>
        <p className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>
          {wsName} · {room.type}
        </p>
      </div>
      <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
        {timeAgo(room.updatedAt)}
      </span>
    </button>
  );
}

function MeetingRow({ meeting }: { meeting: Meeting }) {
  const navigate = useNavigate();
  const wsColor = typeof meeting.workspace === 'object' ? meeting.workspace.color : '#6366f1';
  const isLive = meeting.status === 'ongoing';
  return (
    <button
      onClick={() => navigate('/dashboard/meetings')}
      className="group w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 hover:bg-white/[0.04] text-left"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${wsColor}1a`, color: wsColor }}
      >
        <VideoCameraIcon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {meeting.name}
          </p>
          {isLive && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 flex-shrink-0">
              Live
            </span>
          )}
        </div>
        <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          {formatTime(meeting.scheduledAt)}
        </p>
      </div>
      <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
        {meeting.duration}m
      </span>
    </button>
  );
}

function NotificationRow({
  notification,
}: {
  notification: { _id: string; title: string; message: string; isRead: boolean; createdAt: string };
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/dashboard/notifications')}
      className="group w-full flex items-start gap-3 p-2.5 rounded-xl transition-all duration-200 hover:bg-white/[0.04] text-left"
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          notification.isRead ? 'bg-white/5 text-gray-500' : 'bg-brand-500/15 text-brand-300'
        }`}
      >
        <BellIcon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
          )}
        </div>
        <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
          {notification.message}
        </p>
      </div>
      <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
        {timeAgo(notification.createdAt)}
      </span>
    </button>
  );
}

function LowerSections({
  workspaces,
  rooms,
  meetings,
  notifications,
  loading,
}: {
  workspaces: {
    _id: string;
    name: string;
    icon?: string;
    color?: string;
    memberCount?: number;
    updatedAt: string;
  }[];
  rooms: Room[];
  meetings: Meeting[];
  notifications: {
    _id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  }[];
  loading: boolean;
}) {
  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {workspaces.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl p-4 sm:p-5 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/20 transition-all duration-300"
          >
            <SectionTitle
              title="Recent Workspaces"
              action={<ViewAllLink to="/dashboard/workspaces" />}
            />
            <div className="space-y-1">
              {loading
                ? [1, 2, 3].map((i) => <CardSkeleton key={i} />)
                : workspaces
                    .slice(0, 4)
                    .map((ws) => <WorkspaceMiniRow key={ws._id} workspace={ws} />)}
            </div>
          </motion.div>
        )}

        {rooms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="rounded-2xl p-4 sm:p-5 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/20 transition-all duration-300"
          >
            <SectionTitle title="Recent Rooms" action={<ViewAllLink to="/dashboard/rooms" />} />
            <div className="space-y-1">
              {loading
                ? [1, 2, 3].map((i) => <CardSkeleton key={i} />)
                : rooms.slice(0, 4).map((r) => <RoomRow key={r._id} room={r} />)}
            </div>
          </motion.div>
        )}

        {meetings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="rounded-2xl p-4 sm:p-5 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/20 transition-all duration-300"
          >
            <SectionTitle
              title="Recent Meetings"
              action={<ViewAllLink to="/dashboard/meetings" />}
            />
            <div className="space-y-1">
              {meetings.slice(0, 4).map((m) => (
                <MeetingRow key={m._id} meeting={m} />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl p-4 sm:p-5 backdrop-blur-2xl border border-white/5 bg-white/[0.02] hover:border-brand-500/20 transition-all duration-300"
        >
          <SectionTitle
            title="Recent Notifications"
            subtitle="Latest updates across your workspace"
            action={<ViewAllLink to="/dashboard/notifications" />}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
            {notifications.slice(0, 6).map((n) => (
              <NotificationRow key={n._id} notification={n} />
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}

interface ScheduleMeetingModalProps {
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

function ScheduleMeetingModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: ScheduleMeetingModalProps) {
  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const [name, setName] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState(30);

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
        description: '',
        workspace,
        scheduledAt: new Date(scheduledAt).toISOString(),
        duration,
        agenda: '',
      });
      setName('');
      setScheduledAt('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
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
              min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)}
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
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
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

export default function DashboardHome() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    workspaces,
    isLoading: wsLoading,
    error: wsError,
  } = useSelector((state: RootState) => state.workspace);
  const { rooms } = useSelector((state: RootState) => state.room);
  const { meetings, isLoading: meetingLoading } = useSelector((state: RootState) => state.meeting);
  const { notifications } = useSelector((state: RootState) => state.notification);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCreateWsModal, setShowCreateWsModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchWorkspaces());
    dispatch(fetchRooms(undefined));
    dispatch(fetchMeetings());
    dispatch(fetchNotifications(20));
    activityService
      .getAll()
      .then(setActivities)
      .catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (wsError) showToast(wsError, 'error');
  }, [wsError, showToast]);

  const loadWorkspaceData = useCallback(async () => {
    if (workspaces.length === 0) return;
    const [f, t] = await Promise.all([
      Promise.all(workspaces.map((w) => fileService.getAll({ workspaceId: w._id }))).then((l) =>
        l.flat(),
      ),
      Promise.all(workspaces.map((w) => taskService.getTasksByWorkspace(w._id))).then((l) =>
        l.flat(),
      ),
    ]);
    setFiles(f);
    setTasks(t);
  }, [workspaces]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  const handleWizardCreated = (workspaceId: string) => {
    setShowCreateWsModal(false);
    dispatch(fetchWorkspaces());
    navigate(`/dashboard/workspaces/${workspaceId}`);
  };

  const handleCreateRoom = useCallback(
    (data: { name: string; type: string; workspaceId: string }) => {
      dispatch(createRoom(data)).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          showToast('Room created!', 'success');
          setShowCreateRoomModal(false);
          const roomId = (action.payload as { _id: string })?._id;
          if (roomId && data.type === 'whiteboard') navigate(`/whiteboard/${roomId}`);
          else if (roomId) navigate(`/dashboard/rooms/${roomId}`);
        } else {
          showToast((action.payload as string) || 'Failed to create', 'error');
        }
      });
    },
    [dispatch, showToast, navigate],
  );

  const handleScheduleMeeting = (data: {
    name: string;
    description: string;
    workspace: string;
    scheduledAt: string;
    duration: number;
    agenda: string;
  }) => {
    setScheduling(true);
    dispatch(createMeeting(data)).then((action) => {
      setScheduling(false);
      if (action.meta.requestStatus === 'fulfilled') {
        showToast('Meeting scheduled!', 'success');
        setShowScheduleModal(false);
        dispatch(fetchMeetings());
      } else {
        showToast((action.payload as string) || 'Failed to schedule meeting', 'error');
      }
    });
  };

  const handleJoinMeeting = () => {
    navigate('/dashboard/meetings');
  };

  const handleUploadFile = async (file: File) => {
    if (workspaces.length === 0) {
      showToast('Create a workspace first', 'error');
      return;
    }
    try {
      await fileService.upload(file, { workspaceId: workspaces[0]._id, folder: 'Documentation' });
      showToast('File uploaded!', 'success');
      loadWorkspaceData();
    } catch {
      showToast('Upload failed', 'error');
    }
  };

  const activeRooms = rooms.filter((r) => r.isActive).length;
  const liveMeetings = meetings.filter((m) => m.status === 'ongoing').length;
  const myTasks = tasks.filter((t) => getTaskAssigneeId(t) === user?.id);
  const todaysTasks = myTasks.length > 0 ? myTasks : tasks;

  const stats: StatDef[] = [
    {
      label: 'Total Workspaces',
      value: workspaces.length,
      icon: FolderIcon,
      trend: workspaces.length > 0 ? `${workspaces.length} total` : 'none yet',
      trendUp: workspaces.length > 0,
      iconGradient: 'from-brand-500 to-purple-600',
      borderGradient: 'from-brand-500/60 via-purple-500/40 to-pink-500/50',
    },
    {
      label: 'Total Rooms',
      value: rooms.length,
      icon: ClockIcon,
      trend: activeRooms > 0 ? `${activeRooms} active now` : 'none active',
      trendUp: activeRooms > 0,
      iconGradient: 'from-emerald-500 to-teal-600',
      borderGradient: 'from-emerald-500/60 via-teal-500/40 to-cyan-500/50',
    },
    {
      label: 'Total Meetings',
      value: meetings.length,
      icon: VideoCameraIcon,
      trend:
        liveMeetings > 0
          ? `${liveMeetings} live now`
          : meetings.length > 0
            ? `${meetings.length} total`
            : 'none scheduled',
      trendUp: liveMeetings > 0,
      iconGradient: 'from-amber-500 to-orange-600',
      borderGradient: 'from-amber-500/60 via-orange-500/40 to-rose-500/50',
    },
    {
      label: 'Total Files',
      value: files.length,
      icon: DocumentTextIcon,
      trend: 'shared across your workspaces',
      trendUp: true,
      iconGradient: 'from-blue-500 to-indigo-600',
      borderGradient: 'from-blue-500/60 via-indigo-500/40 to-violet-500/50',
    },
    {
      label: 'My Tasks',
      value: myTasks.length,
      icon: CheckIcon,
      trend: `${todaysTasks.filter((t) => t.status === 'completed').length} done`,
      trendUp: true,
      iconGradient: 'from-pink-500 to-rose-600',
      borderGradient: 'from-pink-500/60 via-rose-500/40 to-red-500/50',
    },
    {
      label: 'Recent Activity',
      value: activities.length,
      icon: BellIcon,
      trend: activities.length > 0 ? `${activities.slice(0, 8).length} shown` : 'nothing yet',
      trendUp: activities.length > 0,
      iconGradient: 'from-cyan-500 to-blue-600',
      borderGradient: 'from-cyan-500/60 via-blue-500/40 to-indigo-500/50',
    },
  ];

  const recentWorkspaces = [...workspaces]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);
  const recentRooms = [...rooms]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);
  const recentFiles = [...files]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);
  const upcomingMeetings = [...meetings]
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .filter((m) => m.status === 'scheduled' || m.status === 'ongoing')
    .slice(0, 4);
  const recentMeetings = [...meetings]
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 4);

  const loading = wsLoading || meetingLoading;

  const hasAnyData =
    workspaces.length > 0 ||
    rooms.length > 0 ||
    meetings.length > 0 ||
    files.length > 0 ||
    tasks.length > 0 ||
    activities.length > 0;

  const emptyDashboard = !loading && !hasAnyData;
  const visibleStats = stats.filter((s) => s.value > 0);

  return (
    <div className="space-y-6 pb-16">
      {emptyDashboard ? (
        <WelcomeSection
          onCreateWorkspace={() => setShowCreateWsModal(true)}
          onCreateRoom={() => setShowCreateRoomModal(true)}
          onCreateMeeting={() => setShowScheduleModal(true)}
          onUploadFile={() => navigate('/dashboard/files')}
        />
      ) : (
        <>
          {visibleStats.length > 0 && <StatCards stats={visibleStats} />}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 lg:gap-6 items-start">
            <div className="lg:col-span-3">
              <TodaysWork
                meetings={upcomingMeetings}
                tasks={todaysTasks}
                files={recentFiles}
                activities={activities}
                onJoinMeeting={handleJoinMeeting}
              />
            </div>
            <div className="lg:col-span-1">
              <QuickActions
                onCreateWorkspace={() => setShowCreateWsModal(true)}
                onCreateRoom={() => setShowCreateRoomModal(true)}
                onCreateMeeting={() => setShowScheduleModal(true)}
                onInviteMember={() => setShowInviteModal(true)}
                onUploadFile={() => fileInputRef.current?.click()}
              />
            </div>
          </div>

          <LowerSections
            workspaces={recentWorkspaces}
            rooms={recentRooms}
            meetings={recentMeetings}
            notifications={notifications}
            loading={loading}
          />
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadFile(file);
          e.target.value = '';
        }}
      />

      <WorkspaceOnboarding
        isOpen={showCreateWsModal}
        onClose={() => setShowCreateWsModal(false)}
        onCreated={handleWizardCreated}
      />

      {showCreateRoomModal && (
        <CreateRoomModal
          isOpen={showCreateRoomModal}
          onClose={() => setShowCreateRoomModal(false)}
          onSubmit={handleCreateRoom}
          isLoading={wsLoading}
        />
      )}

      <ScheduleMeetingModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSubmit={handleScheduleMeeting}
        isLoading={scheduling}
      />

      {showInviteModal && rooms[0] && (
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          inviteCode={rooms[0].inviteCode}
          roomName={rooms[0].name}
        />
      )}

      <AnimatePresence>
        {showInviteModal && !rooms[0] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowInviteModal(false)}
            />
            <div className="relative card p-6 max-w-sm w-full text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-brand-600/10 flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-brand-400" />
              </div>
              <p className="font-semibold mb-1">No rooms yet</p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                Create a room first to share an invite link.
              </p>
              <button onClick={() => setShowInviteModal(false)} className="btn-secondary">
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
