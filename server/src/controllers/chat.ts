import type { Response } from 'express';
import mongoose from 'mongoose';
import { ChatMessage } from '../models/ChatMessage.js';
import { Room } from '../models/Room.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';

export async function getMessages(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const roomId = String(req.params.roomId);
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const before = req.query.before as string | undefined;

  const room = await Room.findById(roomId);
  if (!room) {
    throw new AppError('Room not found', 404);
  }

  const query: Record<string, unknown> = {
    room: new mongoose.Types.ObjectId(roomId),
    isDeleted: { $ne: true },
  };

  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await ChatMessage.find(query)
    .populate('sender', 'name email avatar')
    .sort({ createdAt: -1 })
    .limit(limit);

  const populatedMessages = await ChatMessage.populate(messages, {
    path: 'replyTo',
    populate: { path: 'sender', select: 'name email avatar' },
  });

  res.json({
    success: true,
    data: { messages: populatedMessages.reverse() },
  });
}

export async function sendMessage(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const roomId = String(req.params.roomId);
  const { content, type, replyTo } = req.body;

  if (!content || !content.trim()) {
    throw new AppError('Message content is required', 400);
  }

  const room = await Room.findById(roomId);
  if (!room) {
    throw new AppError('Room not found', 404);
  }

  const message = await ChatMessage.create({
    room: new mongoose.Types.ObjectId(roomId),
    sender: new mongoose.Types.ObjectId(req.user.userId),
    content: content.trim(),
    type: type || 'text',
    replyTo: replyTo ? new mongoose.Types.ObjectId(replyTo) : undefined,
  });

  const populated = await message.populate('sender', 'name email avatar');

  res.status(201).json({
    success: true,
    data: { message: populated },
  });
}

export async function editMessage(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { messageId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    throw new AppError('Message content is required', 400);
  }

  const message = await ChatMessage.findById(messageId);
  if (!message) {
    throw new AppError('Message not found', 404);
  }

  if (message.sender.toString() !== req.user.userId) {
    throw new AppError('Not authorized to edit this message', 403);
  }

  message.content = content.trim();
  message.edited = true;
  message.editedAt = new Date();
  await message.save();

  const populated = await message.populate('sender', 'name email avatar');

  res.json({
    success: true,
    data: { message: populated },
  });
}

export async function deleteMessage(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { messageId } = req.params;

  const message = await ChatMessage.findById(messageId);
  if (!message) {
    throw new AppError('Message not found', 404);
  }

  if (message.sender.toString() !== req.user.userId) {
    throw new AppError('Not authorized to delete this message', 403);
  }

  message.isDeleted = true;
  message.deletedAt = new Date();
  await message.save();

  res.json({
    success: true,
    message: 'Message deleted',
  });
}

export async function markSeen(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const roomId = String(req.params.roomId);

  await ChatMessage.updateMany(
    {
      room: new mongoose.Types.ObjectId(roomId),
      sender: { $ne: new mongoose.Types.ObjectId(req.user.userId) },
      seenBy: { $ne: new mongoose.Types.ObjectId(req.user.userId) },
    },
    { $addToSet: { seenBy: new mongoose.Types.ObjectId(req.user.userId) } },
  );

  res.json({
    success: true,
    message: 'Messages marked as seen',
  });
}
