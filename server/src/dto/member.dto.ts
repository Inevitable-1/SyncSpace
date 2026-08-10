import type { MemberRole, MemberStatus } from '../models/Member.js';

export interface MemberQueryDto {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  role?: MemberRole;
  status?: MemberStatus;
  search?: string;
}
