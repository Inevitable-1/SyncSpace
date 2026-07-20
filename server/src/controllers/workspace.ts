import type { Response } from 'express';
import { Workspace } from '../models/Workspace.js';
import { Room } from '../models/Room.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';
import { logActivity } from './activity.js';
import { logNotification } from './notification.js';

export async function createWorkspace(req: AuthRequest, res: Response): Promise<void> {
  const { name, description, color, icon, isPublic } = req.body;

  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const workspace = await Workspace.create({
    name,
    description: description || '',
    color: color || '#6366f1',
    icon: icon || '',
    isPublic: isPublic || false,
    owner: req.user.userId,
    members: [req.user.userId],
  });

  await logActivity({
    userId: req.user.userId,
    action: 'created workspace',
    entityType: 'workspace',
    entityId: workspace._id.toString(),
    entityName: workspace.name,
  });

  await logNotification({
    userId: req.user.userId,
    title: 'Workspace Created',
    message: `You created "${workspace.name}"`,
    type: 'success',
    entityType: 'workspace',
    entityId: workspace._id.toString(),
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

  const userId = req.user.userId;
  const workspaces = await Workspace.find({
    isDeleted: { $ne: true },
    $or: [{ owner: userId }, { members: userId }],
  }).sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: { workspaces },
  });
}

export async function getWorkspace(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const workspace = await Workspace.findById(req.params.id);

  if (!workspace || workspace.isDeleted) {
    throw new AppError('Workspace not found', 404);
  }

  const userId = req.user.userId;
  const isMember =
    workspace.owner.toString() === userId || workspace.members.some((m) => m.toString() === userId);

  if (!isMember) {
    throw new AppError('Not authorized', 403);
  }

  const roomCount = await Room.countDocuments({
    workspace: workspace._id,
    isDeleted: { $ne: true },
  });

  res.json({
    success: true,
    data: { workspace, roomCount },
  });
}

export async function updateWorkspace(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const workspace = await Workspace.findById(req.params.id);

  if (!workspace || workspace.isDeleted) {
    throw new AppError('Workspace not found', 404);
  }

  if (workspace.owner.toString() !== req.user.userId) {
    throw new AppError('Only the owner can update this workspace', 403);
  }

  const { name, description, color, icon, isPublic } = req.body;
  if (name !== undefined) workspace.name = name;
  if (description !== undefined) workspace.description = description;
  if (color !== undefined) workspace.color = color;
  if (icon !== undefined) workspace.icon = icon;
  if (isPublic !== undefined) workspace.isPublic = isPublic;

  await workspace.save();

  await logActivity({
    userId: req.user.userId,
    action: 'updated workspace',
    entityType: 'workspace',
    entityId: workspace._id.toString(),
    entityName: workspace.name,
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

  const workspace = await Workspace.findById(req.params.id);

  if (!workspace || workspace.isDeleted) {
    throw new AppError('Workspace not found', 404);
  }

  if (workspace.owner.toString() !== req.user.userId) {
    throw new AppError('Only the owner can delete this workspace', 403);
  }

  workspace.isDeleted = true;
  workspace.deletedAt = new Date();
  await workspace.save();

  await Room.updateMany({ workspace: workspace._id }, { isDeleted: true, deletedAt: new Date() });

  await logActivity({
    userId: req.user.userId,
    action: 'deleted workspace',
    entityType: 'workspace',
    entityId: workspace._id.toString(),
    entityName: workspace.name,
  });

  res.json({
    success: true,
    message: 'Workspace deleted',
  });
}

export async function restoreWorkspace(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const workspace = await Workspace.findById(req.params.id);

  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  if (workspace.owner.toString() !== req.user.userId) {
    throw new AppError('Not authorized', 403);
  }

  workspace.isDeleted = false;
  workspace.deletedAt = undefined;
  await workspace.save();

  await Room.updateMany({ workspace: workspace._id }, { isDeleted: false, deletedAt: null });

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

  const userId = req.user.userId;
  const workspaces = await Workspace.find({
    isDeleted: true,
    owner: userId,
  }).sort({ deletedAt: -1 });

  const rooms = await Room.find({
    isDeleted: true,
    owner: userId,
  }).sort({ deletedAt: -1 });

  res.json({
    success: true,
    data: { workspaces, rooms },
  });
}

export async function searchWorkspaces(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { q } = req.query;
  const filter: Record<string, unknown> = {
    isDeleted: { $ne: true },
    $or: [{ owner: req.user.userId }, { members: req.user.userId }],
  };

  if (q && typeof q === 'string') {
    filter.name = { $regex: q, $options: 'i' };
  }

  const workspaces = await Workspace.find(filter).sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: { workspaces },
  });
}

export async function addMember(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { userId: memberUserId } = req.body;
  const workspace = await Workspace.findById(req.params.id);

  if (!workspace || workspace.isDeleted) {
    throw new AppError('Workspace not found', 404);
  }

  if (workspace.owner.toString() !== req.user.userId) {
    throw new AppError('Only the owner can add members', 403);
  }

  if (workspace.members.some((m) => m.toString() === memberUserId)) {
    throw new AppError('User is already a member', 409);
  }

  workspace.members.push(memberUserId);
  await workspace.save();

  await logActivity({
    userId: req.user.userId,
    action: 'added member to workspace',
    entityType: 'member',
    entityId: workspace._id.toString(),
    entityName: workspace.name,
  });

  await logNotification({
    userId: memberUserId,
    title: 'Added to Workspace',
    message: `You were added to "${workspace.name}"`,
    type: 'info',
    entityType: 'workspace',
    entityId: workspace._id.toString(),
  });

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

  const workspace = await Workspace.findById(req.params.id);

  if (!workspace || workspace.isDeleted) {
    throw new AppError('Workspace not found', 404);
  }

  if (workspace.owner.toString() !== req.user.userId) {
    throw new AppError('Only the owner can remove members', 403);
  }

  workspace.members = workspace.members.filter((m) => m.toString() !== req.params.memberId);
  await workspace.save();

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

  const workspace = await Workspace.findById(req.params.id).populate(
    'members',
    'name email avatar',
  );

  if (!workspace || workspace.isDeleted) {
    throw new AppError('Workspace not found', 404);
  }

  res.json({
    success: true,
    data: { members: workspace.members, owner: workspace.owner },
  });
}
