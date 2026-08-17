import { useRef, useEffect } from 'react';
import type { TerminalEntry } from '../../types';

interface TerminalPanelProps {
  isVisible: boolean;
}

export default function TerminalPanel({ isVisible }: TerminalPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const initialEntry: TerminalEntry = {
    id: '1',
    type: 'info',
    content:
      'Terminal is connected to the collaboration session.\nCommands are executed on the remote server.',
    timestamp: new Date().toISOString(),
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="flex flex-col h-full border-t"
      style={{ background: '#1a1a2e', borderColor: 'var(--border-color)' }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b"
        style={{ borderColor: '#2a2a3e' }}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-3.5 h-3.5 text-green-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          <span className="text-xs font-medium text-gray-400">Terminal</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs scrollbar-thin"
      >
        <div className="whitespace-pre-wrap mb-0.5">
          <span className="text-blue-400">{initialEntry.content}</span>
        </div>
      </div>
    </div>
  );
}
