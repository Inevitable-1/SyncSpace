import api from './api';
import { demo, noop, demoAuth } from './demo';
import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
} from '../types';

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return demo(
      () => api.post('/auth/register', data).then((response) => response.data.data),
      () => demoAuth(),
    );
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    return demo(
      () => api.post('/auth/login', data).then((response) => response.data.data),
      () => demoAuth(),
    );
  },

  async demoLogin(): Promise<AuthResponse> {
    return demo(
      () => api.post('/auth/demo').then((response) => response.data.data),
      () => demoAuth(),
    );
  },

  async logout(): Promise<void> {
    await noop(() => api.post('/auth/logout'));
  },

  async getMe(): Promise<{ user: AuthResponse['user'] }> {
    return demo(
      () => api.get('/auth/me').then((response) => response.data.data),
      () => ({ user: demoAuth().user }),
    );
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
