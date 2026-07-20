import type { Response } from 'express';
import { Notification } from '../models/Notification.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';

export async function logNotification(data: {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  entityType?: 'workspace' | 'room' | 'member' | 'activity';
  entityId?: string;
}) {
  try {
    await Notification.create({
      user: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      entityType: data.entityType,
      entityId: data.entityId,
    });
  } catch {
    // notification logging should not block main operations
  }
}

export async function getNotifications(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

  const notifications = await Notification.find({ user: req.user.userId })
    .sort({ createdAt: -1 })
    .limit(limit);

  const unreadCount = await Notification.countDocuments({
    user: req.user.userId,
    isRead: false,
  });

  res.json({
    success: true,
    data: { notifications, unreadCount },
  });
}

export async function markAsRead(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  if (notification.user.toString() !== req.user.userId) {
    throw new AppError('Not authorized', 403);
  }

  notification.isRead = true;
  await notification.save();

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: { notification },
  });
}

export async function markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  await Notification.updateMany({ user: req.user.userId, isRead: false }, { isRead: true });

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
}

export async function deleteNotification(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  if (notification.user.toString() !== req.user.userId) {
    throw new AppError('Not authorized', 403);
  }

  await Notification.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Notification deleted',
  });
}

export async function clearAll(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  await Notification.deleteMany({ user: req.user.userId });

  res.json({
    success: true,
    message: 'All notifications cleared',
  });
}
