import type { Response } from 'express';
import { Workspace } from '../models/Workspace.js';
import { Room } from '../models/Room.js';
import { Meeting } from '../models/Meeting.js';
import { Member } from '../models/Member.js';
import { Activity } from '../models/Activity.js';
import { Notification } from '../models/Notification.js';
import { Task } from '../models/Task.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';

function assertUser(req: AuthRequest): string {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }
  return req.user.userId;
}

export async function getDashboard(req: AuthRequest, res: Response): Promise<void> {
  const userId = assertUser(req);

  const [
    totalWorkspaces,
    totalRooms,
    totalMeetings,
    memberCount,
    totalActivities,
    unreadNotifications,
    totalTasks,
  ] = await Promise.all([
    Workspace.countDocuments({
      isDeleted: { $ne: true },
      $or: [{ owner: userId }, { members: userId }],
    }),
    Room.countDocuments({
      isDeleted: { $ne: true },
      $or: [{ owner: userId }, { participants: userId }],
    }),
    Meeting.countDocuments({
      isDeleted: { $ne: true },
      $or: [{ host: userId }, { participants: userId }],
    }),
    Member.countDocuments({ workspaceId: { $ne: null } }),
    Activity.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, isRead: { $ne: true } }),
    Task.countDocuments({
      isDeleted: { $ne: true },
      $or: [{ creator: userId }, { assignee: userId }],
    }),
  ]);

  const [recentActivity, upcomingMeetings] = await Promise.all([
    Activity.find({ user: userId })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(10),
    Meeting.find({
      isDeleted: { $ne: true },
      status: 'scheduled',
      scheduledAt: { $gte: new Date() },
      $or: [{ host: userId }, { participants: userId }],
    })
      .populate('host', 'name email avatar')
      .populate('workspace', 'name color')
      .sort({ scheduledAt: 1 })
      .limit(5),
  ]);

  res.json({
    success: true,
    data: {
      counts: {
        workspaces: totalWorkspaces,
        rooms: totalRooms,
        meetings: totalMeetings,
        members: memberCount,
        activities: totalActivities,
        unreadNotifications,
        tasks: totalTasks,
      },
      recentActivity,
      upcomingMeetings,
    },
  });
}
