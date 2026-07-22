import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { memberService } from '../services/memberService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { MemberRole } from '../models/Member.js';
import type { MemberStatus } from '../models/Member.js';

export const addMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const { userId, role } = req.body;
  const member = await memberService.addMember(id, req.user!.userId, userId, role);
  res.status(201).json({ success: true, data: member });
});

export const removeMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const memberId = String(req.params.memberId);
  const result = await memberService.removeMember(id, req.user!.userId, memberId);
  res.json({ success: true, data: result });
});

export const getMembers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const { page, limit, sort, order, role, status } = req.query;

  const members = await memberService.getMembersWithPagination(id, {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    sort: sort as string,
    order: order as 'asc' | 'desc',
    role: role as MemberRole | undefined,
    status: status as MemberStatus | undefined,
  });

  res.json({ success: true, data: members });
});

export const updateMemberRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const memberId = String(req.params.memberId);
  const { role } = req.body;
  const member = await memberService.updateMemberRole(id, req.user!.userId, memberId, role);
  res.json({ success: true, data: member });
});

export const suspendMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const memberId = String(req.params.memberId);
  const member = await memberService.suspendMember(id, req.user!.userId, memberId);
  res.json({ success: true, data: member });
});

export const reactivateMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const memberId = String(req.params.memberId);
  const member = await memberService.reactivateMember(id, req.user!.userId, memberId);
  res.json({ success: true, data: member });
});

export const getMemberStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const stats = await memberService.getMemberStats(id);
  res.json({ success: true, data: stats });
});
