import type { Response } from 'express';
import mongoose from 'mongoose';
import { Meeting } from '../models/Meeting.js';
import { Workspace } from '../models/Workspace.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';
import { logActivity } from './activity.js';
import { logNotification } from './notification.js';

function assertUser(req: AuthRequest): string {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }
  return req.user.userId;
}

export async function getMeetings(req: AuthRequest, res: Response): Promise<void> {
  const userId = assertUser(req);
  const { workspaceId } = req.query;

  const query: Record<string, unknown> = {
    isDeleted: { $ne: true },
    $or: [{ host: userId }, { participants: userId }],
  };

  if (workspaceId) {
    query.workspace = new mongoose.Types.ObjectId(String(workspaceId));
  }

  const meetings = await Meeting.find(query)
    .populate('host', 'name email avatar')
    .populate('participants', 'name email avatar')
    .populate('workspace', 'name color')
    .sort({ scheduledAt: 1 });

  res.json({ success: true, data: { meetings } });
}

export async function getWorkspaceMeetings(req: AuthRequest, res: Response): Promise<void> {
  const userId = assertUser(req);
  const workspaceId = req.params.id as string;

  const ws = await Workspace.findById(workspaceId);
  if (!ws || ws.isDeleted) {
    throw new AppError('Workspace not found', 404);
  }

  const isMember =
    ws.owner.toString() === userId || ws.members.some((m) => m.toString() === userId);
  if (!isMember) {
    throw new AppError('Not authorized', 403);
  }

  const meetings = await Meeting.find({ workspace: workspaceId, isDeleted: { $ne: true } })
    .populate('host', 'name email avatar')
    .populate('participants', 'name email avatar')
    .populate('workspace', 'name color')
    .sort({ scheduledAt: 1 });

  res.json({ success: true, data: { meetings } });
}

export async function getMeeting(req: AuthRequest, res: Response): Promise<void> {
  const userId = assertUser(req);
  const meeting = await Meeting.findById(req.params.id)
    .populate('host', 'name email avatar')
    .populate('participants', 'name email avatar')
    .populate('workspace', 'name color');

  if (!meeting || meeting.isDeleted) {
    throw new AppError('Meeting not found', 404);
  }

  const isInvolved =
    meeting.host._id.toString() === userId ||
    meeting.participants.some((p) => p._id.toString() === userId);

  if (!isInvolved) {
    throw new AppError('Not authorized to view this meeting', 403);
  }

  res.json({ success: true, data: { meeting } });
}

export async function createMeeting(req: AuthRequest, res: Response): Promise<void> {
  const userId = assertUser(req);

  const { name, description, workspace, participants, scheduledAt, duration, agenda, notes } =
    req.body;

  if (!name || !workspace || !scheduledAt) {
    throw new AppError('Name, workspace and scheduledAt are required', 400);
  }

  const ws = await Workspace.findById(workspace);
  if (!ws || ws.isDeleted) {
    throw new AppError('Workspace not found', 404);
  }

  const isMember =
    ws.owner.toString() === userId || ws.members.some((m) => m.toString() === userId);
  if (!isMember) {
    throw new AppError('Not authorized to schedule meetings in this workspace', 403);
  }

  const participantIds = (participants || []).filter(
    (p: string) => String(p) !== userId,
  ) as string[];

  const meeting = await Meeting.create({
    name: name.trim(),
    description: description || '',
    workspace: new mongoose.Types.ObjectId(workspace),
    host: new mongoose.Types.ObjectId(userId),
    participants: participantIds.map((p: string) => new mongoose.Types.ObjectId(p)),
    scheduledAt: new Date(scheduledAt),
    duration: duration || 30,
    agenda: agenda || '',
    notes: notes || '',
  });

  await logActivity({
    userId,
    action: 'scheduled meeting',
    entityType: 'meeting',
    entityId: meeting._id.toString(),
    entityName: meeting.name,
  });

  for (const pid of participantIds) {
    await logNotification({
      userId: pid,
      title: 'Meeting Scheduled',
      message: `You were invited to "${meeting.name}"`,
      type: 'info',
      entityType: 'meeting',
      entityId: meeting._id.toString(),
    });
  }

  res.status(201).json({ success: true, data: { meeting } });
}

export async function updateMeeting(req: AuthRequest, res: Response): Promise<void> {
  const userId = assertUser(req);
  const meeting = await Meeting.findById(req.params.id);

  if (!meeting || meeting.isDeleted) {
    throw new AppError('Meeting not found', 404);
  }

  if (meeting.host.toString() !== userId) {
    throw new AppError('Only the host can update this meeting', 403);
  }

  const { name, description, participants, scheduledAt, duration, agenda, notes, status } =
    req.body;

  if (name !== undefined) meeting.name = name.trim();
  if (description !== undefined) meeting.description = description;
  if (scheduledAt !== undefined) meeting.scheduledAt = new Date(scheduledAt);
  if (duration !== undefined) meeting.duration = duration;
  if (agenda !== undefined) meeting.agenda = agenda;
  if (notes !== undefined) meeting.notes = notes;
  if (status !== undefined) meeting.status = status;
  if (participants !== undefined) {
    meeting.participants = (participants as string[]).map((p) => new mongoose.Types.ObjectId(p));
  }

  if (meeting.status === 'ongoing' && !meeting.endedAt) {
    meeting.endedAt = undefined;
  }
  if (meeting.status === 'completed' && !meeting.endedAt) {
    meeting.endedAt = new Date();
  }

  await meeting.save();
  res.json({ success: true, data: { meeting } });
}

export async function deleteMeeting(req: AuthRequest, res: Response): Promise<void> {
  const userId = assertUser(req);
  const meeting = await Meeting.findById(req.params.id);

  if (!meeting || meeting.isDeleted) {
    throw new AppError('Meeting not found', 404);
  }

  if (meeting.host.toString() !== userId) {
    throw new AppError('Only the host can delete this meeting', 403);
  }

  meeting.isDeleted = true;
  await meeting.save();

  res.json({ success: true, message: 'Meeting deleted' });
}

export async function startMeeting(req: AuthRequest, res: Response): Promise<void> {
  const userId = assertUser(req);
  const meeting = await Meeting.findById(req.params.id);

  if (!meeting || meeting.isDeleted) {
    throw new AppError('Meeting not found', 404);
  }

  if (meeting.host.toString() !== userId) {
    throw new AppError('Only the host can start this meeting', 403);
  }

  meeting.status = 'ongoing';
  meeting.endedAt = undefined;
  await meeting.save();

  await logActivity({
    userId,
    action: 'started meeting',
    entityType: 'meeting',
    entityId: meeting._id.toString(),
    entityName: meeting.name,
  });

  res.json({ success: true, data: { meeting } });
}

export async function endMeeting(req: AuthRequest, res: Response): Promise<void> {
  const userId = assertUser(req);
  const meeting = await Meeting.findById(req.params.id);

  if (!meeting || meeting.isDeleted) {
    throw new AppError('Meeting not found', 404);
  }

  if (meeting.host.toString() !== userId) {
    throw new AppError('Only the host can end this meeting', 403);
  }

  meeting.status = 'completed';
  meeting.endedAt = new Date();
  await meeting.save();

  await logActivity({
    userId,
    action: 'ended meeting',
    entityType: 'meeting',
    entityId: meeting._id.toString(),
    entityName: meeting.name,
  });

  res.json({ success: true, data: { meeting } });
}

export async function joinMeeting(req: AuthRequest, res: Response): Promise<void> {
  const userId = assertUser(req);
  const meeting = await Meeting.findById(req.params.id);

  if (!meeting || meeting.isDeleted) {
    throw new AppError('Meeting not found', 404);
  }

  if (!meeting.participants.some((p) => p.toString() === userId)) {
    meeting.participants.push(new mongoose.Types.ObjectId(userId));
  }
  if (meeting.status === 'scheduled') {
    meeting.status = 'ongoing';
  }
  await meeting.save();

  await logActivity({
    userId,
    action: 'joined meeting',
    entityType: 'meeting',
    entityId: meeting._id.toString(),
    entityName: meeting.name,
  });

  const populated = await meeting.populate('host', 'name email avatar');
  res.json({ success: true, data: { meeting: populated } });
}

export async function getMeetingStats(req: AuthRequest, res: Response): Promise<void> {
  const userId = assertUser(req);

  const [total, upcoming, ongoing, completed] = await Promise.all([
    Meeting.countDocuments({
      isDeleted: { $ne: true },
      $or: [{ host: userId }, { participants: userId }],
    }),
    Meeting.countDocuments({
      isDeleted: { $ne: true },
      status: 'scheduled',
      $or: [{ host: userId }, { participants: userId }],
    }),
    Meeting.countDocuments({
      isDeleted: { $ne: true },
      status: 'ongoing',
      $or: [{ host: userId }, { participants: userId }],
    }),
    Meeting.countDocuments({
      isDeleted: { $ne: true },
      status: 'completed',
      $or: [{ host: userId }, { participants: userId }],
    }),
  ]);

  res.json({
    success: true,
    data: {
      stats: { total, upcoming, ongoing, completed },
    },
  });
}
