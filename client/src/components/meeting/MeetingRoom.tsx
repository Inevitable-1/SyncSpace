import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  VideoCameraIcon,
  MicrophoneIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  XIcon,
  LinkIcon,
} from '../Icons';
import { useToast } from '../common/Toast';
import type { Meeting, User } from '../../types';

function getDisplayName(member: User | string): string {
  if (typeof member === 'string') return 'Member';
  return member.name;
}

function getMemberId(member: User | string): string {
  if (typeof member === 'string') return member;
  const m = member as { id?: string; _id?: string };
  return m.id || m._id || '';
}

function getAvatar(member: User | string): string | null {
  if (typeof member === 'string') return null;
  return member.avatar || null;
}

function formatInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function AvatarTile({
  name,
  avatar,
  isHost,
  isSelf,
  speaking,
  muted,
}: {
  name: string;
  avatar: string | null;
  isHost: boolean;
  isSelf: boolean;
  speaking: boolean;
  muted: boolean;
}) {
  const initials = formatInitials(name);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 24, stiffness: 220 }}
      className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center"
    >
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-black text-xl">
          {initials}
        </div>
      )}

      {speaking && (
        <motion.div
          className="absolute inset-0 rounded-2xl ring-4 ring-brand-500/70 pointer-events-none"
          animate={{ boxShadow: ['0 0 0 0 rgba(99,102,241,0.5)', '0 0 0 18px rgba(99,102,241,0)'] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
        />
      )}

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-sm text-white">
          {isSelf ? `${name} (You)` : name}
        </span>
        {isHost && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/90 text-black">
            Host
          </span>
        )}
      </div>

      <div className="absolute bottom-2 right-2 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center">
        {muted ? (
          <MicrophoneIcon className="w-3.5 h-3.5 text-red-400" />
        ) : (
          <span className="text-[9px] text-emerald-400 font-bold">LIVE</span>
        )}
      </div>
    </motion.div>
  );
}

interface MeetingRoomProps {
  meeting: Meeting;
  currentUser: User | null;
  onLeave: () => void;
  onEnd: () => void;
}

export default function MeetingRoom({ meeting, currentUser, onLeave, onEnd }: MeetingRoomProps) {
  const { showToast } = useToast();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const isHost = currentUser !== null && getMemberId(meeting.host) === currentUser.id;

  useEffect(() => {
    const startedAt = new Date(meeting.scheduledAt).getTime();
    const tick = () => {
      if (meeting.status === 'ongoing') {
        setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
      } else {
        setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [meeting.scheduledAt, meeting.status]);

  const memberList = [meeting.host, ...meeting.participants];
  const speakingIdx = isHost ? 1 : 0;

  const formatElapsed = (total: number) => {
    const hours = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return hours > 0 ? `${hours}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(meeting.meetingCode);
    showToast('Meeting code copied', 'success');
  };

  const wsName = typeof meeting.workspace === 'object' ? meeting.workspace.name : 'Workspace';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#030712] flex flex-col"
    >
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <VideoCameraIcon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold truncate">{meeting.name}</h2>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {wsName} · {formatElapsed(elapsed)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            {meeting.meetingCode}
          </button>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {memberList.length} in room
          </span>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4 sm:p-6 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 auto-rows-min gap-4 content-start">
          {memberList.map((member, i) => {
            const name = getDisplayName(member);
            const avatar = getAvatar(member);
            const isSelfMember = currentUser !== null && getMemberId(member) === currentUser.id;
            return (
              <AvatarTile
                key={`${getMemberId(member)}-${i}`}
                name={name}
                avatar={avatar}
                isHost={i === 0}
                isSelf={isSelfMember}
                speaking={i === speakingIdx}
                muted={!micOn && isSelfMember}
              />
            );
          })}
        </div>

        <aside className="space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-bold mb-2">Agenda</h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              {meeting.agenda || 'No agenda set for this meeting.'}
            </p>
            {meeting.description && (
              <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                {meeting.description}
              </p>
            )}
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-bold mb-3">Attendees</h3>
            <div className="space-y-2">
              {memberList.map((member, i) => {
                const name = getDisplayName(member);
                const avatar = getAvatar(member);
                return (
                  <div
                    key={`${getMemberId(member)}-aside-${i}`}
                    className="flex items-center gap-2.5"
                  >
                    {avatar ? (
                      <img src={avatar} alt={name} className="w-7 h-7 rounded-lg object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                        {formatInitials(name)}
                      </div>
                    )}
                    <span className="text-xs font-medium truncate flex-1">{name}</span>
                    {i === 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400">
                        HOST
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-4 bg-gradient-to-br from-brand-600/10 to-purple-600/10 border-brand-500/20">
            <h3 className="text-sm font-bold mb-1.5">Quick tip</h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              This is a demo meeting room. Use the controls below to preview the experience — no
              audio or video is actually transmitted.
            </p>
          </div>
        </aside>
      </div>

      <footer className="flex items-center justify-center gap-3 sm:gap-4 px-4 py-5 border-t border-white/5 bg-white/[0.02]">
        <button
          onClick={() => setMicOn((v) => !v)}
          className={`control-btn ${micOn ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-red-500/20 text-red-400'}`}
          title={micOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          <MicrophoneIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCamOn((v) => !v)}
          className={`control-btn ${camOn ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-red-500/20 text-red-400'}`}
          title={camOn ? 'Turn camera off' : 'Turn camera on'}
        >
          <VideoCameraIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => setScreenSharing((v) => !v)}
          className={`control-btn ${screenSharing ? 'bg-brand-600 text-white' : 'bg-white/10 text-white hover:bg-white/15'}`}
          title={screenSharing ? 'Stop presenting' : 'Share screen'}
        >
          <ShareIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => showToast('Meeting chat is coming in a future update', 'info')}
          className="control-btn bg-white/10 text-white hover:bg-white/15"
          title="Meeting chat"
        >
          <ChatBubbleLeftIcon className="w-5 h-5" />
        </button>

        {isHost && meeting.status === 'ongoing' ? (
          <button
            onClick={onEnd}
            className="ml-3 px-5 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-red-500/25 transition-all"
          >
            <XIcon className="w-4 h-4" /> End for all
          </button>
        ) : (
          <button
            onClick={onLeave}
            className="ml-3 px-5 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-red-500/25 transition-all"
          >
            <PhoneIcon className="w-4 h-4" /> Leave
          </button>
        )}
      </footer>

      <style>{`
        .control-btn {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
      `}</style>
    </motion.div>
  );
}
