import type { Response } from 'express';
import mongoose from 'mongoose';
import { CodeDocument } from '../models/CodeDocument.js';
import { Room } from '../models/Room.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';

export async function getDocumentsByRoom(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const roomId = String(req.params.roomId);

  const room = await Room.findById(roomId);
  if (!room) {
    throw new AppError('Room not found', 404);
  }

  const documents = await CodeDocument.find({
    room: new mongoose.Types.ObjectId(roomId),
    isDeleted: { $ne: true },
  })
    .populate('createdBy', 'name email avatar')
    .populate('lastEditedBy', 'name email avatar')
    .sort({ path: 1 });

  res.json({
    success: true,
    data: { documents },
  });
}

export async function getDocumentById(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const document = await CodeDocument.findById(req.params.id)
    .populate('createdBy', 'name email avatar')
    .populate('lastEditedBy', 'name email avatar');

  if (!document || document.isDeleted) {
    throw new AppError('Document not found', 404);
  }

  res.json({
    success: true,
    data: { document },
  });
}

export async function createDocument(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { name, content, language, roomId, workspaceId, parentPath, isFolder } = req.body;

  if (!name || !name.trim()) {
    throw new AppError('Document name is required', 400);
  }

  if (!roomId) {
    throw new AppError('Room ID is required', 400);
  }

  if (!workspaceId) {
    throw new AppError('Workspace ID is required', 400);
  }

  const room = await Room.findById(roomId);
  if (!room) {
    throw new AppError('Room not found', 404);
  }

  const sanitizedParentPath = parentPath || '/';
  const docPath =
    sanitizedParentPath === '/' ? `/${name.trim()}` : `${sanitizedParentPath}/${name.trim()}`;

  const existing = await CodeDocument.findOne({
    room: new mongoose.Types.ObjectId(roomId),
    path: docPath,
    isDeleted: { $ne: true },
  });

  if (existing) {
    throw new AppError('A file or folder with this name already exists', 409);
  }

  const document = await CodeDocument.create({
    name: name.trim(),
    path: docPath,
    content: content || '',
    language: language || detectLanguage(name.trim()),
    room: new mongoose.Types.ObjectId(roomId),
    workspace: new mongoose.Types.ObjectId(workspaceId),
    createdBy: new mongoose.Types.ObjectId(req.user.userId),
    lastEditedBy: new mongoose.Types.ObjectId(req.user.userId),
    parentPath: sanitizedParentPath,
    isFolder: isFolder || false,
    versionTimestamps: [new Date()],
  });

  const populated = await document.populate('createdBy', 'name email avatar');

  res.status(201).json({
    success: true,
    data: { document: populated },
  });
}

export async function updateDocument(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const document = await CodeDocument.findById(req.params.id);
  if (!document || document.isDeleted) {
    throw new AppError('Document not found', 404);
  }

  const { content, name, language } = req.body;

  if (content !== undefined) {
    document.content = content;
    document.versionTimestamps.push(new Date());
  }

  if (name !== undefined && name.trim()) {
    document.name = name.trim();
    const parentDir = document.parentPath || '/';
    document.path = parentDir === '/' ? `/${name.trim()}` : `${parentDir}/${name.trim()}`;
  }

  if (language !== undefined) {
    document.language = language;
  }

  document.lastEditedBy = new mongoose.Types.ObjectId(req.user.userId);
  await document.save();

  const populated = await document.populate([
    { path: 'createdBy', select: 'name email avatar' },
    { path: 'lastEditedBy', select: 'name email avatar' },
  ]);

  res.json({
    success: true,
    data: { document: populated },
  });
}

export async function deleteDocument(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const document = await CodeDocument.findById(req.params.id);
  if (!document || document.isDeleted) {
    throw new AppError('Document not found', 404);
  }

  if (document.isFolder) {
    await CodeDocument.updateMany(
      {
        room: document.room,
        path: { $regex: `^${document.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` },
        isDeleted: { $ne: true },
      },
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
    );
  }

  document.isDeleted = true;
  document.deletedAt = new Date();
  await document.save();

  res.json({
    success: true,
    message: 'Document deleted',
  });
}

export async function renameDocument(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { name } = req.body;

  if (!name || !name.trim()) {
    throw new AppError('New name is required', 400);
  }

  const document = await CodeDocument.findById(req.params.id);
  if (!document || document.isDeleted) {
    throw new AppError('Document not found', 404);
  }

  const oldPath = document.path;
  const parentDir = document.parentPath || '/';
  const newPath = parentDir === '/' ? `/${name.trim()}` : `${parentDir}/${name.trim()}`;

  const existing = await CodeDocument.findOne({
    room: document.room,
    path: newPath,
    isDeleted: { $ne: true },
    _id: { $ne: document._id },
  });

  if (existing) {
    throw new AppError('A file or folder with this name already exists', 409);
  }

  if (document.isFolder) {
    const children = await CodeDocument.find({
      room: document.room,
      path: { $regex: `^${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` },
      isDeleted: { $ne: true },
    });

    for (const child of children) {
      const childNewPath = child.path.replace(oldPath, newPath);
      const childParentPath = child.parentPath?.replace(oldPath, newPath);
      child.path = childNewPath;
      if (childParentPath) child.parentPath = childParentPath;
      await child.save();
    }
  }

  document.name = name.trim();
  document.path = newPath;
  document.lastEditedBy = new mongoose.Types.ObjectId(req.user.userId);
  await document.save();

  const populated = await document.populate([
    { path: 'createdBy', select: 'name email avatar' },
    { path: 'lastEditedBy', select: 'name email avatar' },
  ]);

  res.json({
    success: true,
    data: { document: populated },
  });
}

function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    html: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
    tsconfig: 'json',
    jsconfig: 'json',
  };
  return langMap[ext] || 'plaintext';
}
