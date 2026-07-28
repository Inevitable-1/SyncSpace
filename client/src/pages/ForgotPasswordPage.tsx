import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { forgotPassword, clearError } from '../features/auth/authSlice';
import type { AppDispatch } from '../store';
import type { RootState } from '../store';
import AuthLayout from '../components/AuthLayout';
import ErrorMessage from '../components/common/ErrorMessage';
import Spinner from '../components/common/Spinner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await dispatch(forgotPassword({ email }));
    if (forgotPassword.fulfilled.match(result)) {
      setSent(true);
    }
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Reset your password</h2>
        <p className="text-gray-400 text-sm mb-6">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {sent ? (
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
            <p className="text-gray-300 text-sm mb-4">
              If an account exists with <span className="text-white font-semibold">{email}</span>,
              we&apos;ve sent a reset link.
            </p>
            <Link
              to="/login"
              className="text-brand-400 hover:text-brand-300 text-sm font-semibold transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4">
                <ErrorMessage message={error} onDismiss={() => dispatch(clearError())} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all text-sm"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 disabled:from-brand-800 disabled:to-purple-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-600/25 text-sm"
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" /> Sending...
                  </>
                ) : (
                  'Send reset link'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-gray-400 text-sm">
              Remember your password?{' '}
              <Link
                to="/login"
                className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </AuthLayout>
  );
}
