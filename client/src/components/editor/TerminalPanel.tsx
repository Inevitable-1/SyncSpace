import { useState, useCallback, useRef, useEffect } from 'react';
import type { TerminalEntry } from '../../types';

interface TerminalPanelProps {
  isVisible: boolean;
}

const MOCK_COMMANDS: Record<string, string> = {
  help: 'Available commands: help, clear, ls, echo, pwd, date, node --version',
  ls: 'src/\npackage.json\ntsconfig.json\nREADME.md',
  pwd: '/home/user/project',
  date: new Date().toISOString(),
  'node --version': 'v20.11.0',
  'npm --version': '10.2.4',
  'git status': 'On branch main\nYour branch is up to date',
};

export default function TerminalPanel({ isVisible }: TerminalPanelProps) {
  const [entries, setEntries] = useState<TerminalEntry[]>([
    {
      id: '1',
      type: 'info',
      content: 'SyncSpace Terminal v1.0.0\nType "help" for available commands.\n',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries]);

  const executeCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const commandEntry: TerminalEntry = {
      id: Math.random().toString(36).slice(2),
      type: 'command',
      content: `$ ${trimmed}`,
      timestamp: new Date().toISOString(),
    };

    if (trimmed === 'clear') {
      setEntries([]);
      setInput('');
      return;
    }

    const output = MOCK_COMMANDS[trimmed] || `bash: ${trimmed.split(' ')[0]}: command not found`;

    const outputEntry: TerminalEntry = {
      id: Math.random().toString(36).slice(2),
      type: trimmed.includes('not found') ? 'error' : 'output',
      content: output,
      timestamp: new Date().toISOString(),
    };

    setEntries((prev) => [...prev, commandEntry, outputEntry]);
    setInput('');
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        executeCommand(input);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length > 0) {
          const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
          setHistoryIndex(newIndex);
          setInput(history[history.length - 1 - newIndex]);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setInput(history[history.length - 1 - newIndex]);
        } else {
          setHistoryIndex(-1);
          setInput('');
        }
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        setEntries([]);
      }
    },
    [input, executeCommand, history, historyIndex],
  );

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
        <button
          onClick={() => setEntries([])}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Clear
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs scrollbar-thin"
        onClick={() => inputRef.current?.focus()}
      >
        {entries.map((entry) => (
          <div key={entry.id} className="whitespace-pre-wrap mb-0.5">
            {entry.type === 'command' && <span className="text-green-400">{entry.content}</span>}
            {entry.type === 'output' && <span className="text-gray-300">{entry.content}</span>}
            {entry.type === 'error' && <span className="text-red-400">{entry.content}</span>}
            {entry.type === 'info' && <span className="text-blue-400">{entry.content}</span>}
          </div>
        ))}

        <div className="flex items-center gap-1">
          <span className="text-green-400">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-gray-200 outline-none font-mono text-xs"
            placeholder="Type a command..."
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
