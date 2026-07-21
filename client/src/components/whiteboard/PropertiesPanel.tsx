import { motion } from 'framer-motion';
import type { WhiteboardObject, ToolType } from '../../types';

interface PropertiesPanelProps {
  selectedObject: WhiteboardObject | null;
  tool: ToolType;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
  onStrokeColorChange: (color: string) => void;
  onFillColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onOpacityChange: (opacity: number) => void;
  onFontSizeChange: (size: number) => void;
  onFontFamilyChange: (family: string) => void;
}

const PRESET_COLORS = [
  '#000000',
  '#FFFFFF',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#6366F1',
  '#F59E0B',
  '#10B981',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
];

const FONT_FAMILIES = ['Inter', 'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana'];

export default function PropertiesPanel({
  selectedObject,
  tool,
  strokeColor,
  fillColor,
  strokeWidth,
  opacity,
  fontSize,
  fontFamily,
  onStrokeColorChange,
  onFillColorChange,
  onStrokeWidthChange,
  onOpacityChange,
  onFontSizeChange,
  onFontFamilyChange,
}: PropertiesPanelProps) {
  const showTextProperties = tool === 'text' || selectedObject?.type === 'text';
  const showShapeProperties = tool !== 'pointer' && tool !== 'hand' && tool !== 'eraser';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-20 right-4 z-20 w-64 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-lg overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-[var(--border-color)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Properties</h3>
      </div>

      <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin">
        {(showShapeProperties || selectedObject) && (
          <>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                Stroke Color
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => onStrokeColorChange(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-[var(--border-color)] cursor-pointer"
                />
                <input
                  type="text"
                  value={strokeColor}
                  onChange={(e) => onStrokeColorChange(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono"
                />
              </div>
              <div className="grid grid-cols-5 gap-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => onStrokeColorChange(color)}
                    className={`w-6 h-6 rounded-md border-2 transition-all ${
                      strokeColor === color ? 'border-indigo-500 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                Fill Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fillColor === 'transparent' ? '#ffffff' : fillColor}
                  onChange={(e) => onFillColorChange(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-[var(--border-color)] cursor-pointer"
                />
                <input
                  type="text"
                  value={fillColor}
                  onChange={(e) => onFillColorChange(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono"
                />
                <button
                  onClick={() => onFillColorChange('transparent')}
                  className="px-2 py-1 text-[10px] rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  None
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                Stroke Width: {strokeWidth}px
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                Opacity: {Math.round(opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity * 100}
                onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
                className="w-full accent-indigo-600"
              />
            </div>
          </>
        )}

        {showTextProperties && (
          <>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                Font Size: {fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="72"
                value={fontSize}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                Font Family
              </label>
              <select
                value={fontFamily}
                onChange={(e) => onFontFamilyChange(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {selectedObject && (
          <div className="pt-2 border-t border-[var(--border-color)]">
            <p className="text-xs text-[var(--text-tertiary)]">Selected: {selectedObject.type}</p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Position: ({Math.round(selectedObject.x)}, {Math.round(selectedObject.y)})
            </p>
          </div>
        )}

        {!showShapeProperties && !selectedObject && (
          <p className="text-xs text-[var(--text-tertiary)] text-center py-4">
            Select a tool or object to edit properties
          </p>
        )}
      </div>
    </motion.div>
  );
}
