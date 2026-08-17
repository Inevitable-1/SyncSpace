import type { Response } from 'express';
import { User } from '../models/User.js';
import { Member } from '../models/Member.js';
import { Workspace } from '../models/Workspace.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';

function formatProfile(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  isEmailVerified: boolean;
}) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
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

  const { name, avatar, bio } = req.body;
  if (name !== undefined) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;
  if (bio !== undefined) user.bio = bio;

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

  // Remove user from all workspaces they are a member of
  await Member.deleteMany({ userId: user._id });

  // Remove user from workspace members arrays
  await Workspace.updateMany({ members: user._id }, { $pull: { members: user._id } });

  // Delete the user
  await User.findByIdAndDelete(user._id);

  res.clearCookie('refreshToken', { path: '/' });

  res.json({ success: true, message: 'Account deleted successfully' });
}
