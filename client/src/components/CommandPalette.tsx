import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '../features/auth/authSlice';
import type { AppDispatch } from '../store';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: string;
  action: () => void;
  category: string;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const commands: CommandItem[] = [
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      icon: '🏠',
      action: () => navigate('/dashboard'),
      category: 'Navigation',
    },
    {
      id: 'workspaces',
      label: 'Go to Workspaces',
      icon: '📁',
      action: () => navigate('/dashboard/workspaces'),
      category: 'Navigation',
    },
    {
      id: 'rooms',
      label: 'Go to Rooms',
      icon: '💬',
      action: () => navigate('/dashboard/rooms'),
      category: 'Navigation',
    },
    {
      id: 'activity',
      label: 'Go to Activity',
      icon: '📊',
      action: () => navigate('/dashboard/activity'),
      category: 'Navigation',
    },
    {
      id: 'settings',
      label: 'Go to Settings',
      icon: '⚙️',
      action: () => navigate('/dashboard/settings'),
      category: 'Navigation',
    },
    {
      id: 'profile',
      label: 'Go to Profile',
      icon: '👤',
      action: () => navigate('/dashboard/profile'),
      category: 'Navigation',
    },
    {
      id: 'notifications',
      label: 'Go to Notifications',
      icon: '🔔',
      action: () => navigate('/dashboard/notifications'),
      category: 'Navigation',
    },
    {
      id: 'trash',
      label: 'Go to Trash',
      icon: '🗑️',
      action: () => navigate('/dashboard/trash'),
      category: 'Navigation',
    },
    {
      id: 'shared',
      label: 'Shared with Me',
      icon: '🤝',
      action: () => navigate('/dashboard/shared'),
      category: 'Navigation',
    },
    {
      id: 'files',
      label: 'File Manager',
      icon: '📄',
      action: () => navigate('/dashboard/files'),
      category: 'Navigation',
    },
    {
      id: 'insights',
      label: 'Team Insights',
      icon: '📈',
      action: () => navigate('/dashboard/insights'),
      category: 'Navigation',
    },
    {
      id: 'create-workspace',
      label: 'Create Workspace',
      icon: '➕',
      action: () => navigate('/dashboard/workspaces'),
      category: 'Actions',
    },
    {
      id: 'create-room',
      label: 'Create Room',
      icon: '➕',
      action: () => navigate('/dashboard/rooms'),
      category: 'Actions',
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: '🚪',
      action: () => {
        dispatch(logout());
        navigate('/');
      },
      category: 'Actions',
    },
  ];

  const filtered = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description?.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase()),
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
      setQuery('');
      setSelectedIndex(0);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (cmd: CommandItem) => {
    cmd.action();
    setIsOpen(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-0 z-[201] flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-surface-850/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                <svg
                  className="w-5 h-5 text-gray-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
                  placeholder="Search commands..."
                />
                <kbd className="text-[10px] font-mono text-gray-500 border border-white/10 rounded px-1.5 py-0.5">
                  ESC
                </kbd>
              </div>

              <div className="max-h-80 overflow-y-auto py-2 scrollbar-thin">
                {filtered.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    No commands found
                  </div>
                ) : (
                  filtered.map((cmd, i) => (
                    <button
                      key={cmd.id}
                      onClick={() => handleSelect(cmd)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        i === selectedIndex
                          ? 'bg-brand-600/10 text-white'
                          : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-base">{cmd.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-xs text-gray-500 truncate">{cmd.description}</div>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-600 font-medium">{cmd.category}</span>
                    </button>
                  ))
                )}
              </div>

              <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/5 text-[10px] text-gray-500">
                <span className="flex items-center gap-1">
                  <kbd className="font-mono border border-white/10 rounded px-1 py-0.5">↑↓</kbd>{' '}
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="font-mono border border-white/10 rounded px-1 py-0.5">↵</kbd>{' '}
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="font-mono border border-white/10 rounded px-1 py-0.5">esc</kbd>{' '}
                  close
                </span>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    window.dispatchEvent(new Event('syncspace:open-shortcuts'));
                  }}
                  className="ml-auto flex items-center gap-1 text-gray-500 hover:text-brand-300 transition-colors"
                >
                  <kbd className="font-mono border border-white/10 rounded px-1 py-0.5">?</kbd>{' '}
                  shortcuts
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
