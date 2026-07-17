import api from './api';
import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
} from '../types';

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    return response.data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<{ user: AuthResponse['user'] }> {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ resetToken: string }> {
    const response = await api.post('/auth/forgot-password', data);
    return response.data.data;
  },

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await api.post('/auth/reset-password', data);
  },
};
