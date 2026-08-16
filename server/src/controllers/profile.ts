import type { Response } from 'express';
import { User } from '../models/User.js';
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
