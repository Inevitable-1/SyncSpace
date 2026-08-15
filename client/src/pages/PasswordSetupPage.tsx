import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';
import AuthLayout from '../components/AuthLayout';
import Spinner from '../components/common/Spinner';
import { CheckIcon, XIcon } from '../components/Icons';

interface PasswordRules {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
}

function evaluateRules(password: string): PasswordRules {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };
}

export default function PasswordSetupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'loading' | 'invalid' | 'ready'>('loading');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }
    authService
      .verifyEmail(token)
      .then((res) => {
        setName(res.name);
        setEmail(res.email);
        setStatus('ready');
      })
      .catch(() => {
        setStatus('invalid');
      });
  }, [token]);

  const rules = evaluateRules(password);
  const passwordsMatch = confirmPassword === password;
  const allValid =
    rules.minLength && rules.uppercase && rules.lowercase && rules.number && passwordsMatch;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!allValid) return;
    setSubmitting(true);
    setError('');
    try {
      await authService.setPassword({ token, password });
      navigate('/signin?registered=1', { replace: true });
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string } } };
      setError(e2.response?.data?.message || 'Failed to create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const ruleItems: { key: keyof PasswordRules; label: string }[] = [
    { key: 'minLength', label: 'At least 8 characters' },
    { key: 'uppercase', label: 'At least one uppercase letter' },
    { key: 'lowercase', label: 'At least one lowercase letter' },
    { key: 'number', label: 'At least one number' },
  ];

  const inputClass = (invalid: boolean) =>
    `w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all text-sm ${
      invalid
        ? 'border-red-500/60 focus:ring-red-500/40 focus:border-red-500/60'
        : 'border-white/10 focus:ring-brand-500/50 focus:border-brand-500/50'
    }`;

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-10">
            <Spinner size="lg" />
            <p className="text-gray-400 text-sm mt-4">Checking your verification link...</p>
          </div>
        )}

        {status === 'invalid' && (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-red-500/10 flex items-center justify-center">
              <XIcon className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-xl font-black text-white mb-1 tracking-tight">Invalid link</h2>
            <p className="text-gray-400 text-sm mb-6">
              This verification link is invalid or has expired. Request a new one to continue.
            </p>
            <Link
              to="/register"
              className="inline-block px-6 py-3 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all text-sm"
            >
              Back to Sign Up
            </Link>
          </div>
        )}

        {status === 'ready' && (
          <>
            <h2 className="text-2xl font-black text-white mb-1 tracking-tight">
              Set your password
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              {name ? (
                <>
                  Welcome, <span className="font-semibold text-white">{name}</span>! Choose a
                  password to finish creating your account.
                </>
              ) : (
                'Choose a password to finish creating your account.'
              )}
            </p>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={password.length > 0 && !rules.minLength}
                  className={inputClass(password.length > 0 && !rules.minLength)}
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
                  className={inputClass(confirmPassword.length > 0 && !passwordsMatch)}
                  placeholder="Repeat your password"
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
                <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                  Password requirements
                </p>
                {ruleItems.map((item) => {
                  const met = rules[item.key];
                  return (
                    <div key={item.key} className="flex items-center gap-2 text-xs">
                      {met ? (
                        <CheckIcon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <XIcon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                      )}
                      <span className={met ? 'text-emerald-300' : 'text-gray-400'}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
                <div className="flex items-center gap-2 text-xs">
                  {confirmPassword.length > 0 && passwordsMatch ? (
                    <CheckIcon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XIcon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  )}
                  <span
                    className={
                      confirmPassword.length > 0 && passwordsMatch
                        ? 'text-emerald-300'
                        : 'text-gray-400'
                    }
                  >
                    Passwords match
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !allValid}
                className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 disabled:from-brand-800 disabled:to-purple-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-600/25 text-sm"
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" /> Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          </>
        )}

        {status === 'ready' && (
          <p className="mt-6 text-center text-gray-400 text-sm">
            {email && <span className="block text-xs text-gray-500 mb-1">{email}</span>}
            Changed your mind?{' '}
            <Link
              to="/signin"
              className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        )}
      </motion.div>
    </AuthLayout>
  );
}
