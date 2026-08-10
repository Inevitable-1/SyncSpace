import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, XIcon, InformationCircleIcon } from '../Icons';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

const meta = {
  success: {
    bar: 'bg-emerald-500',
    ring: 'ring-emerald-500/20',
    icon: CheckIcon,
  },
  error: {
    bar: 'bg-red-500',
    ring: 'ring-red-500/20',
    icon: XIcon,
  },
  info: {
    bar: 'bg-cyan-500',
    ring: 'ring-cyan-500/20',
    icon: InformationCircleIcon,
  },
} as const;

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const { bar, ring, icon: Icon } = meta[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -24, scale: 0.95 }}
      transition={{ type: 'spring', damping: 26, stiffness: 400 }}
      className={`relative flex items-center gap-3 pl-3 pr-2.5 py-3 rounded-xl text-white text-sm font-medium shadow-2xl ring-1 ${ring} bg-surface-850/90 backdrop-blur-xl border border-white/10 overflow-hidden`}
    >
      <div
        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${bar} flex items-center justify-center flex-shrink-0 shadow-lg`}
      >
        <Icon className={`w-4 h-4 text-white`} />
      </div>
      <span className="flex-1 text-gray-100">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Dismiss"
      >
        <XIcon className="w-3.5 h-3.5" />
      </button>
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 4, ease: 'linear' }}
        className={`absolute bottom-0 left-0 right-0 h-0.5 origin-left ${bar} opacity-70`}
      />
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onRemove={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
