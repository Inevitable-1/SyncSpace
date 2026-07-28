import { useState, useRef, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { createWorkspace } from '../../features/workspace/workspaceSlice';
import { createInvite } from '../../features/collaboration/inviteSlice';
import { fireConfetti } from '../../utils/confetti';
import type { AppDispatch } from '../../store';

const WORKSPACE_TYPES = [
  { id: 'software', label: 'Software Development', icon: '🛠️' },
  { id: 'meeting', label: 'Meeting Collaboration', icon: '📋' },
  { id: 'startup', label: 'Startup', icon: '🚀' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'research', label: 'Research', icon: '🔬' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'design', label: 'Design', icon: '🎨' },
  { id: 'marketing', label: 'Marketing', icon: '📣' },
];

const TIPS = [
  'Invite teammates later from Settings',
  'Everything can be changed after creation',
  'Workspace starts private by default',
];

function generateInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function FloatingParticle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        background: 'rgba(255,255,255,0.08)',
        filter: 'blur(1px)',
      }}
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: '-20%', opacity: [0, 0.6, 0.6, 0] }}
      transition={{ duration: 8 + Math.random() * 6, delay, repeat: Infinity, ease: 'linear' }}
    />
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (workspaceId: string) => void;
}

export default function CreateWorkspaceWizard({ isOpen, onClose, onCreated }: Props) {
  const dispatch = useDispatch<AppDispatch>();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setSelectedType('');
      setInviteEmails([]);
      setEmailInput('');
      setIsCreating(false);
      setShowSuccess(false);
    }
  }, [isOpen]);

  const initials = useMemo(() => generateInitials(name), [name]);
  const workspaceType = WORKSPACE_TYPES.find((t) => t.id === selectedType);
  const canCreate = name.trim().length > 0;

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        delay: i * 0.6,
        x: 8 + Math.random() * 84,
        size: 3 + Math.random() * 5,
      })),
    [],
  );

  const addEmail = () => {
    const email = emailInput.trim();
    if (email && email.includes('@') && !inviteEmails.includes(email)) {
      setInviteEmails((prev) => [...prev, email]);
      setEmailInput('');
    }
  };

  const removeEmail = (email: string) => {
    setInviteEmails((prev) => prev.filter((e) => e !== email));
  };

  const handleCreate = async () => {
    if (!canCreate || isCreating) return;
    setIsCreating(true);
    const action = await dispatch(
      createWorkspace({
        name: name.trim(),
        description: description.trim() || workspaceType?.label || '',
        isPublic: false,
      }),
    );
    if (action.meta.requestStatus === 'fulfilled') {
      const ws = action.payload as { _id: string };
      for (const email of inviteEmails) {
        dispatch(createInvite({ workspaceId: ws._id, email, role: 'member' }));
      }
      setShowSuccess(true);
      fireConfetti();
      setTimeout(() => onCreated(ws._id), 2600);
    }
    setIsCreating(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 24 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[1200px] overflow-hidden rounded-3xl border flex flex-col lg:flex-row"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.35), 0 0 60px rgba(99,102,241,0.08)',
          maxHeight: 'min(92vh, 720px)',
        }}
      >
        {/* Top glow line */}
        <div
          className="absolute top-0 left-0 right-0 h-px z-10"
          style={{ background: 'var(--accent-gradient)' }}
        />

        {/* ============================================ */}
        {/* LEFT PANEL - Live Preview                    */}
        {/* ============================================ */}
        <div
          className="relative w-full lg:w-[42%] overflow-hidden flex flex-col"
          style={{
            background:
              'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 50%, transparent 100%)',
          }}
        >
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
              <FloatingParticle key={p.id} delay={p.delay} x={p.x} size={p.size} />
            ))}
          </div>

          {/* Animated gradient orbs */}
          <div
            className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4), transparent)' }}
          />
          <div
            className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full opacity-15 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4), transparent)' }}
          />

          <div className="relative z-10 flex-1 flex flex-col p-6 sm:p-8 overflow-y-auto">
            {/* Header */}
            <div className="mb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}
              >
                🚀
              </motion.div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Create your workspace
              </h2>
              <p
                className="text-sm mt-1.5 leading-relaxed"
                style={{ color: 'var(--text-tertiary)' }}
              >
                This workspace will become your team&apos;s collaboration hub.
              </p>
            </div>

            {/* Divider */}
            <div className="h-px w-full mb-6" style={{ background: 'var(--border-light)' }} />

            {/* Live Preview Card */}
            <div
              className="rounded-2xl border p-5 mb-5"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-4"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Preview
              </p>

              {/* Workspace avatar + name */}
              <div className="flex items-center gap-3.5 mb-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={initials || 'empty'}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{
                      background: initials
                        ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                        : 'var(--bg-tertiary)',
                      boxShadow: initials ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
                    }}
                  >
                    {initials || (
                      <svg
                        className="w-5 h-5 opacity-30"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                        />
                      </svg>
                    )}
                  </motion.div>
                </AnimatePresence>
                <div className="min-w-0">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={name || 'placeholder-name'}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-sm font-semibold truncate"
                      style={{ color: name ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                    >
                      {name.trim() || 'Workspace Name'}
                    </motion.p>
                  </AnimatePresence>
                  <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    Workspace
                  </p>
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-3">
                {/* Description */}
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Description
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={description || 'placeholder-desc'}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs leading-relaxed"
                      style={{
                        color: description ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                      }}
                    >
                      {description.trim() || 'No description yet'}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <div className="h-px" style={{ background: 'var(--border-light)' }} />

                {/* Type */}
                <div className="flex items-center justify-between">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Type
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={selectedType || 'none'}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="text-xs font-medium flex items-center gap-1.5"
                      style={{
                        color: selectedType ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      }}
                    >
                      {workspaceType?.icon && <span>{workspaceType.icon}</span>}
                      {workspaceType?.label || 'Not selected'}
                    </motion.span>
                  </AnimatePresence>
                </div>

                <div className="h-px" style={{ background: 'var(--border-light)' }} />

                {/* Members */}
                <div className="flex items-center justify-between">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Members
                  </p>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {inviteEmails.length > 0
                      ? `${inviteEmails.length + 1} (you + ${inviteEmails.length})`
                      : '1 (just you)'}
                  </span>
                </div>

                <div className="h-px" style={{ background: 'var(--border-light)' }} />

                {/* Status */}
                <div className="flex items-center justify-between">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Status
                  </p>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: canCreate ? 'rgba(16,185,129,0.1)' : 'var(--bg-tertiary)',
                      color: canCreate ? '#10b981' : 'var(--text-tertiary)',
                    }}
                  >
                    {canCreate ? 'Ready' : 'Incomplete'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="space-y-2.5">
              {TIPS.map((tip, i) => (
                <motion.div
                  key={tip}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-2.5"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(16,185,129,0.1)' }}
                  >
                    <svg
                      className="w-3 h-3"
                      style={{ color: '#10b981' }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {tip}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* RIGHT PANEL - Form                           */}
        {/* ============================================ */}
        <div className="w-full lg:w-[58%] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {showSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
                      boxShadow: '0 0 40px rgba(99,102,241,0.2)',
                    }}
                  >
                    ✨
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl font-bold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Your workspace is ready
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="text-sm"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Setting up your digital team headquarters...
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 w-48 h-1 rounded-full overflow-hidden"
                    style={{ background: 'var(--bg-tertiary)' }}
                  >
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2.2, ease: 'easeInOut' }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7)' }}
                    />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  {/* Workspace Name */}
                  <div>
                    <label
                      className="block text-xs font-semibold mb-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Workspace Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 outline-none focus:ring-2"
                      style={{
                        background: 'var(--bg-secondary)',
                        borderColor: name ? 'rgba(99,102,241,0.4)' : 'var(--border-color)',
                        color: 'var(--text-primary)',
                        boxShadow: name ? '0 0 16px rgba(99,102,241,0.08)' : 'none',
                        ['--tw-ring-color' as string]: 'rgba(99,102,241,0.2)',
                      }}
                      placeholder="Enter workspace name..."
                      maxLength={40}
                    />
                    {name && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[11px] mt-1.5 text-right"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {name.length}/40
                      </motion.p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      className="block text-xs font-semibold mb-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200 outline-none resize-none focus:ring-2"
                      style={{
                        background: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                        ['--tw-ring-color' as string]: 'rgba(99,102,241,0.2)',
                      }}
                      placeholder="What is this workspace for?"
                      rows={3}
                      maxLength={200}
                    />
                    {description && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[11px] mt-1.5 text-right"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {description.length}/200
                      </motion.p>
                    )}
                  </div>

                  {/* Workspace Type */}
                  <div>
                    <label
                      className="block text-xs font-semibold mb-2.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Workspace Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {WORKSPACE_TYPES.map((type, i) => (
                        <motion.button
                          key={type.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => setSelectedType(type.id === selectedType ? '' : type.id)}
                          className="flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200"
                          style={{
                            borderColor:
                              selectedType === type.id
                                ? 'rgba(99,102,241,0.5)'
                                : 'var(--border-color)',
                            background:
                              selectedType === type.id
                                ? 'rgba(99,102,241,0.06)'
                                : 'var(--bg-secondary)',
                            boxShadow:
                              selectedType === type.id ? '0 0 16px rgba(99,102,241,0.08)' : 'none',
                          }}
                        >
                          <span className="text-base">{type.icon}</span>
                          <span
                            className="text-xs font-medium"
                            style={{
                              color: selectedType === type.id ? '#6366f1' : 'var(--text-secondary)',
                            }}
                          >
                            {type.label}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Invite Team */}
                  <div>
                    <label
                      className="block text-xs font-semibold mb-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Invite Teammates
                      <span
                        className="font-normal ml-1.5"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        (optional)
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addEmail();
                          }
                        }}
                        className="flex-1 px-4 py-2.5 rounded-xl border text-sm transition-all duration-200 outline-none focus:ring-2"
                        style={{
                          background: 'var(--bg-secondary)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)',
                          ['--tw-ring-color' as string]: 'rgba(99,102,241,0.2)',
                        }}
                        placeholder="teammate@email.com"
                      />
                      <button
                        onClick={addEmail}
                        disabled={!emailInput.trim() || !emailInput.includes('@')}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-30"
                        style={{ background: '#6366f1' }}
                      >
                        Add
                      </button>
                    </div>

                    {inviteEmails.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {inviteEmails.map((email) => (
                          <motion.div
                            key={email}
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                            style={{
                              background: 'rgba(99,102,241,0.06)',
                              borderColor: 'rgba(99,102,241,0.2)',
                            }}
                          >
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                              style={{ background: '#6366f1' }}
                            >
                              {email[0].toUpperCase()}
                            </div>
                            <span
                              className="text-xs font-medium"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {email}
                            </span>
                            <button
                              onClick={() => removeEmail(email)}
                              className="text-[10px] opacity-40 hover:opacity-100 transition-opacity ml-0.5"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              ✕
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ============================================ */}
          {/* FOOTER                                       */}
          {/* ============================================ */}
          {!showSuccess && (
            <div
              className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t shrink-0"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <motion.button
                whileHover={canCreate ? { scale: 1.02 } : undefined}
                whileTap={canCreate ? { scale: 0.98 } : undefined}
                onClick={handleCreate}
                disabled={!canCreate || isCreating}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                style={{
                  background: canCreate
                    ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                    : 'var(--bg-tertiary)',
                  boxShadow: canCreate ? '0 4px 20px rgba(99,102,241,0.3)' : 'none',
                }}
              >
                {isCreating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Create Workspace'
                )}
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
