import {
  Invite,
  type IInviteDocument,
  type InviteRole,
  type InviteStatus,
} from '../models/Invite.js';
import type { InviteQueryDto } from '../dto/invite.dto.js';
import type { PaginatedResponse } from '../dto/common.dto.js';

export class InviteRepository {
  async create(data: {
    email: string;
    workspaceId: string;
    invitedBy: string;
    role?: InviteRole;
  }): Promise<IInviteDocument> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invite = new Invite({
      ...data,
      expiresAt,
    });
    return invite.save();
  }

  async findById(id: string): Promise<IInviteDocument | null> {
    return Invite.findById(id).populate('invitedBy', 'name email avatar');
  }

  async findByToken(token: string): Promise<IInviteDocument | null> {
    return Invite.findOne({ token })
      .populate('workspaceId')
      .populate('invitedBy', 'name email avatar');
  }

  async findByEmailAndWorkspace(
    email: string,
    workspaceId: string,
  ): Promise<IInviteDocument | null> {
    return Invite.findOne({ email, workspaceId, status: 'pending' });
  }

  async findByWorkspace(workspaceId: string): Promise<IInviteDocument[]> {
    return Invite.find({ workspaceId })
      .populate('invitedBy', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  async findByWorkspaceWithPagination(
    workspaceId: string,
    query: InviteQueryDto,
  ): Promise<PaginatedResponse<IInviteDocument>> {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', status, search } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { workspaceId };

    if (status) filter.status = status;
    if (search) filter.email = { $regex: search, $options: 'i' };

    const [data, total] = await Promise.all([
      Invite.find(filter)
        .sort({ [sort]: order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .populate('invitedBy', 'name email avatar'),
      Invite.countDocuments(filter),
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

  async updateStatus(id: string, status: InviteStatus): Promise<IInviteDocument | null> {
    return Invite.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<IInviteDocument | null> {
    return Invite.findByIdAndDelete(id);
  }

  async deleteExpired(): Promise<void> {
    await Invite.deleteMany({ expiresAt: { $lt: new Date() }, status: 'pending' });
  }

  async findByUserEmail(email: string): Promise<IInviteDocument[]> {
    return Invite.find({ email, status: 'pending' })
      .populate('workspaceId', 'name description color icon')
      .populate('invitedBy', 'name email avatar')
      .sort({ createdAt: -1 });
  }
}

export const inviteRepository = new InviteRepository();
