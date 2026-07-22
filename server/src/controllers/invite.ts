import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { inviteService } from '../services/inviteService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { InviteStatus } from '../models/Invite.js';

export const createInvite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const { email, role } = req.body;
  const invite = await inviteService.createInvite(id, req.user!.userId, email, role);
  res.status(201).json({ success: true, data: invite });
});

export const getInvites = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const { page, limit, sort, order, status, search } = req.query;

  const invites = await inviteService.getInvitesWithPagination(id, {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    sort: sort as string,
    order: order as 'asc' | 'desc',
    status: status as InviteStatus | undefined,
    search: search as string,
  });

  res.json({ success: true, data: invites });
});

export const acceptInvite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = String(req.params.token);
  const result = await inviteService.acceptInvite(token, req.user!.userId, req.user!.email);
  res.json({ success: true, data: result });
});

export const declineInvite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = String(req.params.token);
  const result = await inviteService.declineInvite(token, req.user!.userId, req.user!.email);
  res.json({ success: true, data: result });
});

export const revokeInvite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const inviteId = String(req.params.inviteId);
  const result = await inviteService.revokeInvite(id, req.user!.userId, inviteId);
  res.json({ success: true, data: result });
});

export const getPendingInvites = asyncHandler(async (req: AuthRequest, res: Response) => {
  const invites = await inviteService.getPendingInvitesForUser(req.user!.email);
  res.json({ success: true, data: invites });
});

export const getInviteStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const stats = await inviteService.getInviteStats(id);
  res.json({ success: true, data: stats });
});
