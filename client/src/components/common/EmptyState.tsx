import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 text-center"
    >
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 bg-[var(--surface-subtle)] ring-1 ring-[var(--border-light)]">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p
        className="text-sm max-w-sm mb-6 leading-relaxed"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {description}
      </p>
      {action}
    </motion.div>
  );
}
