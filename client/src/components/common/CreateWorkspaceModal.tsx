import { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from './Modal';
import Spinner from './Spinner';
import { GlobeAltIcon, LockClosedIcon } from '../Icons';

const COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
];

const ICONS = ['', 'P', 'D', 'C', 'S', 'T', 'M', 'B', 'W', 'L'];

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    color: string;
    icon: string;
    isPublic: boolean;
  }) => void;
  isLoading?: boolean;
}

export default function CreateWorkspaceModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateWorkspaceModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name: name.trim(), description: description.trim(), color, icon, isPublic });
      setName('');
      setDescription('');
      setColor(COLORS[0]);
      setIcon('');
      setIsPublic(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Create Workspace
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Set up a new workspace for your team
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-base"
              placeholder="My Workspace"
              required
              autoFocus
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
              className="input-base resize-none"
              rows={2}
              placeholder="Optional description..."
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-2 uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-all duration-200 hover:scale-110"
                  style={{
                    background: c,
                    boxShadow: color === c ? `0 0 0 2px var(--bg-card), 0 0 0 4px ${c}` : 'none',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-2 uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((ic) => (
                <button
                  key={ic || 'none'}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all"
                  style={{
                    background: icon === ic ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: icon === ic ? 'white' : 'var(--text-primary)',
                    boxShadow: icon === ic ? '0 2px 8px var(--accent-shadow)' : 'none',
                  }}
                >
                  {ic || (
                    <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      None
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-2 uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Visibility
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  !isPublic
                    ? 'border-indigo-500 bg-indigo-600/10 text-indigo-500 shadow-sm shadow-indigo-500/10'
                    : 'hover:bg-[var(--bg-hover)]'
                }`}
                style={
                  isPublic
                    ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
                    : undefined
                }
              >
                <LockClosedIcon className="w-4 h-4" /> Private
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  isPublic
                    ? 'border-indigo-500 bg-indigo-600/10 text-indigo-500 shadow-sm shadow-indigo-500/10'
                    : 'hover:bg-[var(--bg-hover)]'
                }`}
                style={
                  !isPublic
                    ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
                    : undefined
                }
              >
                <GlobeAltIcon className="w-4 h-4" /> Public
              </button>
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
              disabled={!name.trim() || isLoading}
            >
              {isLoading ? <Spinner size="sm" className="text-white" /> : 'Create Workspace'}
            </button>
          </div>
        </form>
      </motion.div>
    </Modal>
  );
}
