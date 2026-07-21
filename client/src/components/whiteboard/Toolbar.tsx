import { motion } from 'framer-motion';
import type { ToolType } from '../../types';

interface ToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

const tools: { id: ToolType; label: string; icon: string }[] = [
  { id: 'pointer', label: 'Pointer', icon: 'cursor' },
  { id: 'hand', label: 'Hand Tool', icon: 'hand' },
  { id: 'pencil', label: 'Pencil', icon: 'pencil' },
  { id: 'line', label: 'Line', icon: 'line' },
  { id: 'rectangle', label: 'Rectangle', icon: 'rect' },
  { id: 'circle', label: 'Circle', icon: 'circle' },
  { id: 'arrow', label: 'Arrow', icon: 'arrow' },
  { id: 'text', label: 'Text', icon: 'text' },
  { id: 'eraser', label: 'Eraser', icon: 'eraser' },
];

function ToolIcon({ icon, className }: { icon: string; className?: string }) {
  const cls = className || 'w-5 h-5';
  switch (icon) {
    case 'cursor':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          <path d="M13 13l6 6" />
        </svg>
      );
    case 'hand':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 11V6a2 2 0 00-4 0v5M14 10V4a2 2 0 00-4 0v11M10 10.5V8a2 2 0 00-4 0v8a8 8 0 0016 0v-4a2 2 0 00-4 0" />
        </svg>
      );
    case 'pencil':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      );
    case 'line':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="19" x2="19" y2="5" />
        </svg>
      );
    case 'rect':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      );
    case 'circle':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
    case 'arrow':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      );
    case 'text':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      );
    case 'eraser':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 20H7L3 16a1 1 0 010-1.41l9.59-9.59a2 2 0 012.82 0l5.59 5.59a2 2 0 010 2.82L14 20" />
          <line x1="18" y1="13" x2="11" y2="6" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Toolbar({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
}: ToolbarProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg"
      >
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            title={tool.label}
            className={`relative p-2.5 rounded-xl transition-all duration-150 ${
              activeTool === tool.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <ToolIcon icon={tool.icon} />
          </button>
        ))}

        <div className="w-px h-6 bg-[var(--border-color)] mx-1" />

        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
          </svg>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.13-9.36L23 10" />
          </svg>
        </button>

        <div className="w-px h-6 bg-[var(--border-color)] mx-1" />

        <button
          onClick={onClear}
          title="Clear Canvas"
          className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>

        <div className="w-px h-6 bg-[var(--border-color)] mx-1" />

        <div className="flex items-center gap-1">
          <button
            onClick={onZoomOut}
            title="Zoom Out"
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>

          <button
            onClick={onResetView}
            className="px-2 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-all min-w-[50px] text-center"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={onZoomIn}
            title="Zoom In"
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
