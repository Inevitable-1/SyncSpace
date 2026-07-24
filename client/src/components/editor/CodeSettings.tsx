import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { updateSettings } from '../../features/editor/editorSlice';
import type { RootState } from '../../store';
import type { EditorSettings } from '../../types';

interface CodeSettingsProps {
  isVisible: boolean;
  onClose: () => void;
}

const FONT_SIZES = [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24];
const TAB_SIZES = [2, 4, 8];
const THEMES: Array<{ value: EditorSettings['theme']; label: string }> = [
  { value: 'vs-dark', label: 'Dark' },
  { value: 'vs', label: 'Light' },
  { value: 'hc-black', label: 'High Contrast' },
];

export default function CodeSettings({ isVisible, onClose }: CodeSettingsProps) {
  const dispatch = useAppDispatch();
  const settings = useSelector((state: RootState) => state.editor.settings);

  if (!isVisible) return null;

  const SettingRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div
      className="flex items-center justify-between py-2 border-b"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
      {children}
    </div>
  );

  return (
    <div
      className="flex flex-col h-full border-l"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', width: 280 }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          Settings
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <svg
            className="w-3.5 h-3.5"
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

      <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
        <SettingRow label="Font Size">
          <select
            value={settings.fontSize}
            onChange={(e) => dispatch(updateSettings({ fontSize: Number(e.target.value) }))}
            className="text-xs px-2 py-1 rounded border outline-none"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            {FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </SettingRow>

        <SettingRow label="Tab Size">
          <select
            value={settings.tabSize}
            onChange={(e) => dispatch(updateSettings({ tabSize: Number(e.target.value) }))}
            className="text-xs px-2 py-1 rounded border outline-none"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            {TAB_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </SettingRow>

        <SettingRow label="Theme">
          <select
            value={settings.theme}
            onChange={(e) =>
              dispatch(updateSettings({ theme: e.target.value as EditorSettings['theme'] }))
            }
            className="text-xs px-2 py-1 rounded border outline-none"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            {THEMES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </SettingRow>

        <SettingRow label="Word Wrap">
          <button
            onClick={() =>
              dispatch(updateSettings({ wordWrap: settings.wordWrap === 'on' ? 'off' : 'on' }))
            }
            className={`w-9 h-5 rounded-full transition-colors relative ${
              settings.wordWrap === 'on' ? 'bg-indigo-600' : 'bg-gray-600'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.wordWrap === 'on' ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </SettingRow>

        <SettingRow label="Auto Save">
          <button
            onClick={() => dispatch(updateSettings({ autoSave: !settings.autoSave }))}
            className={`w-9 h-5 rounded-full transition-colors relative ${
              settings.autoSave ? 'bg-indigo-600' : 'bg-gray-600'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.autoSave ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </SettingRow>

        <SettingRow label="Minimap">
          <button
            onClick={() => dispatch(updateSettings({ minimap: !settings.minimap }))}
            className={`w-9 h-5 rounded-full transition-colors relative ${
              settings.minimap ? 'bg-indigo-600' : 'bg-gray-600'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.minimap ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </SettingRow>

        <SettingRow label="Line Numbers">
          <button
            onClick={() => dispatch(updateSettings({ lineNumbers: !settings.lineNumbers }))}
            className={`w-9 h-5 rounded-full transition-colors relative ${
              settings.lineNumbers ? 'bg-indigo-600' : 'bg-gray-600'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.lineNumbers ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </SettingRow>
      </div>
    </div>
  );
}
