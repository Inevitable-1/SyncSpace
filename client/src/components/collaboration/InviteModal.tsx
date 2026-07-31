import { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '../common/Modal';
import { useToast } from '../common/Toast';
import { roomService } from '../../services/roomService';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
  roomName: string;
}

export default function InviteModal({ isOpen, onClose, inviteCode, roomName }: InviteModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'link' | 'code'>('link');
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const inviteLink = `${window.location.origin}/dashboard/rooms/join?code=${inviteCode}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      showToast('Please enter an invite code', 'error');
      return;
    }
    setIsJoining(true);
    try {
      await roomService.join(joinCode.trim());
      showToast('Successfully joined the room!', 'success');
      setJoinCode('');
      onClose();
    } catch {
      showToast('Invalid invite code', 'error');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Invite to ${roomName}`}>
      <div className="space-y-4">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'link'
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Share Link
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'code'
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Join by Code
          </button>
        </div>

        {activeTab === 'link' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Share this link with others to invite them to this room.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 rounded-lg text-xs border outline-none"
                style={{
                  background: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                onClick={() => copyToClipboard(inviteLink)}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-brand-600 to-purple-600 text-white hover:from-brand-500 hover:to-purple-500 transition-colors flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>

            <div
              className="p-3 rounded-lg border border-[var(--border-color)]"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Invite Code
              </p>
              <div className="flex items-center gap-2">
                <code
                  className="text-sm font-mono font-bold tracking-wider"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {inviteCode}
                </code>
                <button
                  onClick={() => copyToClipboard(inviteCode)}
                  className="p-1 rounded hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'code' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Enter an invite code to join a room.
            </p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter invite code"
              className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
              style={{
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoin();
              }}
            />
            <button
              onClick={handleJoin}
              disabled={!joinCode.trim() || isJoining}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-brand-600 to-purple-600 text-white hover:from-brand-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isJoining ? 'Joining...' : 'Join Room'}
            </button>
          </motion.div>
        )}
      </div>
    </Modal>
  );
}
