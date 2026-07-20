import { useState } from 'react';
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
    <Modal isOpen={isOpen} onClose={onClose} title="Create Workspace">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-primary)' }}
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
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-primary)' }}
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
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-primary)' }}
          >
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-all"
                style={{
                  background: c,
                  boxShadow: color === c ? `0 0 0 2px var(--bg-card), 0 0 0 4px ${c}` : 'none',
                }}
              />
            ))}
          </div>
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-primary)' }}
          >
            Icon
          </label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((ic) => (
              <button
                key={ic || 'none'}
                type="button"
                onClick={() => setIcon(ic)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${icon === ic ? 'ring-2 ring-indigo-500' : ''}`}
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
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
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-primary)' }}
          >
            Visibility
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${!isPublic ? 'border-indigo-500 bg-indigo-600/10 text-indigo-500' : ''}`}
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
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${isPublic ? 'border-indigo-500 bg-indigo-600/10 text-indigo-500' : ''}`}
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
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={!name.trim() || isLoading}
          >
            {isLoading ? <Spinner size="sm" /> : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
