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
  const [fieldErrors, setFieldErrors] = useState<{
    token?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [success, setSuccess] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const errors: typeof fieldErrors = {};
    if (!token) {
      errors.token = 'Reset token is required.';
    }
    if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    const result = await dispatch(resetPassword({ token, password }));
    if (resetPassword.fulfilled.match(result)) {
      setSuccess(true);
    }
  }

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
              to="/signin"
              className="text-brand-400 hover:text-brand-300 text-sm font-semibold transition-colors"
            >
              Sign in with new password
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4">
                <ErrorMessage message={error} onDismiss={() => dispatch(clearError())} />
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
                    onChange={(e) => {
                      setToken(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, token: undefined }));
                    }}
                    aria-invalid={!!fieldErrors.token}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all text-sm ${
                      fieldErrors.token
                        ? 'border-red-500/60 focus:ring-red-500/40 focus:border-red-500/60'
                        : 'border-white/10 focus:ring-brand-500/50 focus:border-brand-500/50'
                    }`}
                    placeholder="Paste your reset token"
                  />
                  {fieldErrors.token && (
                    <p className="text-red-400 text-xs mt-1.5" role="alert">
                      {fieldErrors.token}
                    </p>
                  )}
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((prev) => ({
                      ...prev,
                      password: undefined,
                      confirmPassword: undefined,
                    }));
                  }}
                  aria-invalid={!!fieldErrors.password}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all text-sm ${
                    fieldErrors.password
                      ? 'border-red-500/60 focus:ring-red-500/40 focus:border-red-500/60'
                      : 'border-white/10 focus:ring-brand-500/50 focus:border-brand-500/50'
                  }`}
                  placeholder="At least 6 characters"
                />
                {fieldErrors.password && (
                  <p className="text-red-400 text-xs mt-1.5" role="alert">
                    {fieldErrors.password}
                  </p>
                )}
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
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }}
                  aria-invalid={!!fieldErrors.confirmPassword}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all text-sm ${
                    fieldErrors.confirmPassword
                      ? 'border-red-500/60 focus:ring-red-500/40 focus:border-red-500/60'
                      : 'border-white/10 focus:ring-brand-500/50 focus:border-brand-500/50'
                  }`}
                  placeholder="Repeat your password"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e as unknown as FormEvent)}
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1.5" role="alert">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
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
            to="/signin"
            className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
