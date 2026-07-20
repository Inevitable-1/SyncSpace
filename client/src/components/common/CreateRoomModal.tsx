import { useState } from 'react';
import { useSelector } from 'react-redux';
import Modal from './Modal';
import Spinner from './Spinner';
import type { RootState } from '../../store';

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
    if (name.trim() && selectedWsId) {
      onSubmit({ name: name.trim(), type, workspaceId: selectedWsId });
      setName('');
      setType('whiteboard');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Room">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-primary)' }}
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
        {workspaces.length > 1 && (
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              Workspace
            </label>
            <select
              value={selectedWsId}
              onChange={(e) => setSelectedWsId(e.target.value)}
              className="input-base"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
            >
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
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-primary)' }}
          >
            Room Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'whiteboard', label: 'Whiteboard' },
              { value: 'code', label: 'Code' },
              { value: 'document', label: 'Document' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  type === option.value ? 'border-indigo-500 bg-indigo-600/10 text-indigo-500' : ''
                }`}
                style={
                  type !== option.value
                    ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
                    : undefined
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!name.trim() || !selectedWsId || isLoading}
          >
            {isLoading ? <Spinner size="sm" /> : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
