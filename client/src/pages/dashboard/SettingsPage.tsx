import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/common/Toast';
import { SunIcon, MoonIcon, CheckIcon } from '../../components/Icons';
import type { RootState } from '../../store';

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-10 h-6 rounded-full relative transition-colors ${enabled ? 'bg-indigo-600' : ''}`}
      style={!enabled ? { background: 'var(--bg-tertiary)' } : undefined}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all ${enabled ? 'right-0.5 bg-white' : 'left-0.5'}`}
        style={!enabled ? { background: 'var(--text-tertiary)' } : undefined}
      />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
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
}

export default function SettingsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [editName, setEditName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name || '');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [desktopNotifs, setDesktopNotifs] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showActivityStatus, setShowActivityStatus] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveName = () => {
    if (nameValue.trim()) {
      showToast('Display name updated successfully', 'success');
      setEditName(false);
    }
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    showToast('Password changed successfully', 'success');
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Settings
      </h1>

      <Section title="Profile">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
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
        <SettingRow label="Password" description="Change your account password">
          <button onClick={() => setShowPasswordModal(true)} className="btn-secondary text-xs">
            Change
          </button>
        </SettingRow>
      </Section>

      <Section title="Appearance">
        <SettingRow label="Theme" description="Switch between light and dark mode">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
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
        <SettingRow
          label="Desktop Notifications"
          description="Show desktop notifications for messages"
        >
          <Toggle
            enabled={desktopNotifs}
            onToggle={() => {
              setDesktopNotifs(!desktopNotifs);
              showToast(
                desktopNotifs ? 'Desktop notifications disabled' : 'Desktop notifications enabled',
                'info',
              );
            }}
          />
        </SettingRow>
      </Section>

      <Section title="Privacy">
        <SettingRow label="Show Online Status" description="Let others see when you are online">
          <Toggle
            enabled={showOnlineStatus}
            onToggle={() => setShowOnlineStatus(!showOnlineStatus)}
          />
        </SettingRow>
        <SettingRow label="Show Activity Status" description="Let others see your current activity">
          <Toggle
            enabled={showActivityStatus}
            onToggle={() => setShowActivityStatus(!showActivityStatus)}
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

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPasswordModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md rounded-2xl border shadow-xl p-6 space-y-4"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
            }}
          >
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Change Password
            </h2>
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-base"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-base"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-base"
                placeholder="Confirm new password"
                onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowPasswordModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleChangePassword} className="btn-primary">
                Change Password
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
