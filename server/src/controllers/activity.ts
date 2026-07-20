import type { Response } from 'express';
import { Activity } from '../models/Activity.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';

export async function logActivity(data: {
  userId: string;
  action: string;
  entityType: 'workspace' | 'room' | 'member' | 'auth';
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await Activity.create({
    user: data.userId,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    entityName: data.entityName,
    metadata: data.metadata,
  });
}

export async function getActivities(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { entityType, limit: limitParam } = req.query;
  const query: Record<string, unknown> = { user: req.user.userId };

  if (entityType && typeof entityType === 'string') {
    query.entityType = entityType;
  }

  const limit = limitParam ? Math.min(Number(limitParam), 100) : 50;

  const activities = await Activity.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name email avatar');

  res.json({
    success: true,
    data: { activities },
  });
}

export async function deleteActivity(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const activity = await Activity.findById(req.params.id);

  if (!activity) {
    throw new AppError('Activity not found', 404);
  }

  if (activity.user.toString() !== req.user.userId) {
    throw new AppError('Not authorized', 403);
  }

  await Activity.deleteOne({ _id: activity._id });

  res.json({ success: true, message: 'Activity deleted' });
}

export async function clearActivities(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  await Activity.deleteMany({ user: req.user.userId });

  res.json({ success: true, message: 'All activities cleared' });
}
