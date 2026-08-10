import {
  Member,
  type IMemberDocument,
  type MemberRole,
  type MemberStatus,
} from '../models/Member.js';
import type { MemberQueryDto } from '../dto/member.dto.js';
import type { PaginatedResponse } from '../dto/common.dto.js';

class MemberRepository {
  async create(data: {
    userId: string;
    workspaceId: string;
    role?: MemberRole;
    status?: MemberStatus;
    invitedBy?: string;
  }): Promise<IMemberDocument> {
    const member = new Member(data);
    return member.save();
  }

  async findById(id: string): Promise<IMemberDocument | null> {
    return Member.findById(id)
      .populate('userId', 'name email avatar')
      .populate('invitedBy', 'name email avatar');
  }

  async findByUserAndWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<IMemberDocument | null> {
    return Member.findOne({ userId, workspaceId });
  }

  async findByWorkspace(workspaceId: string): Promise<IMemberDocument[]> {
    return Member.find({ workspaceId })
      .populate('userId', 'name email avatar')
      .populate('invitedBy', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  async findByWorkspaceWithPagination(
    workspaceId: string,
    query: MemberQueryDto,
  ): Promise<PaginatedResponse<IMemberDocument>> {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', role, status } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { workspaceId };

    if (role) filter.role = role;
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      Member.find(filter)
        .sort({ [sort]: order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email avatar')
        .populate('invitedBy', 'name email avatar'),
      Member.countDocuments(filter),
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

  async updateRole(id: string, role: MemberRole): Promise<IMemberDocument | null> {
    return Member.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });
  }

  async updateStatus(id: string, status: MemberStatus): Promise<IMemberDocument | null> {
    return Member.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
  }

  async remove(id: string): Promise<IMemberDocument | null> {
    return Member.findByIdAndDelete(id);
  }

  async removeByUserAndWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<IMemberDocument | null> {
    return Member.findOneAndDelete({ userId, workspaceId });
  }

  async countByWorkspace(workspaceId: string): Promise<number> {
    return Member.countDocuments({ workspaceId, status: 'active' });
  }

  async findByRole(workspaceId: string, role: MemberRole): Promise<IMemberDocument[]> {
    return Member.find({ workspaceId, role, status: 'active' }).populate(
      'userId',
      'name email avatar',
    );
  }

  async findPendingInvites(workspaceId: string): Promise<IMemberDocument[]> {
    return Member.find({ workspaceId, status: 'invited' })
      .populate('userId', 'name email avatar')
      .populate('invitedBy', 'name email avatar');
  }
}

export const memberRepository = new MemberRepository();
