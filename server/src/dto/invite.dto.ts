import type { InviteStatus } from '../models/Invite.js';

export interface InviteQueryDto {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  status?: InviteStatus;
  search?: string;
}
