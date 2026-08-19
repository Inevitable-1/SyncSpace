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
  onUploadImage: (file: File) => void;
}

const DRAW_TOOLS: { id: ToolType; label: string; icon: string }[] = [
  { id: 'pointer', label: 'Select', icon: 'cursor' },
  { id: 'hand', label: 'Hand', icon: 'hand' },
  { id: 'pencil', label: 'Pencil', icon: 'pencil' },
  { id: 'line', label: 'Line', icon: 'line' },
  { id: 'rectangle', label: 'Rectangle', icon: 'rect' },
  { id: 'circle', label: 'Circle', icon: 'circle' },
  { id: 'triangle', label: 'Triangle', icon: 'triangle' },
  { id: 'diamond', label: 'Diamond', icon: 'diamond' },
  { id: 'arrow', label: 'Arrow', icon: 'arrow' },
  { id: 'text', label: 'Text', icon: 'text' },
  { id: 'eraser', label: 'Eraser', icon: 'eraser' },
];

const OBJECT_TOOLS: { id: ToolType; label: string; icon: string }[] = [
  { id: 'rectangle', label: 'Rectangle', icon: 'rect' },
  { id: 'circle', label: 'Circle', icon: 'circle' },
  { id: 'triangle', label: 'Triangle', icon: 'triangle' },
  { id: 'diamond', label: 'Diamond', icon: 'diamond' },
  { id: 'arrow', label: 'Arrow', icon: 'arrow' },
  { id: 'line', label: 'Line', icon: 'line' },
];

const STICKY_TOOLS: { id: ToolType; label: string; color: string }[] = [
  { id: 'sticky-yellow', label: 'Yellow', color: '#FEF3C7' },
  { id: 'sticky-green', label: 'Green', color: '#D1FAE5' },
  { id: 'sticky-blue', label: 'Blue', color: '#DBEAFE' },
  { id: 'sticky-pink', label: 'Pink', color: '#FCE7F3' },
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
  onUploadImage,
}: ToolbarProps) {
  const [showExport, setShowExport] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [showObjects, setShowObjects] = useState(false);
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
      {/* Top Formatting Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-20 h-11 bg-white border-b border-gray-200 flex items-center px-3 gap-1 shadow-sm">
        {/* Drawing Tools */}
        <div className="flex items-center gap-0.5">
          {DRAW_TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => onToolChange(t.id)}
              title={t.label}
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

        {/* Sticky Notes */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSticky(!showSticky);
              setShowObjects(false);
              setShowExport(false);
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
              <path d="M15.5 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8.5L15.5 3z" />
              <polyline points="14 3 14 9 21 9" />
            </svg>
            Notes
          </button>
          <AnimatePresence>
            {showSticky && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-gray-200 flex gap-2"
              >
                {STICKY_TOOLS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onToolChange(s.id);
                      setShowSticky(false);
                    }}
                    className="w-8 h-8 rounded-md border-2 border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: s.color }}
                    title={`${s.label} Note`}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Objects */}
        <div className="relative">
          <button
            onClick={() => {
              setShowObjects(!showObjects);
              setShowSticky(false);
              setShowExport(false);
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
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Shapes
          </button>
          <AnimatePresence>
            {showObjects && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-gray-200 grid grid-cols-3 gap-1"
              >
                {OBJECT_TOOLS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onToolChange(t.id);
                      setShowObjects(false);
                    }}
                    className={`p-2 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 ${
                      activeTool === t.id ? 'bg-indigo-100 text-indigo-600' : ''
                    }`}
                    title={t.label}
                  >
                    <ToolIcon icon={t.icon} />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Image Upload */}
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

        {/* Formatting */}
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

        {/* Stroke & Fill */}
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

        {/* Undo / Redo */}
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

        {/* Zoom */}
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

        {/* Export */}
        <div className="relative">
          <button
            onClick={() => {
              setShowExport(!showExport);
              setShowSticky(false);
              setShowObjects(false);
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
                className="absolute top-full right-0 mt-1 p-1 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[120px]"
              >
                {[
                  { label: 'Export PNG', fn: onExportPNG },
                  { label: 'Export JPG', fn: onExportJPG },
                  { label: 'Export PDF', fn: onExportPDF },
                  { label: 'Export JSON', fn: onExportJSON },
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
