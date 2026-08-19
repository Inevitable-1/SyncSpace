import { useState } from 'react';
import type { WhiteboardObject } from '../../types';

interface ShapeEditorPanelProps {
  selectedObjects: WhiteboardObject[];
  onUpdate: (object: WhiteboardObject) => void;
  onClose: () => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
}

export default function ShapeEditorPanel({
  selectedObjects,
  onUpdate,
  onClose,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
}: ShapeEditorPanelProps) {
  const [activeTab, setActiveTab] = useState<'style' | 'layer'>('style');

  if (selectedObjects.length === 0) return null;

  const obj = selectedObjects[0];
  const isSingle = selectedObjects.length === 1;

  const update = (props: Partial<WhiteboardObject>) => {
    onUpdate({ ...obj, ...props });
  };

  return (
    <div className="absolute top-14 right-3 z-20 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-700">
          {isSingle
            ? `${obj.type.charAt(0).toUpperCase() + obj.type.slice(1)} Properties`
            : `${selectedObjects.length} Objects`}
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 px-3 py-1.5 text-[11px] font-medium ${
            activeTab === 'style'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Style
        </button>
        <button
          onClick={() => setActiveTab('layer')}
          className={`flex-1 px-3 py-1.5 text-[11px] font-medium ${
            activeTab === 'layer'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Layer
        </button>
      </div>

      <div className="p-3 max-h-80 overflow-y-auto">
        {activeTab === 'style' ? (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                Fill
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={obj.fill === 'transparent' ? '#ffffff' : (obj.fill as string) || '#ffffff'}
                  onChange={(e) => update({ fill: e.target.value })}
                  className="w-7 h-7 rounded border border-gray-200 cursor-pointer"
                />
                <button
                  onClick={() => update({ fill: 'transparent' })}
                  className="text-[10px] text-gray-400 hover:text-gray-600 underline"
                >
                  No fill
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                Border
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={(obj.stroke as string) || '#000000'}
                  onChange={(e) => update({ stroke: e.target.value })}
                  className="w-7 h-7 rounded border border-gray-200 cursor-pointer"
                />
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={obj.strokeWidth || 2}
                  onChange={(e) => update({ strokeWidth: Number(e.target.value) })}
                  className="flex-1 h-1 accent-indigo-600"
                />
                <span className="text-[10px] text-gray-400 w-5 text-right">
                  {obj.strokeWidth || 2}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!obj.dashed}
                    onChange={(e) => update({ dashed: e.target.checked })}
                    className="w-3 h-3 rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-[10px] text-gray-500">Dashed</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                Opacity
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={obj.opacity ?? 1}
                  onChange={(e) => update({ opacity: Number(e.target.value) })}
                  className="flex-1 h-1 accent-indigo-600"
                />
                <span className="text-[10px] text-gray-400 w-8 text-right">
                  {Math.round((obj.opacity ?? 1) * 100)}%
                </span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                Corner Radius
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={obj.cornerRadius ?? 4}
                  onChange={(e) => update({ cornerRadius: Number(e.target.value) })}
                  className="flex-1 h-1 accent-indigo-600"
                />
                <span className="text-[10px] text-gray-400 w-5 text-right">
                  {obj.cornerRadius ?? 4}
                </span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                Shadow
              </label>
              <div className="flex items-center gap-2 mt-1">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!obj.shadow}
                    onChange={(e) => update({ shadow: e.target.checked })}
                    className="w-3 h-3 rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-[10px] text-gray-500">Enable</span>
                </label>
              </div>
              {obj.shadow && (
                <div className="mt-1.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-12">Color</span>
                    <input
                      type="color"
                      value={obj.shadowColor || '#000000'}
                      onChange={(e) => update({ shadowColor: e.target.value })}
                      className="w-6 h-6 rounded border border-gray-200 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-12">Blur</span>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={obj.shadowBlur ?? 8}
                      onChange={(e) => update({ shadowBlur: Number(e.target.value) })}
                      className="flex-1 h-1 accent-indigo-600"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-12">Offset X</span>
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      value={obj.shadowOffsetX ?? 2}
                      onChange={(e) => update({ shadowOffsetX: Number(e.target.value) })}
                      className="flex-1 h-1 accent-indigo-600"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-12">Offset Y</span>
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      value={obj.shadowOffsetY ?? 2}
                      onChange={(e) => update({ shadowOffsetY: Number(e.target.value) })}
                      className="flex-1 h-1 accent-indigo-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {obj.type === 'text' && (
              <>
                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                    Text Style
                  </label>
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      onClick={() => update({ bold: !obj.bold })}
                      className={`px-1.5 py-0.5 text-[10px] rounded border ${
                        obj.bold
                          ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      B
                    </button>
                    <button
                      onClick={() => update({ italic: !obj.italic })}
                      className={`px-1.5 py-0.5 text-[10px] rounded border italic ${
                        obj.italic
                          ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      I
                    </button>
                    <button
                      onClick={() => update({ underline: !obj.underline })}
                      className={`px-1.5 py-0.5 text-[10px] rounded border underline ${
                        obj.underline
                          ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      U
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    {(['left', 'center', 'right'] as const).map((a) => (
                      <button
                        key={a}
                        onClick={() => update({ align: a })}
                        className={`px-1.5 py-0.5 text-[10px] rounded border ${
                          obj.align === a
                            ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {a === 'left' ? 'L' : a === 'center' ? 'C' : 'R'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                    Font Size
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="range"
                      min="8"
                      max="120"
                      value={obj.fontSize || 16}
                      onChange={(e) => update({ fontSize: Number(e.target.value) })}
                      className="flex-1 h-1 accent-indigo-600"
                    />
                    <span className="text-[10px] text-gray-400 w-6 text-right">
                      {obj.fontSize || 16}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => onBringToFront(obj.id)}
              className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="17 11 12 6 7 11" />
                <polyline points="17 18 12 13 7 18" />
              </svg>
              Bring to Front
            </button>
            <button
              onClick={() => onBringForward(obj.id)}
              className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="17 11 12 6 7 11" />
              </svg>
              Bring Forward
            </button>
            <button
              onClick={() => onSendBackward(obj.id)}
              className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="7 13 12 18 17 13" />
              </svg>
              Send Backward
            </button>
            <button
              onClick={() => onSendToBack(obj.id)}
              className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="7 7 12 12 17 7" />
                <polyline points="7 13 12 18 17 13" />
              </svg>
              Send to Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
