import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, XIcon } from '../Icons';

interface SearchResult {
  type: 'workspace' | 'member' | 'activity';
  id: string;
  title: string;
  subtitle?: string;
  avatar?: string;
  href: string;
}

interface GlobalSearchProps {
  className?: string;
}

export default function GlobalSearch({ className = '' }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const mockResults: SearchResult[] = [
        {
          type: 'workspace' as const,
          id: '1',
          title: 'Design System',
          subtitle: 'Workspace • 5 members',
          href: '/dashboard/workspaces',
        },
        {
          type: 'workspace' as const,
          id: '2',
          title: 'Marketing Campaign',
          subtitle: 'Workspace • 12 members',
          href: '/dashboard/workspaces',
        },
        {
          type: 'member' as const,
          id: '3',
          title: 'John Doe',
          subtitle: 'john@example.com',
          href: '/dashboard/workspaces',
        },
      ].filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setResults(mockResults);
    } catch (error) {
      void error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.href);
    setIsOpen(false);
    setQuery('');
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'workspace':
        return (
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <span className="text-indigo-600 dark:text-indigo-400">W</span>
          </div>
        );
      case 'member':
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <span className="text-purple-600 dark:text-purple-400">M</span>
          </div>
        );
      case 'activity':
        return (
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <span className="text-green-600 dark:text-green-400">A</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors hover:border-indigo-500 ${className}`}
        style={{
          background: 'var(--bg-input)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-tertiary)',
        }}
      >
        <MagnifyingGlassIcon className="w-4 h-4" />
        <span className="text-sm">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-gray-800">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="relative w-full max-w-xl mx-4 rounded-2xl border shadow-2xl overflow-hidden"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div
                className="flex items-center gap-3 p-4 border-b"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <MagnifyingGlassIcon
                  className="w-5 h-5"
                  style={{ color: 'var(--text-tertiary)' }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search workspaces, members, activities..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: 'var(--text-primary)' }}
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <XIcon className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent mx-auto" />
                  </div>
                ) : results.length > 0 ? (
                  <div className="py-2">
                    {results.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        {getResultIcon(result.type)}
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-medium text-sm truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {result.title}
                          </div>
                          {result.subtitle && (
                            <div
                              className="text-xs truncate"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {result.subtitle}
                            </div>
                          )}
                        </div>
                        <span
                          className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {result.type}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : query.length >= 2 ? (
                  <div className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                    No results found
                  </div>
                ) : (
                  <div className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                    Start typing to search...
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
