import type { Response } from 'express';
import { Workspace } from '../models/Workspace.js';
import { Room } from '../models/Room.js';
import { UploadedFile } from '../models/UploadedFile.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';

export async function getSharedWorkspaces(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError('Not authenticated', 401);
  const userId = req.user.userId;

  const workspaces = await Workspace.find({
    isDeleted: { $ne: true },
    $or: [{ owner: userId }, { members: userId }],
  })
    .populate('owner', 'name email avatar')
    .sort({ updatedAt: -1 });

  const shared = workspaces.filter((ws) => ws.owner._id.toString() !== userId);

  res.json({ success: true, data: { workspaces: shared } });
}

export async function getSharedRooms(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError('Not authenticated', 401);
  const userId = req.user.userId;

  const rooms = await Room.find({
    isDeleted: { $ne: true },
    owner: { $ne: userId },
    participants: userId,
  })
    .populate('workspace', 'name color')
    .populate('owner', 'name email avatar')
    .sort({ updatedAt: -1 });

  res.json({ success: true, data: { rooms } });
}

export async function getSharedFiles(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError('Not authenticated', 401);
  const userId = req.user.userId;

  const files = await UploadedFile.find({
    isDeleted: { $ne: true },
    uploader: { $ne: userId },
  })
    .populate('uploader', 'name email avatar')
    .populate('workspace', 'name')
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ success: true, data: { files } });
}
