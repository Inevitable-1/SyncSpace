import type { MemberRole, MemberStatus } from '../models/Member.js';

export interface AddMemberDto {
  userId: string;
  role?: MemberRole;
}

export interface UpdateMemberRoleDto {
  role: MemberRole;
}

export interface MemberQueryDto {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  role?: MemberRole;
  status?: MemberStatus;
  search?: string;
}

export interface MemberResponseDto {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  workspaceId: string;
  role: MemberRole;
  status: MemberStatus;
  invitedBy?: string;
  joinedAt: Date;
  createdAt: Date;
}
