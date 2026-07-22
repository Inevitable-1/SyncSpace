import type { Response } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';
import { workspaceService } from '../services/workspaceService.js';

export async function createWorkspace(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { name, description, color, icon, isPublic } = req.body;
  const workspace = await workspaceService.create(req.user.userId, {
    name,
    description,
    color,
    icon,
    isPublic,
  });

  res.status(201).json({
    success: true,
    message: 'Workspace created',
    data: { workspace },
  });
}

export async function getWorkspaces(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const workspaces = await workspaceService.getAll(req.user.userId);

  res.json({
    success: true,
    data: { workspaces },
  });
}

export async function getWorkspace(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const workspaceId = req.params.id as string;
  const { workspace, roomCount } = await workspaceService.getOne(workspaceId, req.user.userId);

  res.json({
    success: true,
    data: { workspace, roomCount },
  });
}

export async function updateWorkspace(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const workspaceId = req.params.id as string;
  const { name, description, color, icon, isPublic } = req.body;
  const workspace = await workspaceService.update(workspaceId, req.user.userId, {
    name,
    description,
    color,
    icon,
    isPublic,
  });

  res.json({
    success: true,
    message: 'Workspace updated',
    data: { workspace },
  });
}

export async function deleteWorkspace(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const workspaceId = req.params.id as string;
  await workspaceService.delete(workspaceId, req.user.userId);

  res.json({
    success: true,
    message: 'Workspace deleted',
  });
}

export async function restoreWorkspace(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const workspaceId = req.params.id as string;
  const workspace = await workspaceService.restore(workspaceId, req.user.userId);

  res.json({
    success: true,
    message: 'Workspace restored',
    data: { workspace },
  });
}

export async function getTrash(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const data = await workspaceService.getTrash(req.user.userId);

  res.json({
    success: true,
    data,
  });
}

export async function searchWorkspaces(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { q } = req.query;
  const workspaces = await workspaceService.search(req.user.userId, q as string | undefined);

  res.json({
    success: true,
    data: { workspaces },
  });
}

export async function addMember(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const workspaceId = req.params.id as string;
  const { userId: memberUserId } = req.body;
  const workspace = await workspaceService.addMember(workspaceId, req.user.userId, memberUserId);

  res.json({
    success: true,
    message: 'Member added',
    data: { workspace },
  });
}

export async function removeMember(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const workspaceId = req.params.id as string;
  const memberId = req.params.memberId as string;
  const workspace = await workspaceService.removeMember(workspaceId, req.user.userId, memberId);

  res.json({
    success: true,
    message: 'Member removed',
    data: { workspace },
  });
}

export async function getMembers(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const workspaceId = req.params.id as string;
  const data = await workspaceService.getMembers(workspaceId);

  res.json({
    success: true,
    data,
  });
}

export async function regenerateInviteCode(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const workspaceId = req.params.id as string;
  const inviteCode = await workspaceService.regenerateInviteCode(workspaceId, req.user.userId);

  res.json({
    success: true,
    message: 'Invite code regenerated',
    data: { inviteCode },
  });
}

export async function joinByInviteCode(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { inviteCode } = req.body;
  if (!inviteCode) {
    throw new AppError('Invite code is required', 400);
  }

  const workspace = await workspaceService.joinByInviteCode(inviteCode, req.user.userId);

  res.json({
    success: true,
    message: 'Joined workspace',
    data: { workspace },
  });
}
