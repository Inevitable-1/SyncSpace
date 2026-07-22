import mongoose from 'mongoose';
import { Workspace, type IWorkspaceDocument } from '../models/Workspace.js';
import { Room } from '../models/Room.js';
import { AppError } from '../middleware/errorHandler.js';
import { logActivity } from '../controllers/activity.js';
import { logNotification } from '../controllers/notification.js';

interface CreateWorkspaceData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic?: boolean;
}

interface UpdateWorkspaceData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic?: boolean;
}

export class WorkspaceService {
  async create(userId: string, data: CreateWorkspaceData): Promise<IWorkspaceDocument> {
    const workspace = await Workspace.create({
      name: data.name,
      description: data.description || '',
      color: data.color || '#6366f1',
      icon: data.icon || '',
      isPublic: data.isPublic || false,
      owner: userId,
      members: [userId],
    });

    await logActivity({
      userId,
      action: 'created workspace',
      entityType: 'workspace',
      entityId: workspace._id.toString(),
      entityName: workspace.name,
    });

    await logNotification({
      userId,
      title: 'Workspace Created',
      message: `You created "${workspace.name}"`,
      type: 'success',
      entityType: 'workspace',
      entityId: workspace._id.toString(),
    });

    return workspace;
  }

  async getAll(userId: string): Promise<IWorkspaceDocument[]> {
    return Workspace.find({
      isDeleted: { $ne: true },
      $or: [{ owner: userId }, { members: userId }],
    }).sort({ updatedAt: -1 });
  }

  async getOne(
    id: string,
    userId: string,
  ): Promise<{ workspace: IWorkspaceDocument; roomCount: number }> {
    const workspace = await Workspace.findById(id);

    if (!workspace || workspace.isDeleted) {
      throw new AppError('Workspace not found', 404);
    }

    const isMember =
      workspace.owner.toString() === userId ||
      workspace.members.some((m) => m.toString() === userId);

    if (!isMember) {
      throw new AppError('Not authorized to view this workspace', 403);
    }

    const roomCount = await Room.countDocuments({
      workspace: workspace._id,
      isDeleted: { $ne: true },
    });

    return { workspace, roomCount };
  }

  async update(id: string, userId: string, data: UpdateWorkspaceData): Promise<IWorkspaceDocument> {
    const workspace = await Workspace.findById(id);

    if (!workspace || workspace.isDeleted) {
      throw new AppError('Workspace not found', 404);
    }

    if (workspace.owner.toString() !== userId) {
      throw new AppError('Only the owner can update this workspace', 403);
    }

    if (data.name !== undefined) workspace.name = data.name;
    if (data.description !== undefined) workspace.description = data.description;
    if (data.color !== undefined) workspace.color = data.color;
    if (data.icon !== undefined) workspace.icon = data.icon;
    if (data.isPublic !== undefined) workspace.isPublic = data.isPublic;

    await workspace.save();

    await logActivity({
      userId,
      action: 'updated workspace',
      entityType: 'workspace',
      entityId: workspace._id.toString(),
      entityName: workspace.name,
    });

    return workspace;
  }

  async delete(id: string, userId: string): Promise<void> {
    const workspace = await Workspace.findById(id);

    if (!workspace || workspace.isDeleted) {
      throw new AppError('Workspace not found', 404);
    }

    if (workspace.owner.toString() !== userId) {
      throw new AppError('Only the owner can delete this workspace', 403);
    }

    workspace.isDeleted = true;
    workspace.deletedAt = new Date();
    await workspace.save();

    await Room.updateMany({ workspace: workspace._id }, { isDeleted: true, deletedAt: new Date() });

    await logActivity({
      userId,
      action: 'deleted workspace',
      entityType: 'workspace',
      entityId: workspace._id.toString(),
      entityName: workspace.name,
    });
  }

  async restore(id: string, userId: string): Promise<IWorkspaceDocument> {
    const workspace = await Workspace.findById(id);

    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    if (workspace.owner.toString() !== userId) {
      throw new AppError('Not authorized to restore this workspace', 403);
    }

    workspace.isDeleted = false;
    workspace.deletedAt = undefined;
    await workspace.save();

    await Room.updateMany({ workspace: workspace._id }, { isDeleted: false, deletedAt: null });

    return workspace;
  }

  async getTrash(userId: string) {
    const workspaces = await Workspace.find({
      isDeleted: true,
      owner: userId,
    }).sort({ deletedAt: -1 });

    const rooms = await Room.find({
      isDeleted: true,
      owner: userId,
    }).sort({ deletedAt: -1 });

    return { workspaces, rooms };
  }

  async search(userId: string, query?: string) {
    const filter: Record<string, unknown> = {
      isDeleted: { $ne: true },
      $or: [{ owner: userId }, { members: userId }],
    };

    if (query && typeof query === 'string') {
      filter.name = { $regex: query, $options: 'i' };
    }

    return Workspace.find(filter).sort({ updatedAt: -1 });
  }

  async addMember(id: string, ownerId: string, memberUserId: string): Promise<IWorkspaceDocument> {
    const workspace = await Workspace.findById(id);

    if (!workspace || workspace.isDeleted) {
      throw new AppError('Workspace not found', 404);
    }

    if (workspace.owner.toString() !== ownerId) {
      throw new AppError('Only the owner can add members', 403);
    }

    if (workspace.members.some((m) => m.toString() === memberUserId)) {
      throw new AppError('User is already a member', 409);
    }

    workspace.members.push(new mongoose.Types.ObjectId(memberUserId));
    await workspace.save();

    await logActivity({
      userId: ownerId,
      action: 'added member to workspace',
      entityType: 'member',
      entityId: workspace._id.toString(),
      entityName: workspace.name,
    });

    await logNotification({
      userId: memberUserId,
      title: 'Added to Workspace',
      message: `You were added to "${workspace.name}"`,
      type: 'info',
      entityType: 'workspace',
      entityId: workspace._id.toString(),
    });

    return workspace;
  }

  async removeMember(id: string, ownerId: string, memberId: string): Promise<IWorkspaceDocument> {
    const workspace = await Workspace.findById(id);

    if (!workspace || workspace.isDeleted) {
      throw new AppError('Workspace not found', 404);
    }

    if (workspace.owner.toString() !== ownerId) {
      throw new AppError('Only the owner can remove members', 403);
    }

    workspace.members = workspace.members.filter((m) => m.toString() !== memberId);
    await workspace.save();

    return workspace;
  }

  async getMembers(id: string) {
    const workspace = await Workspace.findById(id).populate('members', 'name email avatar');

    if (!workspace || workspace.isDeleted) {
      throw new AppError('Workspace not found', 404);
    }

    return { members: workspace.members, owner: workspace.owner };
  }

  async regenerateInviteCode(id: string, userId: string): Promise<string> {
    const workspace = await Workspace.findById(id);

    if (!workspace || workspace.isDeleted) {
      throw new AppError('Workspace not found', 404);
    }

    if (workspace.owner.toString() !== userId) {
      throw new AppError('Only the owner can regenerate invite codes', 403);
    }

    const crypto = await import('crypto');
    workspace.inviteCode = crypto.randomBytes(8).toString('hex');
    await workspace.save();

    return workspace.inviteCode;
  }

  async joinByInviteCode(inviteCode: string, userId: string): Promise<IWorkspaceDocument> {
    const workspace = await Workspace.findOne({
      inviteCode,
      isDeleted: { $ne: true },
    });

    if (!workspace) {
      throw new AppError('Invalid invite code', 404);
    }

    if (workspace.owner.toString() === userId) {
      throw new AppError('You are the owner of this workspace', 400);
    }

    if (workspace.members.some((m) => m.toString() === userId)) {
      throw new AppError('You are already a member', 409);
    }

    workspace.members.push(new mongoose.Types.ObjectId(userId));
    await workspace.save();

    await logActivity({
      userId,
      action: 'joined workspace via invite',
      entityType: 'member',
      entityId: workspace._id.toString(),
      entityName: workspace.name,
    });

    await logNotification({
      userId: workspace.owner.toString(),
      title: 'New Member Joined',
      message: `A new member joined "${workspace.name}" via invite code`,
      type: 'info',
      entityType: 'workspace',
      entityId: workspace._id.toString(),
    });

    return workspace;
  }
}

export const workspaceService = new WorkspaceService();
