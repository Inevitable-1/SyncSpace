import type { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { generateTokenPair, hashToken } from '../utils/tokens.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';

function setRefreshTokenCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: expiresAt,
    path: '/',
  });
}

function formatUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  avatar?: string;
  isEmailVerified: boolean;
}) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    isEmailVerified: user.isEmailVerified,
  };
}

export async function register(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: errors.mapped() });
    return;
  }

  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already in use', 409);
  }

  const user = await User.create({ name, email, password });

  const tokenPayload = { userId: user._id.toString(), email: user.email };
  const { accessToken, refreshToken, hashedRefreshToken, refreshExpiresAt } =
    generateTokenPair(tokenPayload);

  await RefreshToken.create({
    user: user._id,
    token: hashedRefreshToken,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip || '',
    expiresAt: refreshExpiresAt,
  });

  setRefreshTokenCookie(res, refreshToken, refreshExpiresAt);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user: formatUser(user), accessToken },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: errors.mapped() });
    return;
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const tokenPayload = { userId: user._id.toString(), email: user.email };
  const { accessToken, refreshToken, hashedRefreshToken, refreshExpiresAt } =
    generateTokenPair(tokenPayload);

  await RefreshToken.create({
    user: user._id,
    token: hashedRefreshToken,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip || '',
    expiresAt: refreshExpiresAt,
  });

  setRefreshTokenCookie(res, refreshToken, refreshExpiresAt);

  res.json({
    success: true,
    message: 'Login successful',
    data: { user: formatUser(user), accessToken },
  });
}

export async function demoLogin(req: Request, res: Response): Promise<void> {
  const DEMO_EMAIL = process.env.DEMO_EMAIL || 'alex@syncspace.demo';
  const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demo1234';

  let user = await User.findOne({ email: DEMO_EMAIL });

  if (!user) {
    user = await User.create({
      name: 'Alex Johnson',
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      avatar: '',
      isEmailVerified: true,
    });
  }

  const tokenPayload = { userId: user._id.toString(), email: user.email };
  const { accessToken, refreshToken, hashedRefreshToken, refreshExpiresAt } =
    generateTokenPair(tokenPayload);

  await RefreshToken.create({
    user: user._id,
    token: hashedRefreshToken,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip || '',
    expiresAt: refreshExpiresAt,
  });

  setRefreshTokenCookie(res, refreshToken, refreshExpiresAt);

  res.json({
    success: true,
    message: 'Demo login successful',
    data: { user: formatUser(user), accessToken },
  });
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.refreshToken;

  if (!token) {
    res.status(401).json({ success: false, message: 'Refresh token required' });
    return;
  }

  const hashedRefreshToken = hashToken(token);
  const storedToken = await RefreshToken.findOne({
    token: hashedRefreshToken,
    expiresAt: { $gt: new Date() },
  });

  if (!storedToken) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    return;
  }

  const user = await User.findById(storedToken.user);
  if (!user) {
    res.status(401).json({ success: false, message: 'User not found' });
    return;
  }

  await RefreshToken.deleteOne({ _id: storedToken._id });

  const tokenPayload = { userId: user._id.toString(), email: user.email };
  const {
    accessToken,
    refreshToken,
    hashedRefreshToken: newHashedToken,
    refreshExpiresAt,
  } = generateTokenPair(tokenPayload);

  await RefreshToken.create({
    user: user._id,
    token: newHashedToken,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip || '',
    expiresAt: refreshExpiresAt,
  });

  setRefreshTokenCookie(res, refreshToken, refreshExpiresAt);

  res.json({
    success: true,
    message: 'Token refreshed',
    data: { accessToken },
  });
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  const token = req.cookies?.refreshToken;

  if (token) {
    const hashedRefreshToken = hashToken(token);
    await RefreshToken.deleteOne({ token: hashedRefreshToken });
  }

  res.clearCookie('refreshToken', { path: '/' });

  res.json({ success: true, message: 'Logged out successfully' });
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const user = await User.findById(req.user.userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  res.json({ success: true, data: { user: formatUser(user) } });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: errors.mapped() });
    return;
  }

  const { email } = req.body;
  const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = hashedResetToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save({ validateModifiedOnly: true });

  res.json({
    success: true,
    message: 'If the email exists, a reset link has been sent',
    data: { resetToken },
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: errors.mapped() });
    return;
  }

  const { token, password } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await RefreshToken.deleteMany({ user: user._id });

  res.json({ success: true, message: 'Password reset successful' });
}
