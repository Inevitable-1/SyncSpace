import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { register, clearError } from '../features/auth/authSlice';
import { authService } from '../services/authService';
import type { AppDispatch } from '../store';
import type { RootState } from '../store';
import AuthLayout from '../components/AuthLayout';
import ErrorMessage from '../components/common/ErrorMessage';
import Spinner from '../components/common/Spinner';
import { CheckIcon } from '../components/Icons';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  name?: string;
  email?: string;
}

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [devToken, setDevToken] = useState<string | undefined>(undefined);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  function validateStep(): FieldErrors {
    const errors: FieldErrors = {};
    if (name.trim().length < 2) {
      errors.name = 'Please enter your full name (at least 2 characters).';
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    return errors;
  }

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleFieldChange(field: keyof FieldErrors, value: string, setter: (v: string) => void) {
    setter(value);
    clearFieldError(field);
    if (error) dispatch(clearError());
  }

  async function handleContinue(e: FormEvent) {
    e.preventDefault();
    const errors = validateStep();
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    const result = await dispatch(register({ name: name.trim(), email: email.trim() }));
    if (register.fulfilled.match(result)) {
      setDevToken(result.payload.devToken);
      setResent(false);
      setStep(2);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      const res = await authService.resendVerification(email.trim());
      setDevToken(res.devToken);
      setResent(true);
    } catch {
      setResent(true);
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-black text-white mb-1 tracking-tight">
          {step === 1 ? 'Create your account' : 'Verify your email'}
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          {step === 1
            ? 'Tell us about yourself to get started'
            : `We sent a verification link to ${email}`}
        </p>

        {error && (
          <div className="mb-4">
            <ErrorMessage message={error} onDismiss={() => dispatch(clearError())} />
          </div>
        )}

        <div className="flex items-center gap-2 mb-6">
          <span
            className={`flex-1 h-1 rounded-full transition-colors ${
              step >= 1 ? 'bg-brand-500' : 'bg-white/10'
            }`}
          />
          <span
            className={`flex-1 h-1 rounded-full transition-colors ${
              step >= 2 ? 'bg-brand-500' : 'bg-white/10'
            }`}
          />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step-1"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleContinue}
              noValidate
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider"
                >
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => handleFieldChange('name', e.target.value, setName)}
                  aria-invalid={!!fieldErrors.name}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all text-sm ${
                    fieldErrors.name
                      ? 'border-red-500/60 focus:ring-red-500/40 focus:border-red-500/60'
                      : 'border-white/10 focus:ring-brand-500/50 focus:border-brand-500/50'
                  }`}
                  placeholder="John Doe"
                />
                {fieldErrors.name && (
                  <p className="text-red-400 text-xs mt-1.5" role="alert">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => handleFieldChange('email', e.target.value, setEmail)}
                  aria-invalid={!!fieldErrors.email}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all text-sm ${
                    fieldErrors.email
                      ? 'border-red-500/60 focus:ring-red-500/40 focus:border-red-500/60'
                      : 'border-white/10 focus:ring-brand-500/50 focus:border-brand-500/50'
                  }`}
                  placeholder="you@example.com"
                />
                {fieldErrors.email && (
                  <p className="text-red-400 text-xs mt-1.5" role="alert">
                    {fieldErrors.email}
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
                    <Spinner size="sm" /> Sending...
                  </>
                ) : (
                  <>
                    Continue <span className="inline-block transition-transform">→</span>
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckIcon className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Click <span className="font-semibold text-white">Verify Email</span> in the email
                  we just sent to <span className="font-semibold text-brand-400">{email}</span> to
                  set up your password.
                </p>
              </div>

              {devToken && (
                <div className="rounded-xl border border-dashed border-brand-500/40 bg-brand-500/[0.05] p-4">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-brand-300 mb-1.5">
                    Development link
                  </p>
                  <p className="text-xs text-gray-300 mb-2">
                    No mail server is configured, so here is the verification link:
                  </p>
                  <Link
                    to={`/verify-email?token=${encodeURIComponent(devToken)}`}
                    className="block w-full text-center py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white text-sm font-semibold transition-all"
                  >
                    Verify Email
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-gray-300 border border-white/10 hover:bg-white/5 disabled:opacity-60 transition-all"
              >
                {resending ? 'Sending...' : 'Resend email'}
              </button>
              {resent && (
                <p className="text-center text-xs text-emerald-400">
                  A new verification email has been sent.
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-xl text-sm font-semibold text-gray-300 border border-white/10 hover:bg-white/5 transition-all"
                >
                  Back
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-gray-400 text-sm">
          Already have an account?{' '}
          <Link
            to="/signin"
            className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
