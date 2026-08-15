import type { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import { User, type IUserDocument } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { generateTokenPair, hashToken } from '../utils/tokens.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';
import { sendVerificationEmail } from '../services/mailService.js';

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

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

async function issueTokens(user: IUserDocument, req: Request, res: Response): Promise<string> {
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
  return accessToken;
}

function randomPassword(): string {
  return crypto.randomBytes(24).toString('hex');
}

function issueVerificationToken(): { raw: string; hashed: string; expiresAt: Date } {
  const raw = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
  return { raw, hashed, expiresAt };
}

// Step 1: collect name + email, create a pending user and email a verification
// link. The account is only completed once the password is set on
// /verify-email?token=... (see setPassword below).
export async function register(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: errors.mapped() });
    return;
  }

  const { name, email } = req.body;

  const existing = await User.findOne({ email }).select(
    '+emailVerificationToken +emailVerificationExpires',
  );
  if (existing && existing.isEmailVerified) {
    throw new AppError('An account with this email already exists. Please sign in.', 409);
  }

  const { raw, hashed, expiresAt } = issueVerificationToken();

  let user: IUserDocument;
  if (existing) {
    // Pending registration for this email — refresh the link and name.
    existing.name = name;
    existing.emailVerificationToken = hashed;
    existing.emailVerificationExpires = expiresAt;
    await existing.save({ validateModifiedOnly: true });
    user = existing;
  } else {
    user = await User.create({
      name,
      email,
      emailVerificationToken: hashed,
      emailVerificationExpires: expiresAt,
    });
  }

  await sendVerificationEmail(user.email, user.name, raw);

  const devPayload: { email: string; devToken?: string } = { email: user.email };
  if (process.env.NODE_ENV !== 'production') {
    devPayload.devToken = raw;
  }

  res.status(201).json({
    success: true,
    message: 'Verification email sent',
    data: devPayload,
  });
}

// Validates the email-verification link so the password setup page can greet the
// user and reject invalid/expired links up front. Does not consume the token.
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const token = String(req.params.token || '');

  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user || user.isEmailVerified) {
    throw new AppError('Invalid or expired verification link', 400);
  }

  res.json({ success: true, data: { name: user.name, email: user.email } });
}

// Final step: set the password, mark the email verified and complete the
// account. The user is NOT signed in automatically — they are sent to /signin.
export async function setPassword(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: errors.mapped() });
    return;
  }

  const { token, password } = req.body;
  const hashed = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    throw new AppError('Invalid or expired verification link', 400);
  }

  user.password = password;
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Account created successfully',
    data: { email: user.email },
  });
}

export async function resendVerification(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: errors.mapped() });
    return;
  }

  const { email } = req.body;
  const user = await User.findOne({ email }).select(
    '+emailVerificationToken +emailVerificationExpires',
  );

  if (!user || user.isEmailVerified) {
    res.json({ success: true, message: 'If the email exists, a verification link has been sent' });
    return;
  }

  const { raw, hashed, expiresAt } = issueVerificationToken();
  user.emailVerificationToken = hashed;
  user.emailVerificationExpires = expiresAt;
  await user.save({ validateModifiedOnly: true });

  await sendVerificationEmail(user.email, user.name, raw);

  const devPayload: { email: string; devToken?: string } = { email: user.email };
  if (process.env.NODE_ENV !== 'production') {
    devPayload.devToken = raw;
  }

  res.json({
    success: true,
    message: 'Verification email sent',
    data: devPayload,
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

  // A pending account (email not yet verified) has no password set yet, so it
  // cannot authenticate until the verification link flow completes.
  if (!user.isEmailVerified) {
    throw new AppError('Please verify your email before signing in', 403);
  }

  if (!(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const accessToken = await issueTokens(user, req, res);

  res.json({
    success: true,
    message: 'Login successful',
    data: { user: formatUser(user), accessToken },
  });
}

export async function demoLogin(req: Request, res: Response): Promise<void> {
  const DEMO_EMAIL = process.env.DEMO_EMAIL || 'mr.manojmanu05@gmail.com';

  let user = await User.findOne({ email: DEMO_EMAIL });

  if (!user) {
    user = await User.create({
      name: 'Manoj Kumar',
      email: DEMO_EMAIL,
      password: randomPassword(),
      avatar: '',
      isEmailVerified: true,
    });
  }

  const accessToken = await issueTokens(user, req, res);

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
    // The refresh token is invalid or already consumed. Drop the stale cookie so
    // the client stops retrying with it and falls back to a clean sign-in.
    res.clearCookie('refreshToken', { path: '/' });
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    return;
  }

  const user = await User.findById(storedToken.user);
  if (!user) {
    res.clearCookie('refreshToken', { path: '/' });
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
