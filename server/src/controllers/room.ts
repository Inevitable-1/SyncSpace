import type { Response } from 'express';
import { Room } from '../models/Room.js';
import { Workspace } from '../models/Workspace.js';
import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';
import { logActivity } from './activity.js';
import { logNotification } from './notification.js';

export async function createRoom(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { name, type, description, workspaceId } = req.body;

  if (!workspaceId) {
    throw new AppError('Workspace ID is required', 400);
  }

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace || workspace.isDeleted) {
    throw new AppError('Workspace not found', 404);
  }

  const userId = req.user.userId;
  const isMember =
    workspace.owner.toString() === userId || workspace.members.some((m) => m.toString() === userId);

  if (!isMember) {
    throw new AppError('Not authorized to create rooms in this workspace', 403);
  }

  const room = await Room.create({
    name,
    description: description || '',
    type: type || 'whiteboard',
    workspace: workspaceId,
    owner: req.user.userId,
    participants: [req.user.userId],
  });

  await logActivity({
    userId: req.user.userId,
    action: 'created room',
    entityType: 'room',
    entityId: room._id.toString(),
    entityName: room.name,
  });

  await logNotification({
    userId: req.user.userId,
    title: 'Room Created',
    message: `You created "${room.name}"`,
    type: 'success',
    entityType: 'room',
    entityId: room._id.toString(),
  });

  res.status(201).json({
    success: true,
    message: 'Room created',
    data: { room },
  });
}

export async function getRooms(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { workspaceId, includeDeleted } = req.query;

  const filter: Record<string, unknown> = {
    isDeleted: includeDeleted === 'true' ? { $in: [true, false] } : { $ne: true },
    $or: [{ owner: req.user.userId }, { participants: req.user.userId }],
  };

  if (workspaceId && typeof workspaceId === 'string') {
    filter.workspace = workspaceId;
  }

  if (workspaceId && typeof workspaceId === 'string') {
    const workspace = await Workspace.findById(workspaceId);
    if (workspace) {
      const userId = req.user.userId;
      const isMember =
        workspace.owner.toString() === userId ||
        workspace.members.some((m) => m.toString() === userId);
      if (!isMember) {
        throw new AppError('Not authorized', 403);
      }
    }
  }

  const rooms = await Room.find(filter).populate('workspace', 'name color').sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: { rooms },
  });
}

export async function getWorkspaceRooms(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const userId = req.user.userId;
  const workspaceId = req.params.id as string;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace || workspace.isDeleted) {
    throw new AppError('Workspace not found', 404);
  }

  const isMember =
    workspace.owner.toString() === userId || workspace.members.some((m) => m.toString() === userId);
  if (!isMember) {
    throw new AppError('Not authorized', 403);
  }

  const rooms = await Room.find({ workspace: workspaceId, isDeleted: { $ne: true } })
    .populate('workspace', 'name color')
    .sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: { rooms },
  });
}

export async function getRoom(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const userId = req.user.userId;

  const room = await Room.findById(req.params.id).populate('workspace', 'name color');

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  const isParticipant =
    room.owner.toString() === userId || room.participants.some((p) => p.toString() === userId);

  if (!isParticipant) {
    throw new AppError('Not authorized to view this room', 403);
  }

  res.json({
    success: true,
    data: { room },
  });
}

export async function updateRoom(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const room = await Room.findById(req.params.id);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  if (room.owner.toString() !== req.user.userId) {
    throw new AppError('Only the room owner can update this room', 403);
  }

  const { name, type, description } = req.body;
  if (name !== undefined) room.name = name;
  if (type !== undefined) room.type = type;
  if (description !== undefined) room.description = description;

  await room.save();

  res.json({
    success: true,
    message: 'Room updated',
    data: { room },
  });
}

export async function deleteRoom(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const room = await Room.findById(req.params.id);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  if (room.owner.toString() !== req.user.userId) {
    throw new AppError('Only the room owner can delete this room', 403);
  }

  room.isDeleted = true;
  room.deletedAt = new Date();
  await room.save();

  await logActivity({
    userId: req.user.userId,
    action: 'deleted room',
    entityType: 'room',
    entityId: room._id.toString(),
    entityName: room.name,
  });

  res.json({
    success: true,
    message: 'Room deleted',
  });
}

export async function restoreRoom(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const room = await Room.findById(req.params.id);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  if (room.owner.toString() !== req.user.userId) {
    throw new AppError('Not authorized', 403);
  }

  room.isDeleted = false;
  room.deletedAt = undefined;
  await room.save();

  res.json({
    success: true,
    message: 'Room restored',
    data: { room },
  });
}

export async function joinRoom(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { inviteCode } = req.body;

  if (!inviteCode) {
    throw new AppError('Invite code is required', 400);
  }

  const room = await Room.findOne({ inviteCode, isDeleted: { $ne: true } });

  if (!room) {
    throw new AppError('Invalid invite code', 404);
  }

  const userId = req.user.userId;
  const isParticipant = room.participants.some((p) => p.toString() === userId);

  if (!isParticipant) {
    room.participants.push(userId as unknown as never);
    await room.save();

    await logNotification({
      userId: req.user.userId,
      title: 'Room Joined',
      message: `You joined "${room.name}"`,
      type: 'success',
      entityType: 'room',
      entityId: room._id.toString(),
    });
  }

  res.json({
    success: true,
    message: 'Joined room',
    data: { room },
  });
}

export async function getStats(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const userId = req.user.userId;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const totalWorkspaces = await Workspace.countDocuments({
    isDeleted: { $ne: true },
    $or: [{ owner: userId }, { members: userId }],
  });

  const prevWorkspaces = await Workspace.countDocuments({
    isDeleted: { $ne: true },
    createdAt: { $lt: thirtyDaysAgo },
    $or: [{ owner: userId }, { members: userId }],
  });

  const totalRooms = await Room.countDocuments({
    isDeleted: { $ne: true },
    $or: [{ owner: userId }, { participants: userId }],
  });

  const prevRooms = await Room.countDocuments({
    isDeleted: { $ne: true },
    createdAt: { $lt: thirtyDaysAgo },
    $or: [{ owner: userId }, { participants: userId }],
  });

  const totalMembers = await User.countDocuments({});

  const prevMembers = await User.countDocuments({
    createdAt: { $lt: thirtyDaysAgo },
  });

  const onlineMembers = totalMembers;

  const filesShared = await Room.countDocuments({
    isDeleted: { $ne: true },
    $or: [{ owner: userId }, { participants: userId }],
    updatedAt: { $gte: thirtyDaysAgo },
  });

  const activeSessions = await Room.countDocuments({
    isDeleted: { $ne: true },
    isActive: true,
    $or: [{ owner: userId }, { participants: userId }],
  });

  const recentActivity = await Activity.countDocuments({
    user: userId,
    createdAt: { $gte: thirtyDaysAgo },
  });

  const prevActivity = await Activity.countDocuments({
    user: userId,
    createdAt: { $lt: thirtyDaysAgo, $gte: sixtyDaysAgo },
  });

  const projectsCreated = totalWorkspaces;

  const growth = {
    workspaces:
      prevWorkspaces > 0
        ? Math.round(((totalWorkspaces - prevWorkspaces) / prevWorkspaces) * 100)
        : totalWorkspaces > 0
          ? 100
          : 0,
    rooms:
      prevRooms > 0
        ? Math.round(((totalRooms - prevRooms) / prevRooms) * 100)
        : totalRooms > 0
          ? 100
          : 0,
    members:
      prevMembers > 0
        ? Math.round(((totalMembers - prevMembers) / prevMembers) * 100)
        : totalMembers > 0
          ? 100
          : 0,
    activity:
      prevActivity > 0
        ? Math.round(((recentActivity - prevActivity) / prevActivity) * 100)
        : recentActivity > 0
          ? 100
          : 0,
  };

  res.json({
    success: true,
    data: {
      totalWorkspaces,
      totalRooms,
      totalRoomsAll: totalRooms,
      onlineMembers,
      filesShared,
      activeSessions,
      recentActivity,
      projectsCreated,
      growth,
    },
  });
}

export async function getInviteLink(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const userId = req.user.userId;
  const room = await Room.findById(req.params.id);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  const isParticipant =
    room.owner.toString() === userId || room.participants.some((p) => p.toString() === userId);

  if (!isParticipant) {
    throw new AppError('Not authorized', 403);
  }

  res.json({
    success: true,
    data: { inviteCode: room.inviteCode },
  });
}
