import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
}

interface SearchResult {
  type: 'task' | 'file' | 'message' | 'member' | 'workspace';
  id: string;
  title: string;
  subtitle: string;
}

const typeConfig: Record<string, { color: string; bg: string; iconPath: string }> = {
  task: {
    color: '#f97316',
    bg: 'rgba(249,115,22,0.1)',
    iconPath: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  file: {
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.1)',
    iconPath:
      'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  },
  message: {
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
    iconPath:
      'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z',
  },
  member: {
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
    iconPath:
      'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  },
  workspace: {
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
    iconPath:
      'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
  },
};

const mockResults: SearchResult[] = [
  { type: 'task', id: '1', title: 'Design homepage layout', subtitle: 'Task - In Progress' },
  { type: 'file', id: '2', title: 'project-spec.pdf', subtitle: 'File - Uploaded 2h ago' },
  {
    type: 'message',
    id: '3',
    title: 'Meeting notes from standup',
    subtitle: 'Message - Chat channel',
  },
  { type: 'member', id: '4', title: 'John Doe', subtitle: 'john@example.com' },
  { type: 'workspace', id: '5', title: 'Design System', subtitle: 'Workspace - 5 members' },
  { type: 'task', id: '6', title: 'Fix auth bug', subtitle: 'Task - Completed' },
  { type: 'file', id: '7', title: 'mockup-v2.fig', subtitle: 'File - Updated 1d ago' },
  { type: 'member', id: '8', title: 'Jane Smith', subtitle: 'jane@example.com' },
  { type: 'workspace', id: '9', title: 'Marketing Campaign', subtitle: 'Workspace - 12 members' },
  {
    type: 'message',
    id: '10',
    title: 'Sprint retrospective summary',
    subtitle: 'Message - Team channel',
  },
];

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    timerRef.current = setTimeout(() => {
      const lower = query.toLowerCase();
      const filtered = mockResults.filter(
        (r) =>
          r.title.toLowerCase().includes(lower) ||
          r.subtitle.toLowerCase().includes(lower) ||
          r.type.toLowerCase().includes(lower),
      );
      setResults(filtered);
      setIsSearching(false);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const handleClose = useCallback(() => {
    setQuery('');
    setResults([]);
    onClose();
  }, [onClose]);

  const handleResultClick = (_result: SearchResult) => {
    handleClose();
  };

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const key = r.type.charAt(0).toUpperCase() + r.type.slice(1);
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
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
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 border-b"
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
                placeholder="Search tasks, files, messages, members..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--text-primary)' }}
              />
              <button
                onClick={handleClose}
                className="p-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
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
                    Search across tasks, files, messages, and more
                  </p>
                </div>
              ) : isSearching ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent mx-auto" />
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
                  {Object.entries(grouped).map(([group, items]) => (
                    <div key={group}>
                      <div className="px-4 py-2">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {group}
                        </span>
                      </div>
                      {items.map((result) => {
                        const cfg = typeConfig[result.type] || typeConfig.task;
                        return (
                          <button
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleResultClick(result)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                            style={{ color: 'var(--text-primary)' }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = 'var(--bg-hover)')
                            }
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: cfg.bg }}
                            >
                              <svg
                                className="w-4 h-4"
                                style={{ color: cfg.color }}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d={cfg.iconPath}
                                />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{result.title}</p>
                              <p
                                className="text-xs truncate"
                                style={{ color: 'var(--text-tertiary)' }}
                              >
                                {result.subtitle}
                              </p>
                            </div>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
                              style={{
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-tertiary)',
                              }}
                            >
                              {result.type}
                            </span>
                          </button>
                        );
                      })}
                    </div>
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
