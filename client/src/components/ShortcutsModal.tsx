import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Shortcut {
  keys: string[];
  label: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['Ctrl', 'K'], label: 'Open command palette' },
  { keys: ['?'], label: 'Show keyboard shortcuts' },
  { keys: ['Esc'], label: 'Close any dialog or palette' },
  { keys: ['↑', '↓'], label: 'Navigate palette items' },
  { keys: ['Enter'], label: 'Select active item' },
  { keys: ['Ctrl', 'L'], label: 'Focus search' },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.75rem] items-center justify-center gap-1 rounded-md border border-white/15 bg-white/5 px-1.5 py-1 font-mono text-[11px] font-medium text-gray-200 shadow-sm">
      {children}
    </kbd>
  );
}

export default function ShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.shiftKey && e.key === '?') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    const openShortcuts = () => setIsOpen(true);
    window.addEventListener('syncspace:open-shortcuts', openShortcuts);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('syncspace:open-shortcuts', openShortcuts);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[301] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-850/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div>
                  <h2 className="text-sm font-semibold text-white">Keyboard Shortcuts</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">Move faster around SyncSpace</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Close shortcuts"
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

              <div className="p-3 max-h-[60vh] overflow-y-auto scrollbar-thin">
                <div className="space-y-1">
                  {SHORTCUTS.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors"
                    >
                      <span className="text-[13px] text-gray-300">{s.label}</span>
                      <span className="flex items-center gap-1">
                        {s.keys.map((k, i) => (
                          <span key={`${s.label}-${i}`} className="flex items-center gap-1">
                            {i > 0 && <span className="text-gray-600 text-[11px]">+</span>}
                            <Kbd>{k}</Kbd>
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">
                  Press <Kbd>?</Kbd> anytime to reopen
                </span>
                <span className="text-[10px] font-medium text-brand-400/80">
                  SyncSpace v1.0 Internship Edition
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
