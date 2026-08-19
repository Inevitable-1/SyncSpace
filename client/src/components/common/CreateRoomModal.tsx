import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import Modal from './Modal';
import Spinner from './Spinner';
import { PaintBrushIcon, CodeBracketIcon, DocumentTextIcon } from '../Icons';
import type { RootState } from '../../store';

const ROOM_TYPES = [
  {
    value: 'whiteboard',
    label: 'Whiteboard',
    icon: PaintBrushIcon,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    value: 'code',
    label: 'Code',
    icon: CodeBracketIcon,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    value: 'document',
    label: 'Document',
    icon: DocumentTextIcon,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
];

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; type: string; workspaceId: string }) => void;
  workspaceId?: string;
  isLoading?: boolean;
}

export default function CreateRoomModal({
  isOpen,
  onClose,
  onSubmit,
  workspaceId,
  isLoading = false,
}: CreateRoomModalProps) {
  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const [name, setName] = useState('');
  const [type, setType] = useState('whiteboard');
  const [selectedWsId, setSelectedWsId] = useState(workspaceId || workspaces[0]?._id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name: name.trim(), type, workspaceId: selectedWsId || '' });
      setName('');
      setType('whiteboard');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
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
              Create Room
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Start collaborating in a new room
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Room Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-base"
              placeholder="Design Sprint"
              required
              autoFocus
            />
          </div>
          {workspaces.length > 0 && (
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                Workspace
              </label>
              <select
                value={selectedWsId}
                onChange={(e) => setSelectedWsId(e.target.value)}
                className="input-base"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              >
                <option value="">No workspace</option>
                {workspaces.map((ws) => (
                  <option key={ws._id} value={ws._id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label
              className="block text-xs font-semibold mb-2 uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Room Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ROOM_TYPES.map((option) => {
                const IconComp = option.icon;
                const isActive = type === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-sm font-medium transition-all ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-600/10 text-indigo-500 shadow-sm shadow-indigo-500/10'
                        : 'hover:bg-[var(--bg-hover)]'
                    }`}
                    style={
                      !isActive
                        ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
                        : undefined
                    }
                  >
                    <IconComp className={`w-5 h-5 ${isActive ? option.color : ''}`} />
                    {option.label}
                  </button>
                );
              })}
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
              {isLoading ? <Spinner size="sm" className="text-white" /> : 'Create Room'}
            </button>
          </div>
        </form>
      </motion.div>
    </Modal>
  );
}
