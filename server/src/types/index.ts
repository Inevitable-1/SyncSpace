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

export interface IWorkspace {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isPublic: boolean;
  owner: string;
  members: string[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoom {
  _id: string;
  name: string;
  type: 'whiteboard' | 'code' | 'document';
  workspace: string | IWorkspace;
  owner: string;
  inviteCode: string;
  isActive: boolean;
  participants: string[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IActivity {
  _id: string;
  user: string;
  action: string;
  entityType: 'workspace' | 'room' | 'member' | 'auth';
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface INotification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType?: 'workspace' | 'room' | 'member' | 'activity';
  entityId?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
