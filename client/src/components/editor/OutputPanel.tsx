import { useState } from 'react';
import type { OutputTab } from '../../types';

interface OutputPanelProps {
  isVisible: boolean;
}

const defaultTabs: OutputTab[] = [
  { id: 'problems', label: 'Problems', count: 0 },
  { id: 'console', label: 'Console', count: 0 },
  { id: 'output', label: 'Output', count: 0 },
];

export default function OutputPanel({ isVisible }: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState('problems');

  if (!isVisible) return null;

  return (
    <div
      className="flex flex-col h-full border-t"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-center border-b" style={{ borderColor: 'var(--border-color)' }}>
        {defaultTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-500'
                : 'border-transparent hover:text-[var(--text-secondary)]'
            }`}
            style={activeTab !== tab.id ? { color: 'var(--text-tertiary)' } : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs scrollbar-thin">
        {activeTab === 'problems' && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <svg
              className="w-6 h-6 mb-2"
              style={{ color: 'var(--text-tertiary)' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p style={{ color: 'var(--text-tertiary)' }}>No problems detected</p>
          </div>
        )}

        {activeTab === 'console' && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p style={{ color: 'var(--text-tertiary)' }}>No console output</p>
          </div>
        )}

        {activeTab === 'output' && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p style={{ color: 'var(--text-tertiary)' }}>No output</p>
          </div>
        )}
      </div>
    </div>
  );
}
