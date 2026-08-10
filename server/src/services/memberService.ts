import { memberRepository } from '../repositories/member.repository.js';
import { workspaceRepository } from '../repositories/workspace.repository.js';
import { AppError } from '../middleware/errorHandler.js';
import { logActivity } from '../controllers/activity.js';
import { logNotification } from '../controllers/notification.js';
import type { MemberRole } from '../models/Member.js';

class MemberService {
  async addMember(
    workspaceId: string,
    ownerId: string,
    userId: string,
    role: MemberRole = 'member',
  ) {
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    if (workspace.owner.toString() !== ownerId) {
      throw new AppError('Only workspace owner can add members', 403);
    }

    const existingMember = await memberRepository.findByUserAndWorkspace(userId, workspaceId);
    if (existingMember) {
      throw new AppError('User is already a member', 400);
    }

    const member = await memberRepository.create({
      userId,
      workspaceId,
      role,
      status: 'active',
      invitedBy: ownerId,
    });

    await workspaceRepository.addMember(workspaceId, userId);

    await logActivity({
      userId: ownerId,
      action: 'added member',
      entityType: 'member',
      entityId: workspaceId,
      entityName: workspace.name,
      metadata: { memberId: userId, role },
    });

    await logNotification({
      userId,
      title: 'Added to workspace',
      message: `You have been added to ${workspace.name}`,
      type: 'info',
      entityType: 'workspace',
      entityId: workspaceId,
    });

    return member;
  }

  async removeMember(workspaceId: string, ownerId: string, memberId: string) {
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    if (workspace.owner.toString() !== ownerId) {
      throw new AppError('Only workspace owner can remove members', 403);
    }

    if (memberId === ownerId) {
      throw new AppError('Owner cannot remove themselves', 400);
    }

    const member = await memberRepository.findByUserAndWorkspace(memberId, workspaceId);
    if (!member) {
      throw new AppError('Member not found', 404);
    }

    await memberRepository.removeByUserAndWorkspace(memberId, workspaceId);
    await workspaceRepository.removeMember(workspaceId, memberId);

    await logActivity({
      userId: ownerId,
      action: 'removed member',
      entityType: 'member',
      entityId: workspaceId,
      entityName: workspace.name,
      metadata: { memberId, role: member.role },
    });

    return { message: 'Member removed successfully' };
  }

  async getMembers(workspaceId: string) {
    const members = await memberRepository.findByWorkspace(workspaceId);
    return members;
  }

  async getMembersWithPagination(
    workspaceId: string,
    query: {
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'asc' | 'desc';
      role?: MemberRole;
      status?: 'active' | 'invited' | 'suspended';
    },
  ) {
    return memberRepository.findByWorkspaceWithPagination(workspaceId, query);
  }

  async updateMemberRole(workspaceId: string, ownerId: string, memberId: string, role: MemberRole) {
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    if (workspace.owner.toString() !== ownerId) {
      throw new AppError('Only workspace owner can update roles', 403);
    }

    if (memberId === ownerId) {
      throw new AppError('Cannot change owner role', 400);
    }

    const member = await memberRepository.findByUserAndWorkspace(memberId, workspaceId);
    if (!member) {
      throw new AppError('Member not found', 404);
    }

    const updatedMember = await memberRepository.updateRole(member._id.toString(), role);

    await logActivity({
      userId: ownerId,
      action: 'updated member role',
      entityType: 'member',
      entityId: workspaceId,
      entityName: workspace.name,
      metadata: { memberId, oldRole: member.role, newRole: role },
    });

    return updatedMember;
  }

  async suspendMember(workspaceId: string, ownerId: string, memberId: string) {
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    if (workspace.owner.toString() !== ownerId) {
      throw new AppError('Only workspace owner can suspend members', 403);
    }

    if (memberId === ownerId) {
      throw new AppError('Cannot suspend workspace owner', 400);
    }

    const member = await memberRepository.findByUserAndWorkspace(memberId, workspaceId);
    if (!member) {
      throw new AppError('Member not found', 404);
    }

    const updatedMember = await memberRepository.updateStatus(member._id.toString(), 'suspended');

    await logActivity({
      userId: ownerId,
      action: 'suspended member',
      entityType: 'member',
      entityId: workspaceId,
      entityName: workspace.name,
      metadata: { memberId },
    });

    return updatedMember;
  }

  async reactivateMember(workspaceId: string, ownerId: string, memberId: string) {
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    if (workspace.owner.toString() !== ownerId) {
      throw new AppError('Only workspace owner can reactivate members', 403);
    }

    const member = await memberRepository.findByUserAndWorkspace(memberId, workspaceId);
    if (!member) {
      throw new AppError('Member not found', 404);
    }

    const updatedMember = await memberRepository.updateStatus(member._id.toString(), 'active');

    await logActivity({
      userId: ownerId,
      action: 'reactivated member',
      entityType: 'member',
      entityId: workspaceId,
      entityName: workspace.name,
      metadata: { memberId },
    });

    return updatedMember;
  }

  async getMemberStats(workspaceId: string) {
    const [totalActive, totalInvited, suspended] = await Promise.all([
      memberRepository.findByRole(workspaceId, 'member'),
      memberRepository.findPendingInvites(workspaceId),
      memberRepository
        .findByWorkspace(workspaceId)
        .then((members) => members.filter((m) => m.status === 'suspended')),
    ]);

    return {
      total: totalActive.length + 1,
      active: totalActive.length + 1,
      invited: totalInvited.length,
      suspended: suspended.length,
    };
  }
}

export const memberService = new MemberService();
