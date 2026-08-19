import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
  onStrokeColorChange: (c: string) => void;
  onFillColorChange: (c: string) => void;
  onStrokeWidthChange: (w: number) => void;
  onFontSizeChange: (s: number) => void;
  onFontFamilyChange: (f: string) => void;
  onExportPNG: () => void;
  onExportJPG: () => void;
  onExportPDF: () => void;
  onExportJSON: () => void;
  onExportSVG: () => void;
  onUploadImage: (file: File) => void;
  onLoadTemplate: (templateId: string) => void;
}

const BASIC_TOOLS: { id: ToolType; label: string; icon: string; shortcut?: string }[] = [
  { id: 'pointer', label: 'Select', icon: 'cursor', shortcut: 'V' },
  { id: 'hand', label: 'Hand', icon: 'hand', shortcut: 'H' },
  { id: 'pencil', label: 'Pencil', icon: 'pencil', shortcut: 'P' },
  { id: 'line', label: 'Line', icon: 'line', shortcut: 'L' },
  { id: 'rectangle', label: 'Rectangle', icon: 'rect', shortcut: 'R' },
  { id: 'circle', label: 'Circle', icon: 'circle', shortcut: 'C' },
  { id: 'triangle', label: 'Triangle', icon: 'triangle' },
  { id: 'diamond', label: 'Diamond', icon: 'diamond' },
  { id: 'arrow', label: 'Arrow', icon: 'arrow', shortcut: 'A' },
  { id: 'text', label: 'Text', icon: 'text', shortcut: 'T' },
  { id: 'connector', label: 'Connector', icon: 'connector' },
  { id: 'eraser', label: 'Eraser', icon: 'eraser', shortcut: 'E' },
];

const ADVANCED_SHAPES: { id: ToolType; label: string; icon: string }[] = [
  { id: 'pentagon', label: 'Pentagon', icon: 'pentagon' },
  { id: 'hexagon', label: 'Hexagon', icon: 'hexagon' },
  { id: 'star', label: 'Star', icon: 'star' },
  { id: 'cloud', label: 'Cloud', icon: 'cloud' },
  { id: 'cylinder', label: 'Cylinder', icon: 'cylinder' },
  { id: 'database', label: 'Database', icon: 'database' },
  { id: 'document', label: 'Document', icon: 'document' },
  { id: 'folder', label: 'Folder', icon: 'folder' },
  { id: 'process', label: 'Process Box', icon: 'process' },
  { id: 'decision', label: 'Decision', icon: 'diamond' },
  { id: 'actor', label: 'Actor', icon: 'actor' },
  { id: 'mindmap', label: 'Mind Map', icon: 'mindmap' },
];

const TEMPLATES = [
  { id: 'flowchart', label: 'Flowchart' },
  { id: 'mindmap', label: 'Mind Map' },
  { id: 'scrum', label: 'Scrum Board' },
  { id: 'brainstorm', label: 'Brainstorming' },
  { id: 'meeting', label: 'Meeting Notes' },
  { id: 'architecture', label: 'Software Architecture' },
];

const FONT_FAMILIES = ['Inter', 'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana'];
const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64, 72];

function ToolIcon({ icon, className }: { icon: string; className?: string }) {
  const cls = className || 'w-4 h-4';
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
    case 'triangle':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3L22 21H2L12 3z" />
        </svg>
      );
    case 'diamond':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L22 12L12 22L2 12L12 2z" />
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
    case 'connector':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="5" cy="12" r="3" />
          <circle cx="19" cy="12" r="3" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <polyline points="14 8 18 12 14 16" />
        </svg>
      );
    case 'eraser':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 20H7L3 16a1 1 0 010-1.41l9.59-9.59a2 2 0 012.82 0l5.59 5.59a2 2 0 010 2.82L14 20" />
          <line x1="18" y1="13" x2="11" y2="6" />
        </svg>
      );
    case 'pentagon':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L21 8.5L18 21H6L3 8.5L12 2z" />
        </svg>
      );
    case 'hexagon':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L21 7V17L12 22L3 17V7L12 2z" />
        </svg>
      );
    case 'star':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case 'cloud':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
        </svg>
      );
    case 'cylinder':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <line x1="3" y1="5" x2="3" y2="19" />
          <line x1="21" y1="5" x2="21" y2="19" />
          <path d="M3 19a9 9 0 0018 0" />
        </svg>
      );
    case 'database':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <line x1="3" y1="5" x2="3" y2="19" />
          <line x1="21" y1="5" x2="21" y2="19" />
          <path d="M3 19a9 9 0 0018 0" />
          <line x1="3" y1="12" x2="21" y2="12" />
        </svg>
      );
    case 'document':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case 'folder':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
      );
    case 'process':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <line x1="3" y1="12" x2="21" y2="12" />
        </svg>
      );
    case 'actor':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="4" r="2.5" />
          <line x1="12" y1="9" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="12" y1="16" x2="9" y2="21" />
          <line x1="12" y1="16" x2="15" y2="21" />
        </svg>
      );
    case 'mindmap':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="7" x2="12" y2="2" />
          <line x1="12" y1="22" x2="12" y2="17" />
          <line x1="7" y1="12" x2="2" y2="12" />
          <line x1="22" y1="12" x2="17" y2="12" />
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
  strokeColor,
  fillColor,
  strokeWidth,
  fontSize,
  fontFamily,
  onStrokeColorChange,
  onFillColorChange,
  onStrokeWidthChange,
  onFontSizeChange,
  onFontFamilyChange,
  onExportPNG,
  onExportJPG,
  onExportPDF,
  onExportJSON,
  onExportSVG,
  onUploadImage,
  onLoadTemplate,
}: ToolbarProps) {
  const [showExport, setShowExport] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadImage(file);
      e.target.value = '';
    }
  };

  return (
    <>
      <div className="relative z-20 h-11 bg-white border-b border-gray-200 flex items-center px-3 gap-1 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-0.5">
          {BASIC_TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => onToolChange(t.id)}
              title={t.shortcut ? `${t.label} (${t.shortcut})` : t.label}
              className={`p-1.5 rounded-md transition-all ${
                activeTool === t.id
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <ToolIcon icon={t.icon} />
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200 mx-1.5" />

        <div className="relative">
          <button
            onClick={() => {
              setShowAdvanced(!showAdvanced);
              setShowExport(false);
              setShowTemplates(false);
            }}
            className="px-2 py-1 text-xs rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="12 2 22 8.5 18 21 6 21 2 8.5" />
            </svg>
            Shapes
            <svg
              className="w-3 h-3 ml-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-xl border border-gray-200 grid grid-cols-4 gap-1"
              >
                {ADVANCED_SHAPES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onToolChange(s.id);
                      setShowAdvanced(false);
                    }}
                    className={`flex flex-col items-center gap-0.5 p-2 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 ${
                      activeTool === s.id ? 'bg-indigo-100 text-indigo-600' : ''
                    }`}
                    title={s.label}
                  >
                    <ToolIcon icon={s.icon} />
                    <span className="text-[9px] leading-tight">{s.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowTemplates(!showTemplates);
              setShowExport(false);
              setShowAdvanced(false);
            }}
            className="px-2 py-1 text-xs rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            Templates
          </button>
          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 mt-1 p-1 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[160px]"
              >
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onLoadTemplate(t.id);
                      setShowTemplates(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-2"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    {t.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-2 py-1 text-xs rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 flex items-center gap-1"
          title="Upload Image"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleImageUpload}
        />

        <div className="w-px h-5 bg-gray-200 mx-1.5" />

        <div className="flex items-center gap-1">
          <select
            value={fontFamily}
            onChange={(e) => onFontFamilyChange(e.target.value)}
            className="px-1.5 py-0.5 text-xs rounded-md border border-gray-200 bg-white text-gray-700 max-w-[100px]"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <select
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="px-1.5 py-0.5 text-xs rounded-md border border-gray-200 bg-white text-gray-700 w-12"
          >
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="w-px h-5 bg-gray-200 mx-1.5" />

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400">Stroke</span>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => onStrokeColorChange(e.target.value)}
              className="w-6 h-6 rounded border border-gray-200 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400">Fill</span>
            <input
              type="color"
              value={fillColor === 'transparent' ? '#ffffff' : fillColor}
              onChange={(e) => onFillColorChange(e.target.value)}
              className="w-6 h-6 rounded border border-gray-200 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400">Width</span>
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
              className="w-16 h-1 accent-indigo-600"
            />
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
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
            title="Redo (Ctrl+Shift+Z)"
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 11-2.13-9.36L23 10" />
            </svg>
          </button>
          <button
            onClick={onClear}
            title="Clear Canvas"
            className="p-1.5 rounded-md text-gray-500 hover:text-red-500 hover:bg-red-50"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>

        <div className="w-px h-5 bg-gray-200 mx-1.5" />

        <div className="flex items-center gap-0.5">
          <button
            onClick={onZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          >
            <svg
              className="w-3.5 h-3.5"
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
            className="px-1.5 py-0.5 text-[11px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded min-w-[44px] text-center"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            title="Zoom In"
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          >
            <svg
              className="w-3.5 h-3.5"
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

        <div className="w-px h-5 bg-gray-200 mx-1.5" />

        <div className="relative">
          <button
            onClick={() => {
              setShowExport(!showExport);
              setShowAdvanced(false);
              setShowTemplates(false);
            }}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
          <AnimatePresence>
            {showExport && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full right-0 mt-1 p-1 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[120px]"
              >
                {[
                  { label: 'PNG', fn: onExportPNG },
                  { label: 'JPG', fn: onExportJPG },
                  { label: 'SVG', fn: onExportSVG },
                  { label: 'PDF', fn: onExportPDF },
                  { label: 'JSON', fn: onExportJSON },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.fn();
                      setShowExport(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
