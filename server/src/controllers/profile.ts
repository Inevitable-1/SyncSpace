import type { Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Member } from '../models/Member.js';
import { Workspace } from '../models/Workspace.js';
import { Activity } from '../models/Activity.js';
import { Room } from '../models/Room.js';
import { Meeting } from '../models/Meeting.js';
import { UploadedFile } from '../models/UploadedFile.js';
import { Task } from '../models/Task.js';
import { Invite } from '../models/Invite.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';

function formatProfile(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  isEmailVerified: boolean;
}) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    coverImage: user.coverImage || '',
    bio: user.bio || '',
    isEmailVerified: user.isEmailVerified,
  };
}

function assertUser(req: AuthRequest): string {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }
  return req.user.userId;
}

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  const userId = assertUser(req);

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ success: true, data: { profile: formatProfile(user) } });
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  const userId = assertUser(req);

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const { name, avatar, bio, coverImage } = req.body;
  if (name !== undefined) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;
  if (bio !== undefined) user.bio = bio;
  if (coverImage !== undefined) user.coverImage = coverImage;

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated',
    data: { profile: formatProfile(user) },
  });
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  const userId = assertUser(req);

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new AppError('Current and new passwords are required', 400);
  }

  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401);
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
}

export async function deleteProfile(req: AuthRequest, res: Response): Promise<void> {
  const userId = assertUser(req);

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await Member.deleteMany({ userId: user._id });
  await Workspace.updateMany({ members: user._id }, { $pull: { members: user._id } });
  await User.findByIdAndDelete(user._id);

  res.clearCookie('refreshToken', { path: '/' });
  res.json({ success: true, message: 'Account deleted successfully' });
}

export async function getContributionScore(req: AuthRequest, res: Response): Promise<void> {
  const userId = assertUser(req);
  const uid = new mongoose.Types.ObjectId(userId);

  const [
    workspacesCreated,
    roomsCreated,
    filesUploaded,
    meetingsCreated,
    invitesSent,
    tasksCreated,
    totalActivities,
  ] = await Promise.all([
    Workspace.countDocuments({ owner: uid, isDeleted: { $ne: true } }),
    Room.countDocuments({ owner: uid, isDeleted: { $ne: true } }),
    UploadedFile.countDocuments({ uploader: uid, isDeleted: { $ne: true } }),
    Meeting.countDocuments({ host: uid, isDeleted: { $ne: true } }),
    Invite.countDocuments({ invitedBy: uid }),
    Task.countDocuments({ creator: uid, isDeleted: { $ne: true } }),
    Activity.countDocuments({ user: uid }),
  ]);

  const score =
    workspacesCreated * 10 +
    roomsCreated * 5 +
    filesUploaded * 2 +
    meetingsCreated * 5 +
    invitesSent * 3;

  const level = Math.floor(score / 50) + 1;
  const nextLevelAt = level * 50;
  const progress = score > 0 ? ((score % 50) / 50) * 100 : 0;

  const badges: string[] = [];
  if (workspacesCreated >= 1) badges.push('Workspace Creator');
  if (roomsCreated >= 3) badges.push('Room Master');
  if (filesUploaded >= 5) badges.push('File Sharer');
  if (meetingsCreated >= 3) badges.push('Meeting Organizer');
  if (tasksCreated >= 10) badges.push('Task Champion');
  if (totalActivities >= 20) badges.push('Active Contributor');
  if (invitesSent >= 5) badges.push('Team Builder');

  res.json({
    success: true,
    data: {
      score,
      level,
      nextLevelAt,
      progress,
      breakdown: {
        workspacesCreated,
        roomsCreated,
        filesUploaded,
        meetingsCreated,
        invitesSent,
      },
    },
  });
}

export async function getHeatmapData(req: AuthRequest, res: Response): Promise<void> {
  const userId = assertUser(req);
  const uid = new mongoose.Types.ObjectId(userId);

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const activities = await Activity.find({
    user: uid,
    createdAt: { $gte: twelveMonthsAgo },
  })
    .select('createdAt action')
    .lean();

  const heatmap: Record<string, number> = {};

  activities.forEach((a) => {
    const dateStr = new Date(a.createdAt).toISOString().split('T')[0];
    heatmap[dateStr] = (heatmap[dateStr] || 0) + 1;
  });

  const data = Object.entries(heatmap).map(([date, count]) => ({ date, count }));

  const totalContributions = activities.length;

  const recentActions = activities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((a) => ({
      action: a.action,
      date: a.createdAt,
    }));

  res.json({
    success: true,
    data: {
      heatmap: data,
      totalContributions,
      recentActions,
    },
  });
}

export async function getMonthlyCalendar(req: AuthRequest, res: Response): Promise<void> {
  const userId = assertUser(req);
  const uid = new mongoose.Types.ObjectId(userId);

  const now = new Date();
  const month =
    req.query.month !== undefined ? parseInt(req.query.month as string, 10) : now.getMonth();
  const year =
    req.query.year !== undefined ? parseInt(req.query.year as string, 10) : now.getFullYear();

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const activities = await Activity.find({
    user: uid,
    createdAt: { $gte: startDate, $lte: endDate },
  })
    .select('createdAt action entityType')
    .lean();

  const dailyCounts: Record<string, number> = {};
  const actionBreakdown: Record<string, number> = {};

  const daysInMonth = endDate.getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = new Date(year, month, d).toISOString().split('T')[0];
    dailyCounts[dateStr] = 0;
  }

  activities.forEach((a) => {
    const dateStr = new Date(a.createdAt).toISOString().split('T')[0];
    dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
    actionBreakdown[a.action] = (actionBreakdown[a.action] || 0) + 1;
  });

  const calendar = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));

  res.json({
    success: true,
    data: {
      month,
      year,
      totalActivities: activities.length,
      calendar,
      actionBreakdown,
    },
  });
}
