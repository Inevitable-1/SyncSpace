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

const mockConsoleEntries = [
  { type: 'log', message: '[SyncSpace] Editor initialized', time: '10:30:15' },
  { type: 'info', message: '[HMR] Connected to dev server', time: '10:30:16' },
  { type: 'log', message: '[SyncSpace] Collaborative session started', time: '10:30:17' },
];

const mockOutputEntries = [
  '[info] TypeScript compilation successful',
  '[info] No errors found',
  '[info] Build completed in 1.2s',
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
            {(tab.count ?? 0) > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px]">
                {tab.count}
              </span>
            )}
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
          <div className="space-y-1">
            {mockConsoleEntries.map((entry, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-gray-500">{entry.time}</span>
                <span
                  className={
                    entry.type === 'error'
                      ? 'text-red-400'
                      : entry.type === 'info'
                        ? 'text-blue-400'
                        : 'text-gray-300'
                  }
                >
                  {entry.message}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'output' && (
          <div className="space-y-1">
            {mockOutputEntries.map((entry, i) => (
              <div key={i} className="text-gray-300">
                {entry}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
