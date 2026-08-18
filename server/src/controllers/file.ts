import fs from 'fs';
import path from 'path';
import type { Response } from 'express';
import { UploadedFile } from '../models/UploadedFile.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';
import { logActivity } from './activity.js';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getFiles(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const workspaceId = req.query.workspaceId as string;
  if (!workspaceId) {
    throw new AppError('workspaceId is required', 400);
  }

  const folder = req.query.folder as string | undefined;
  const search = req.query.search as string | undefined;

  const query: Record<string, unknown> = {
    workspace: workspaceId,
    isDeleted: false,
  };

  if (folder) {
    query.folder = folder;
  }

  if (search) {
    query.name = { $regex: escapeRegex(search), $options: 'i' };
  }

  const files = await UploadedFile.find(query)
    .populate('uploader', 'name email avatar')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { files },
  });
}

export async function uploadFile(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const file = req.file;
  if (!file) {
    throw new AppError('No file provided', 400);
  }

  const { workspace, roomId, folder } = req.body;
  if (!workspace) {
    throw new AppError('Workspace ID is required', 400);
  }

  const uploaded = await UploadedFile.create({
    name: file.originalname,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    path: file.path,
    workspace,
    room: roomId || undefined,
    folder: folder || '/',
    uploader: req.user.userId,
  });

  await logActivity({
    userId: req.user.userId,
    action: 'uploaded file',
    entityType: 'file',
    entityId: uploaded._id.toString(),
    entityName: file.originalname,
  });

  const populated = await uploaded.populate('uploader', 'name email avatar');

  res.status(201).json({
    success: true,
    data: { file: populated },
  });
}

export async function downloadFile(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const file = await UploadedFile.findById(req.params.id);

  if (!file || file.isDeleted) {
    throw new AppError('File not found', 404);
  }

  const filePath = path.resolve(file.path);
  if (!fs.existsSync(filePath)) {
    throw new AppError('File not found on disk', 404);
  }

  res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
  res.setHeader('Content-Type', file.mimeType);

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) {
      throw new AppError('Error reading file', 500);
    }
  });
  stream.pipe(res);
}

export async function deleteFile(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const id = String(req.params.id);
  const file = await UploadedFile.findById(id);

  if (!file) {
    throw new AppError('File not found', 404);
  }

  file.isDeleted = true;
  file.deletedAt = new Date();
  await file.save();

  await logActivity({
    userId: req.user.userId,
    action: 'deleted file',
    entityType: 'file',
    entityId: file._id.toString(),
    entityName: file.name,
  });

  res.json({
    success: true,
    data: { message: 'File deleted' },
  });
}

export async function renameFile(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const id = String(req.params.id);
  const { name } = req.body;

  const file = await UploadedFile.findById(id);

  if (!file) {
    throw new AppError('File not found', 404);
  }

  file.name = name;
  await file.save();

  await logActivity({
    userId: req.user.userId,
    action: 'renamed file',
    entityType: 'file',
    entityId: file._id.toString(),
    entityName: name,
  });

  const populated = await file.populate('uploader', 'name email avatar');

  res.json({
    success: true,
    data: { file: populated },
  });
}

export async function getFolders(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const workspaceId = req.query.workspaceId as string;
  if (!workspaceId) {
    throw new AppError('workspaceId is required', 400);
  }

  const folders = await UploadedFile.distinct('folder', {
    workspace: workspaceId,
    isDeleted: false,
  });

  res.json({
    success: true,
    data: { folders },
  });
}

export async function uploadAvatar(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const file = req.file;
  if (!file) {
    throw new AppError('No file provided', 400);
  }

  const { User } = await import('../models/User.js');
  const user = await User.findById(req.user.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.avatar = `/uploads/${file.filename}`;
  await user.save();

  res.json({
    success: true,
    data: { url: `/uploads/${file.filename}` },
  });
}

export async function uploadCover(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const file = req.file;
  if (!file) {
    throw new AppError('No file provided', 400);
  }

  const { User } = await import('../models/User.js');
  const user = await User.findById(req.user.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.coverImage = `/uploads/${file.filename}`;
  await user.save();

  res.json({
    success: true,
    data: { url: `/uploads/${file.filename}` },
  });
}
