import api from './api';
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
  // only completed once the password is set from the emailed link.
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
  // record.
  async getMe(): Promise<AuthResponse['user']> {
    return api.get('/auth/me').then((response) => response.data.data.user);
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    return api.post('/auth/login', data).then((response) => response.data.data);
  },

  async demoLogin(): Promise<AuthResponse> {
    return api.post('/auth/demo').then((response) => response.data.data);
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ resetToken: string }> {
    return api.post('/auth/forgot-password', data).then((response) => response.data.data);
  },

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await api.post('/auth/reset-password', data);
  },
};
