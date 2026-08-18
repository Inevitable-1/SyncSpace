import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { FolderIcon, ClockIcon, VideoCameraIcon, DocumentTextIcon } from '../Icons';
import type { RootState } from '../../store';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: 'workspace' | 'room' | 'meeting' | 'file';
  name: string;
  description?: string;
  route: string;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const { rooms } = useSelector((state: RootState) => state.room);
  const { meetings } = useSelector((state: RootState) => state.meeting);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const matched: SearchResult[] = [];

    workspaces.forEach((ws) => {
      if (
        ws.name.toLowerCase().includes(q) ||
        (ws.description && ws.description.toLowerCase().includes(q))
      ) {
        matched.push({
          id: ws._id,
          type: 'workspace',
          name: ws.name,
          description: ws.description,
          route: `/dashboard/workspaces/${ws._id}`,
        });
      }
    });

    rooms.forEach((r) => {
      if (r.name.toLowerCase().includes(q)) {
        matched.push({
          id: r._id,
          type: 'room',
          name: r.name,
          description: r.type,
          route: r.type === 'whiteboard' ? `/whiteboard/${r._id}` : `/dashboard/rooms/${r._id}`,
        });
      }
    });

    meetings.forEach((m) => {
      if (
        m.name.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q))
      ) {
        matched.push({
          id: m._id,
          type: 'meeting',
          name: m.name,
          description: m.status,
          route: '/dashboard/meetings',
        });
      }
    });

    setResults(matched.slice(0, 10));
  }, [query, workspaces, rooms, meetings]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      navigate(result.route);
      onClose();
      setQuery('');
    },
    [navigate, onClose],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'workspace':
        return <FolderIcon className="w-4 h-4" />;
      case 'room':
        return <ClockIcon className="w-4 h-4" />;
      case 'meeting':
        return <VideoCameraIcon className="w-4 h-4" />;
      case 'file':
        return <DocumentTextIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case 'workspace':
        return 'bg-blue-500/10 text-blue-400';
      case 'room':
        return 'bg-purple-500/10 text-purple-400';
      case 'meeting':
        return 'bg-amber-500/10 text-amber-400';
      case 'file':
        return 'bg-emerald-500/10 text-emerald-400';
      default:
        return 'bg-white/10 text-gray-400';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl mx-4 rounded-2xl border shadow-2xl overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3.5 border-b"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                style={{ color: 'var(--text-tertiary)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search workspaces, rooms, meetings..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--text-primary)' }}
              />
              <kbd
                className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
                style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border-color)' }}
              >
                ESC
              </kbd>
            </div>

            <div className="max-h-[50vh] overflow-y-auto">
              {!query.trim() ? (
                <div className="py-12 text-center">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'var(--bg-tertiary)' }}
                  >
                    <svg
                      className="w-7 h-7"
                      style={{ color: 'var(--text-tertiary)' }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Start typing to search
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Search across workspaces, rooms, and meetings
                  </p>
                </div>
              ) : results.length === 0 ? (
                <div className="py-12 text-center">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'var(--bg-tertiary)' }}
                  >
                    <svg
                      className="w-7 h-7"
                      style={{ color: 'var(--text-tertiary)' }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    No results found
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    No matches for &ldquo;{query}&rdquo;
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {results.map((result, i) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        i === selectedIndex ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColor(result.type)}`}
                      >
                        {typeIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {result.name}
                        </p>
                        <p
                          className="text-[11px] truncate"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                          {result.description ? ` · ${result.description}` : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
