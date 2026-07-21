import type { Response } from 'express';
import { Whiteboard } from '../models/Whiteboard.js';
import { Room } from '../models/Room.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';

export async function getWhiteboard(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const roomIdParam = req.params.roomId as string;
  const room = await Room.findById(roomIdParam);

  if (!room || room.isDeleted) {
    throw new AppError('Room not found', 404);
  }

  let whiteboard = await Whiteboard.findOne({ roomId: roomIdParam });

  if (!whiteboard) {
    whiteboard = await Whiteboard.create({
      roomId: roomIdParam,
      objects: [],
      createdBy: req.user.userId,
    });
  }

  res.json({
    success: true,
    data: { whiteboard },
  });
}

export async function saveWhiteboard(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { objects } = req.body;

  if (!Array.isArray(objects)) {
    throw new AppError('Objects must be an array', 400);
  }

  const roomIdParam = req.params.roomId as string;

  const whiteboard = await Whiteboard.findOneAndUpdate(
    { roomId: roomIdParam },
    { objects, createdBy: req.user.userId },
    { new: true, upsert: true },
  );

  res.json({
    success: true,
    message: 'Whiteboard saved',
    data: { whiteboard },
  });
}
