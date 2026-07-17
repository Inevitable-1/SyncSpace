export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  isEmailVerified: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRefreshToken {
  _id: string;
  user: string;
  token: string;
  userAgent: string;
  ip: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}
