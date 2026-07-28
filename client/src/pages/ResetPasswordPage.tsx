import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { resetPassword, clearError } from '../features/auth/authSlice';
import type { AppDispatch } from '../store';
import type { RootState } from '../store';
import AuthLayout from '../components/AuthLayout';
import ErrorMessage from '../components/common/ErrorMessage';
import Spinner from '../components/common/Spinner';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    if (!token) {
      setLocalError('Reset token is required');
      return;
    }

    const result = await dispatch(resetPassword({ token, password }));
    if (resetPassword.fulfilled.match(result)) {
      setSuccess(true);
    }
  }

  const displayError = localError || error;

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Set new password</h2>
        <p className="text-gray-400 text-sm mb-6">Enter your new password below.</p>

        {success ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-300 text-sm mb-4">Password has been reset successfully.</p>
            <Link
              to="/login"
              className="text-brand-400 hover:text-brand-300 text-sm font-semibold transition-colors"
            >
              Sign in with new password
            </Link>
          </div>
        ) : (
          <>
            {displayError && (
              <div className="mb-4">
                <ErrorMessage
                  message={displayError}
                  onDismiss={() => {
                    setLocalError('');
                    dispatch(clearError());
                  }}
                />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!tokenFromUrl && (
                <div>
                  <label
                    htmlFor="token"
                    className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider"
                  >
                    Reset token
                  </label>
                  <input
                    id="token"
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all text-sm"
                    placeholder="Paste your reset token"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider"
                >
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all text-sm"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider"
                >
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all text-sm"
                  placeholder="Repeat your password"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e as unknown as FormEvent)}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 disabled:from-brand-800 disabled:to-purple-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-600/25 text-sm"
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" /> Resetting...
                  </>
                ) : (
                  'Reset password'
                )}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-gray-400 text-sm">
          <Link
            to="/login"
            className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
