import type { InviteRole, InviteStatus } from '../models/Invite.js';

export interface CreateInviteDto {
  email: string;
  role?: InviteRole;
}

export interface InviteQueryDto {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  status?: InviteStatus;
  search?: string;
}

export interface InviteResponseDto {
  _id: string;
  email: string;
  workspaceId: string;
  invitedBy: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  role: InviteRole;
  status: InviteStatus;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}
