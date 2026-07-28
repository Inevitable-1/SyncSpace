import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from '../Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md rounded-2xl border shadow-xl overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div
              className={`flex items-center justify-between p-5 ${title ? 'border-b' : 'pb-0'}`}
              style={{ borderColor: title ? 'var(--border-color)' : undefined }}
            >
              {title && (
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {title}
                </h2>
              )}
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-hover)] ${!title ? 'ml-auto' : ''}`}
                style={{ color: 'var(--text-tertiary)' }}
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
