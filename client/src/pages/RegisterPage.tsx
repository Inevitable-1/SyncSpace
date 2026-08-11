import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { register, clearError } from '../features/auth/authSlice';
import type { AppDispatch } from '../store';
import type { RootState } from '../store';
import AuthLayout from '../components/AuthLayout';
import ErrorMessage from '../components/common/ErrorMessage';
import Spinner from '../components/common/Spinner';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (name.trim().length < 2) {
      errors.name = 'Please enter your full name (at least 2 characters).';
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    return errors;
  }

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    const result = await dispatch(register({ name: name.trim(), email: email.trim(), password }));
    if (register.fulfilled.match(result)) {
      navigate('/', { replace: true });
    }
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Create your account</h2>
        <p className="text-gray-400 text-sm mb-6">Start collaborating with your team today</p>

        {error && (
          <div className="mb-4">
            <ErrorMessage message={error} onDismiss={() => dispatch(clearError())} />
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearFieldError('name');
              }}
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
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError('email');
              }}
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
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError('password');
                clearFieldError('confirmPassword');
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
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearFieldError('confirmPassword');
              }}
              aria-invalid={!!fieldErrors.confirmPassword}
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all text-sm ${
                fieldErrors.confirmPassword
                  ? 'border-red-500/60 focus:ring-red-500/40 focus:border-red-500/60'
                  : 'border-white/10 focus:ring-brand-500/50 focus:border-brand-500/50'
              }`}
              placeholder="Repeat your password"
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
                <Spinner size="sm" /> Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400 text-sm">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
