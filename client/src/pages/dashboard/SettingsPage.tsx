import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/common/Toast';
import { SunIcon, MoonIcon, CheckIcon } from '../../components/Icons';
import type { RootState } from '../../store';

export default function SettingsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [editName, setEditName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name || '');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {children}
    </motion.div>
  );

  const SettingRow = ({
    label,
    description,
    children,
  }: {
    label: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <div
      className="flex items-center justify-between py-3 border-b last:border-0"
      style={{ borderColor: 'var(--border-light)' }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {label}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {description}
        </p>
      </div>
      {children}
    </div>
  );

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`w-10 h-6 rounded-full relative transition-colors ${
        enabled ? 'bg-indigo-600' : ''
      }`}
      style={!enabled ? { background: 'var(--bg-tertiary)' } : undefined}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all ${
          enabled ? 'right-0.5 bg-white' : 'left-0.5'
        }`}
        style={!enabled ? { background: 'var(--text-tertiary)' } : undefined}
      />
    </button>
  );

  const handleSaveName = () => {
    if (nameValue.trim()) {
      showToast('Display name updated (demo)', 'success');
      setEditName(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Settings
      </h1>

      <Section title="Profile">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {user?.name}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {user?.email}
            </p>
          </div>
        </div>
        <SettingRow label="Display Name" description="Your display name across the platform">
          {editName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="input-base text-xs w-40"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
              <button
                onClick={handleSaveName}
                className="p-1.5 rounded-lg bg-indigo-600 text-white"
              >
                <CheckIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button onClick={() => setEditName(true)} className="btn-secondary text-xs">
              Edit
            </button>
          )}
        </SettingRow>
        <SettingRow label="Email" description={user?.email || ''}>
          <span className="text-xs px-2 py-1 rounded-md bg-emerald-600/20 text-emerald-500 font-medium">
            Verified
          </span>
        </SettingRow>
      </Section>

      <Section title="Appearance">
        <SettingRow label="Theme" description="Switch between light and dark mode">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            {theme === 'dark' ? (
              <>
                <SunIcon className="w-4 h-4" /> Light
              </>
            ) : (
              <>
                <MoonIcon className="w-4 h-4" /> Dark
              </>
            )}
          </button>
        </SettingRow>
      </Section>

      <Section title="Notifications">
        <SettingRow label="Email Notifications" description="Receive email for important updates">
          <Toggle
            enabled={emailNotifs}
            onToggle={() => {
              setEmailNotifs(!emailNotifs);
              showToast(
                emailNotifs ? 'Email notifications disabled' : 'Email notifications enabled',
                'info',
              );
            }}
          />
        </SettingRow>
        <SettingRow label="Push Notifications" description="Browser push notifications">
          <Toggle
            enabled={pushNotifs}
            onToggle={() => {
              setPushNotifs(!pushNotifs);
              showToast(
                pushNotifs ? 'Push notifications disabled' : 'Push notifications enabled',
                'info',
              );
            }}
          />
        </SettingRow>
      </Section>

      <Section title="Danger Zone">
        <SettingRow
          label="Delete Account"
          description="Permanently delete your account and all data"
        >
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Are you sure?
              </span>
              <button
                onClick={() => {
                  showToast('Account deletion is disabled in demo mode', 'info');
                  setShowDeleteConfirm(false);
                }}
                className="btn-danger text-xs px-3 py-1.5"
              >
                Yes, delete
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary text-xs">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger text-xs">
              Delete Account
            </button>
          )}
        </SettingRow>
      </Section>
    </div>
  );
}
