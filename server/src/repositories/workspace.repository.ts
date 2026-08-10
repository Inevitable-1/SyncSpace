import { Workspace, type IWorkspaceDocument } from '../models/Workspace.js';
import type {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  WorkspaceQueryDto,
} from '../dto/workspace.dto.js';
import type { PaginatedResponse } from '../dto/common.dto.js';

class WorkspaceRepository {
  async create(userId: string, data: CreateWorkspaceDto): Promise<IWorkspaceDocument> {
    const workspace = new Workspace({
      ...data,
      owner: userId,
      members: [userId],
    });
    return workspace.save();
  }

  async findById(id: string): Promise<IWorkspaceDocument | null> {
    return Workspace.findById(id).populate('owner', 'name email avatar');
  }

  async findByUserId(userId: string): Promise<IWorkspaceDocument[]> {
    return Workspace.find({
      $or: [{ owner: userId }, { members: userId }],
      isDeleted: false,
    }).sort({ updatedAt: -1 });
  }

  async findWithPagination(
    userId: string,
    query: WorkspaceQueryDto,
  ): Promise<PaginatedResponse<IWorkspaceDocument>> {
    const { page = 1, limit = 10, sort = 'updatedAt', order = 'desc', search, isPublic } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      $or: [{ owner: userId }, { members: userId }],
      isDeleted: false,
    };

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (isPublic !== undefined) {
      filter.isPublic = isPublic;
    }

    const [data, total] = await Promise.all([
      Workspace.find(filter)
        .sort({ [sort]: order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .populate('owner', 'name email avatar'),
      Workspace.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, data: UpdateWorkspaceDto): Promise<IWorkspaceDocument | null> {
    return Workspace.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async softDelete(id: string): Promise<IWorkspaceDocument | null> {
    return Workspace.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
  }

  async restore(id: string): Promise<IWorkspaceDocument | null> {
    return Workspace.findByIdAndUpdate(id, { isDeleted: false, deletedAt: null }, { new: true });
  }

  async findDeleted(userId: string): Promise<IWorkspaceDocument[]> {
    return Workspace.find({
      $or: [{ owner: userId }, { members: userId }],
      isDeleted: true,
    }).sort({ deletedAt: -1 });
  }

  async search(userId: string, query: string): Promise<IWorkspaceDocument[]> {
    return Workspace.find({
      $or: [{ owner: userId }, { members: userId }],
      isDeleted: false,
      name: { $regex: query, $options: 'i' },
    }).limit(20);
  }

  async addMember(id: string, userId: string): Promise<IWorkspaceDocument | null> {
    return Workspace.findByIdAndUpdate(id, { $addToSet: { members: userId } }, { new: true });
  }

  async removeMember(id: string, userId: string): Promise<IWorkspaceDocument | null> {
    return Workspace.findByIdAndUpdate(id, { $pull: { members: userId } }, { new: true });
  }

  async getMembers(id: string): Promise<IWorkspaceDocument | null> {
    return Workspace.findById(id).populate('members', 'name email avatar');
  }

  async regenerateInviteCode(id: string): Promise<IWorkspaceDocument | null> {
    const workspace = await Workspace.findById(id);
    if (!workspace) return null;
    workspace.inviteCode = '';
    return workspace.save();
  }

  async findByInviteCode(inviteCode: string): Promise<IWorkspaceDocument | null> {
    return Workspace.findOne({ inviteCode, isDeleted: false });
  }
}

export const workspaceRepository = new WorkspaceRepository();
