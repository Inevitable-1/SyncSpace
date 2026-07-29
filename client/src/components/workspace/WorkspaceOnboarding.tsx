import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { createWorkspace } from '../../features/workspace/workspaceSlice';
import { createInvite } from '../../features/collaboration/inviteSlice';
import { fireConfetti } from '../../utils/confetti';
import type { AppDispatch } from '../../store';

const THEMES = [
  {
    id: 'indigo',
    label: 'Indigo',
    gradient: 'from-indigo-500 to-purple-600',
    primary: '#6366f1',
    secondary: '#a855f7',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    gradient: 'from-emerald-500 to-teal-500',
    primary: '#10b981',
    secondary: '#14b8a6',
  },
  {
    id: 'rose',
    label: 'Rose',
    gradient: 'from-rose-500 to-pink-600',
    primary: '#f43f5e',
    secondary: '#ec4899',
  },
  {
    id: 'amber',
    label: 'Amber',
    gradient: 'from-amber-500 to-orange-600',
    primary: '#f59e0b',
    secondary: '#f97316',
  },
  {
    id: 'sky',
    label: 'Sky',
    gradient: 'from-sky-500 to-blue-600',
    primary: '#0ea5e9',
    secondary: '#3b82f6',
  },
  {
    id: 'violet',
    label: 'Violet',
    gradient: 'from-violet-500 to-fuchsia-600',
    primary: '#8b5cf6',
    secondary: '#d946ef',
  },
];

const PURPOSES = [
  {
    id: 'software',
    label: 'Software Development',
    description: 'Code, review, and ship together',
    icon: 'code-bracket',
  },
  {
    id: 'design',
    label: 'Design & Creative',
    description: 'Brainstorm, prototype, and create',
    icon: 'paint-brush',
  },
  {
    id: 'business',
    label: 'Business & Ops',
    description: 'Manage projects and workflows',
    icon: 'chart-bar',
  },
  {
    id: 'education',
    label: 'Education',
    description: 'Teach, learn, and collaborate',
    icon: 'academic-cap',
  },
  {
    id: 'research',
    label: 'Research',
    description: 'Explore, analyze, and discover',
    icon: 'magnifying-glass',
  },
  { id: 'personal', label: 'Personal', description: 'Organize your own projects', icon: 'user' },
];

const FEATURE_CARDS = [
  { emoji: '🎨', title: 'Real-time Whiteboard', desc: 'Visual collaboration with infinite canvas' },
  { emoji: '💻', title: 'Live Code Editor', desc: 'Collaborative coding with syntax highlighting' },
  { emoji: '📝', title: 'Smart Documents', desc: 'Real-time document collaboration' },
];

function generateInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'WS';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (workspaceId: string) => void;
}

export default function WorkspaceOnboarding({ isOpen, onClose, onCreated }: Props) {
  const dispatch = useDispatch<AppDispatch>();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [themeId, setThemeId] = useState('indigo');
  const [purposeId, setPurposeId] = useState('');
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [emailSuggestions] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setName('');
      setDescription('');
      setThemeId('indigo');
      setPurposeId('');
      setInviteEmails([]);
      setEmailInput('');
      setIsCreating(false);
      setShowSuccess(false);
      setTimeout(() => nameInputRef.current?.focus(), 400);
    }
  }, [isOpen]);

  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const purpose = PURPOSES.find((p) => p.id === purposeId);
  const initials = useMemo(() => generateInitials(name), [name]);
  const canContinue = useMemo(() => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return true;
    if (step === 2) return !!purposeId;
    if (step === 3) return true;
    return true;
  }, [step, name, purposeId]);

  const addEmail = useCallback(() => {
    const email = emailInput.trim().toLowerCase();
    if (email && email.includes('@') && email.includes('.') && !inviteEmails.includes(email)) {
      setInviteEmails((prev) => [...prev, email]);
      setEmailInput('');
    }
  }, [emailInput, inviteEmails]);

  const removeEmail = useCallback((email: string) => {
    setInviteEmails((prev) => prev.filter((e) => e !== email));
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (step === 0 && canContinue) handleNext();
      else if (step === 3) addEmail();
      else if (step === 4 && canContinue) handleCreate();
    }
  };

  const handleNext = () => {
    if (canContinue) setStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleCreate = async () => {
    if (!canContinue || isCreating) return;
    setIsCreating(true);
    const action = await dispatch(
      createWorkspace({
        name: name.trim(),
        description: description.trim() || purpose?.label || '',
        color: theme.primary,
        icon: theme.label.charAt(0).toUpperCase(),
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
      setTimeout(() => onCreated(ws._id), 2800);
    }
    setIsCreating(false);
  };

  if (!isOpen) return null;

  const stepLabels = ['Basics', 'Identity', 'Purpose', 'Team', 'Launch'];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

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
          maxHeight: 'min(92vh, 760px)',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px z-10"
          style={{ background: 'var(--accent-gradient)' }}
        />

        {/* LEFT PANEL - Static */}
        <div
          className="relative w-full lg:w-[42%] overflow-hidden flex flex-col shrink-0"
          style={{
            background:
              'linear-gradient(160deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.06) 50%, transparent 100%)',
          }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }, (_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 3 + Math.random() * 6,
                  height: 3 + Math.random() * 6,
                  left: `${5 + Math.random() * 90}%`,
                  background: 'rgba(255,255,255,0.08)',
                  filter: 'blur(1px)',
                }}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: '-20%', opacity: [0, 0.5, 0.5, 0] }}
                transition={{
                  duration: 10 + Math.random() * 8,
                  delay: i * 0.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            ))}
          </div>

          <div
            className="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4), transparent)' }}
          />
          <div
            className="absolute -bottom-20 -right-20 w-56 h-56 rounded-full opacity-15 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4), transparent)' }}
          />

          <div className="relative z-10 flex-1 flex flex-col p-8 overflow-y-auto">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2.5 mb-8"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                SyncSpace
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-black mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Create your
              <br />
              workspace
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-sm leading-relaxed mb-8"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Set up your team headquarters for real-time collaboration.
            </motion.p>

            {/* Feature Cards */}
            <div className="space-y-3 mb-8">
              {FEATURE_CARDS.map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(99,102,241,0.12)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                    style={{ background: 'rgba(99,102,241,0.1)' }}
                  >
                    {card.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {card.title}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {card.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quote */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-auto pt-4 border-t"
              style={{ borderColor: 'rgba(99,102,241,0.1)' }}
            >
              <p
                className="text-xs italic leading-relaxed"
                style={{ color: 'var(--text-tertiary)' }}
              >
                "The best way to predict the future is to build it together."
              </p>
              <p
                className="text-[10px] mt-1 font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                — Team SyncSpace
              </p>
            </motion.div>
          </div>
        </div>

        {/* RIGHT PANEL - Dynamic */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 px-8 pt-6 pb-4 shrink-0">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-1.5 flex-1">
                <div className="flex items-center gap-1.5">
                  <motion.div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors"
                    style={{
                      background:
                        i <= step
                          ? i === step
                            ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                            : 'rgba(99,102,241,0.15)'
                          : 'var(--bg-tertiary)',
                      color: i <= step ? '#fff' : 'var(--text-tertiary)',
                    }}
                  >
                    {i < step ? (
                      <svg
                        className="w-3.5 h-3.5"
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
                    ) : (
                      i + 1
                    )}
                  </motion.div>
                  <span
                    className="text-[10px] font-medium hidden sm:block"
                    style={{ color: i <= step ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                  >
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div
                    className="flex-1 h-px mx-1"
                    style={{
                      background:
                        i < step
                          ? 'linear-gradient(90deg, #6366f1, rgba(99,102,241,0.2))'
                          : 'var(--border-color)',
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-4">
            <AnimatePresence mode="wait">
              {showSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
                    className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mb-6"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
                      boxShadow: '0 0 60px rgba(99,102,241,0.2)',
                    }}
                  >
                    ✨
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl font-black mb-2 gradient-text"
                  >
                    Workspace ready!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="text-sm"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Setting up your collaboration hub...
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 w-56 h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--bg-tertiary)' }}
                  >
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2.4, ease: 'easeInOut' }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)' }}
                    />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key={`step-${step}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {/* STEP 1: Name & Description */}
                  {step === 0 && (
                    <div className="space-y-5">
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
                          onKeyDown={handleKeyDown}
                          className="w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 outline-none focus:ring-2"
                          style={{
                            background: 'var(--bg-secondary)',
                            borderColor: name ? `${theme.primary}66` : 'var(--border-color)',
                            color: 'var(--text-primary)',
                            boxShadow: name ? `0 0 16px ${theme.primary}15` : 'none',
                            ['--tw-ring-color' as string]: `${theme.primary}33`,
                          }}
                          placeholder="e.g., Product Design Team"
                          maxLength={50}
                        />
                        <div className="flex items-center justify-between mt-1.5">
                          {name && name.trim().length < 2 ? (
                            <p className="text-[10px]" style={{ color: '#ef4444' }}>
                              At least 2 characters
                            </p>
                          ) : (
                            <span />
                          )}
                          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            {name.length}/50
                          </p>
                        </div>
                      </div>

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
                            ['--tw-ring-color' as string]: `${theme.primary}33`,
                          }}
                          placeholder="What will your team work on?"
                          rows={3}
                          maxLength={200}
                        />
                      </div>

                      <div
                        className="rounded-2xl border p-5"
                        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                      >
                        <p
                          className="text-[10px] font-bold uppercase tracking-widest mb-4"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          Live Preview
                        </p>
                        <div className="flex items-center gap-3.5 mb-4">
                          <motion.div
                            key={initials}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                              boxShadow: `0 4px 16px ${theme.primary}4D`,
                            }}
                          >
                            {initials}
                          </motion.div>
                          <div className="min-w-0">
                            <p
                              className="text-sm font-semibold truncate"
                              style={{
                                color: name ? 'var(--text-primary)' : 'var(--text-tertiary)',
                              }}
                            >
                              {name.trim() || 'Workspace Name'}
                            </p>
                            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                              Workspace
                            </p>
                          </div>
                        </div>
                        <p
                          className="text-xs leading-relaxed"
                          style={{
                            color: description ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                          }}
                        >
                          {description.trim() || 'No description yet'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Theme */}
                  {step === 1 && (
                    <div className="space-y-5">
                      <div>
                        <h3
                          className="text-sm font-bold mb-1"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Choose a theme
                        </h3>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                          Pick a color identity for your workspace.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {THEMES.map((t) => (
                          <motion.button
                            key={t.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setThemeId(t.id)}
                            className="relative overflow-hidden rounded-2xl border-2 transition-all p-4 text-left"
                            style={{
                              borderColor: themeId === t.id ? t.primary : 'var(--border-color)',
                              background:
                                themeId === t.id ? `${t.primary}0D` : 'var(--bg-secondary)',
                              boxShadow: themeId === t.id ? `0 0 20px ${t.primary}20` : 'none',
                            }}
                          >
                            <div
                              className={`h-12 rounded-xl bg-gradient-to-br ${t.gradient} mb-3`}
                            />
                            <p
                              className="text-xs font-semibold"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {t.label}
                            </p>
                            <p
                              className="text-[10px] mt-0.5"
                              style={{ color: 'var(--text-tertiary)' }}
                            >
                              {themeId === t.id ? 'Selected' : 'Click to select'}
                            </p>
                            {themeId === t.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ background: t.primary }}
                              >
                                <svg
                                  className="w-3 h-3 text-white"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4.5 12.75l6 6 9-13.5"
                                  />
                                </svg>
                              </motion.div>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Purpose */}
                  {step === 2 && (
                    <div className="space-y-5">
                      <div>
                        <h3
                          className="text-sm font-bold mb-1"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          What's your focus?
                        </h3>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                          Select the purpose that best describes your work.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {PURPOSES.map((p) => (
                          <motion.button
                            key={p.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setPurposeId(p.id === purposeId ? '' : p.id)}
                            className="relative flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left"
                            style={{
                              borderColor:
                                purposeId === p.id ? theme.primary : 'var(--border-color)',
                              background:
                                purposeId === p.id ? `${theme.primary}0D` : 'var(--bg-secondary)',
                              boxShadow:
                                purposeId === p.id ? `0 0 20px ${theme.primary}15` : 'none',
                            }}
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                              style={{
                                background:
                                  purposeId === p.id ? `${theme.primary}15` : 'var(--bg-tertiary)',
                              }}
                            >
                              {p.id === 'software'
                                ? '💻'
                                : p.id === 'design'
                                  ? '🎨'
                                  : p.id === 'business'
                                    ? '📊'
                                    : p.id === 'education'
                                      ? '📚'
                                      : p.id === 'research'
                                        ? '🔬'
                                        : '📋'}
                            </div>
                            <div className="min-w-0">
                              <p
                                className="text-sm font-semibold"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {p.label}
                              </p>
                              <p
                                className="text-xs mt-0.5"
                                style={{ color: 'var(--text-tertiary)' }}
                              >
                                {p.description}
                              </p>
                            </div>
                            {purposeId === p.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ background: theme.primary }}
                              >
                                <svg
                                  className="w-3 h-3 text-white"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4.5 12.75l6 6 9-13.5"
                                  />
                                </svg>
                              </motion.div>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Invite */}
                  {step === 3 && (
                    <div className="space-y-5">
                      <div>
                        <h3
                          className="text-sm font-bold mb-1"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Invite your team
                        </h3>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                          Add teammates by email. You can always invite more later.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
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
                            className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200 outline-none focus:ring-2"
                            style={{
                              background: 'var(--bg-secondary)',
                              borderColor: emailInput
                                ? `${theme.primary}66`
                                : 'var(--border-color)',
                              color: 'var(--text-primary)',
                              ['--tw-ring-color' as string]: `${theme.primary}33`,
                            }}
                            placeholder="teammate@company.com"
                          />
                          {emailSuggestions.length > 0 && emailInput && (
                            <div
                              className="absolute top-full left-0 right-0 mt-1 rounded-xl border z-10 overflow-hidden"
                              style={{
                                background: 'var(--bg-card)',
                                borderColor: 'var(--border-color)',
                              }}
                            >
                              {emailSuggestions.map((s) => (
                                <button
                                  key={s}
                                  onClick={() => {
                                    setEmailInput(s);
                                  }}
                                  className="w-full px-4 py-2 text-xs text-left hover:bg-[var(--bg-hover)] transition-colors"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={addEmail}
                          disabled={!emailInput.includes('@') || !emailInput.includes('.')}
                          className="px-5 py-3 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-30 shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                          }}
                        >
                          Add
                        </motion.button>
                      </div>

                      <AnimatePresence>
                        {inviteEmails.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-wrap gap-2"
                          >
                            {inviteEmails.map((email) => (
                              <motion.div
                                key={email}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                layout
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
                                style={{
                                  background: `${theme.primary}0D`,
                                  borderColor: `${theme.primary}30`,
                                }}
                              >
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                  style={{ background: theme.primary }}
                                >
                                  {email[0].toUpperCase()}
                                </div>
                                <span
                                  className="text-xs font-medium truncate max-w-[120px]"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  {email}
                                </span>
                                <button
                                  onClick={() => removeEmail(email)}
                                  className="text-[10px] opacity-40 hover:opacity-100 transition-opacity ml-0.5 p-0.5 rounded-full hover:bg-black/10"
                                  style={{ color: 'var(--text-secondary)' }}
                                >
                                  <svg
                                    className="w-3 h-3"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {inviteEmails.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="rounded-2xl border-2 border-dashed p-8 text-center"
                          style={{ borderColor: 'var(--border-color)' }}
                        >
                          <div
                            className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                            style={{ background: 'var(--bg-tertiary)' }}
                          >
                            <svg
                              className="w-6 h-6"
                              style={{ color: 'var(--text-tertiary)' }}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                              />
                            </svg>
                          </div>
                          <p
                            className="text-xs font-medium mb-1"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            No teammates added yet
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            You can invite more from workspace settings later
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* STEP 5: Review */}
                  {step === 4 && (
                    <div className="space-y-5">
                      <div>
                        <h3
                          className="text-sm font-bold mb-1"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Review & Launch
                        </h3>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                          Review your workspace details before launching.
                        </p>
                      </div>

                      <div
                        className="rounded-2xl border overflow-hidden"
                        style={{
                          borderColor: 'var(--border-color)',
                          background: 'var(--bg-secondary)',
                        }}
                      >
                        <div className="p-5 space-y-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold"
                              style={{
                                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                              }}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p
                                className="text-base font-bold truncate"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {name.trim()}
                              </p>
                              <p
                                className="text-xs mt-0.5"
                                style={{ color: 'var(--text-tertiary)' }}
                              >
                                {description.trim() || purpose?.label || 'No description'}
                              </p>
                            </div>
                          </div>

                          <div className="h-px" style={{ background: 'var(--border-color)' }} />

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p
                                className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                                style={{ color: 'var(--text-tertiary)' }}
                              >
                                Theme
                              </p>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-4 h-4 rounded bg-gradient-to-br ${theme.gradient}`}
                                />
                                <span
                                  className="text-xs font-medium"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  {theme.label}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p
                                className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                                style={{ color: 'var(--text-tertiary)' }}
                              >
                                Purpose
                              </p>
                              <p
                                className="text-xs font-medium"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {purpose?.label || 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <p
                                className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                                style={{ color: 'var(--text-tertiary)' }}
                              >
                                Visibility
                              </p>
                              <p
                                className="text-xs font-medium"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                Private
                              </p>
                            </div>
                            <div>
                              <p
                                className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                                style={{ color: 'var(--text-tertiary)' }}
                              >
                                Members
                              </p>
                              <p
                                className="text-xs font-medium"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {inviteEmails.length > 0
                                  ? `${inviteEmails.length + 1} (you + ${inviteEmails.length})`
                                  : '1 (just you)'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          className="px-5 py-3 border-t flex items-center gap-2"
                          style={{
                            borderColor: 'var(--border-color)',
                            background: 'var(--bg-card)',
                          }}
                        >
                          <svg
                            className="w-4 h-4"
                            style={{ color: '#10b981' }}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            All set. Ready to launch!
                          </span>
                        </div>
                      </div>

                      <motion.button
                        whileHover={canContinue ? { scale: 1.01 } : undefined}
                        whileTap={canContinue ? { scale: 0.99 } : undefined}
                        onClick={handleCreate}
                        disabled={!canContinue || isCreating}
                        className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{
                          background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                          boxShadow: canContinue ? `0 4px 24px ${theme.primary}40` : 'none',
                        }}
                      >
                        {isCreating ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                              />
                            </svg>
                            Launch Workspace
                          </>
                        )}
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {!showSuccess && (
            <div
              className="flex items-center justify-between px-8 py-4 border-t shrink-0"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <button
                onClick={step === 0 ? onClose : handleBack}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                {step === 0 ? 'Cancel' : 'Back'}
              </button>

              <button
                onClick={step < 4 ? handleNext : undefined}
                disabled={!canContinue}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                style={{
                  background: canContinue
                    ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                    : 'var(--bg-tertiary)',
                  boxShadow: canContinue ? `0 4px 20px ${theme.primary}30` : 'none',
                }}
              >
                {step < 4 ? (
                  <>
                    Continue{' '}
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </>
                ) : (
                  ''
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
