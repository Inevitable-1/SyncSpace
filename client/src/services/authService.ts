import api from './api';
import { demo, noop, demoAuth } from './demo';
import type {
  LoginRequest,
  RegisterRequest,
  SetPasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  RegisterResponse,
  VerifyEmailResponse,
  ResendVerificationResponse,
} from '../types';

export const authService = {
  // Step 1 of sign-up: name + email. Sends a verification email; the account is
  // only completed once the password is set from the emailed link. Real API only
  // (never falls back to demo data).
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return api.post('/auth/register', data).then((response) => response.data.data);
  },

  // Validates the email-verification link so the password setup page can load.
  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    return api
      .get(`/auth/verify-email/${encodeURIComponent(token)}`)
      .then((response) => response.data.data);
  },

  // Final step of sign-up: set the password and complete the account.
  async setPassword(data: SetPasswordRequest): Promise<{ email: string }> {
    return api.post('/auth/set-password', data).then((response) => response.data.data);
  },

  async resendVerification(email: string): Promise<ResendVerificationResponse> {
    return api.post('/auth/resend-verification', { email }).then((response) => response.data.data);
  },

  // Validates an existing session on page load and returns the freshest user
  // record. Never falls back to demo data — used only for real accounts.
  async getMe(): Promise<AuthResponse['user']> {
    return api.get('/auth/me').then((response) => response.data.data.user);
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    return demo(
      () => api.post('/auth/login', data).then((response) => response.data.data),
      () => demoAuth(),
    );
  },

  async demoLogin(): Promise<AuthResponse> {
    return Promise.resolve(demoAuth());
  },

  async logout(): Promise<void> {
    await noop(() => api.post('/auth/logout'));
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ resetToken: string }> {
    return demo(
      () => api.post('/auth/forgot-password', data).then((response) => response.data.data),
      () => ({ resetToken: 'demo-reset-token' }),
    );
  },

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await noop(() => api.post('/auth/reset-password', data));
  },
};
