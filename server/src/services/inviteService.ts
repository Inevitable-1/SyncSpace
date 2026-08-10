import { inviteRepository } from '../repositories/invite.repository.js';
import { memberRepository } from '../repositories/member.repository.js';
import { workspaceRepository } from '../repositories/workspace.repository.js';
import { AppError } from '../middleware/errorHandler.js';
import { logActivity } from '../controllers/activity.js';
import { logNotification } from '../controllers/notification.js';
import type { InviteRole, InviteStatus, IInviteDocument } from '../models/Invite.js';

class InviteService {
  async createInvite(
    workspaceId: string,
    invitedBy: string,
    email: string,
    role: InviteRole = 'member',
  ) {
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    if (workspace.owner.toString() !== invitedBy) {
      const member = await memberRepository.findByUserAndWorkspace(invitedBy, workspaceId);
      if (!member || member.role !== 'admin') {
        throw new AppError('Only owner or admin can invite members', 403);
      }
    }

    const existingInvite = await inviteRepository.findByEmailAndWorkspace(email, workspaceId);
    if (existingInvite) {
      throw new AppError('Invite already pending for this email', 400);
    }

    const invite = await inviteRepository.create({
      email,
      workspaceId,
      invitedBy,
      role,
    });

    await logActivity({
      userId: invitedBy,
      action: 'sent invite',
      entityType: 'member',
      entityId: workspaceId,
      entityName: workspace.name,
      metadata: { email, role },
    });

    await logNotification({
      userId: invitedBy,
      title: 'Invite sent',
      message: `Invite sent to ${email} for ${workspace.name}`,
      type: 'success',
      entityType: 'workspace',
      entityId: workspaceId,
    });

    return invite;
  }

  async getInvites(workspaceId: string) {
    return inviteRepository.findByWorkspace(workspaceId);
  }

  async getInvitesWithPagination(
    workspaceId: string,
    query: {
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'asc' | 'desc';
      status?: InviteStatus;
      search?: string;
    },
  ) {
    return inviteRepository.findByWorkspaceWithPagination(workspaceId, query);
  }

  async acceptInvite(token: string, userId: string, email: string) {
    const invite = await inviteRepository.findByToken(token);
    if (!invite) {
      throw new AppError('Invalid invite token', 404);
    }

    if (invite.status !== 'pending') {
      throw new AppError('Invite is no longer pending', 400);
    }

    if (invite.expiresAt < new Date()) {
      await inviteRepository.updateStatus(invite._id.toString(), 'expired');
      throw new AppError('Invite has expired', 400);
    }

    if (invite.email !== email) {
      throw new AppError('Invite email does not match your email', 403);
    }

    const workspaceId = invite.workspaceId.toString();

    const existingMember = await memberRepository.findByUserAndWorkspace(userId, workspaceId);
    if (existingMember) {
      throw new AppError('You are already a member of this workspace', 400);
    }

    await memberRepository.create({
      userId,
      workspaceId,
      role: invite.role,
      status: 'active',
      invitedBy: invite.invitedBy.toString(),
    });

    await workspaceRepository.addMember(workspaceId, userId);

    await inviteRepository.updateStatus(invite._id.toString(), 'accepted');

    const workspace = await workspaceRepository.findById(workspaceId);
    if (workspace) {
      await logActivity({
        userId,
        action: 'joined workspace',
        entityType: 'member',
        entityId: workspaceId,
        entityName: workspace.name,
        metadata: { role: invite.role },
      });

      await logNotification({
        userId: invite.invitedBy.toString(),
        title: 'Invite accepted',
        message: `${email} accepted your invite to ${workspace.name}`,
        type: 'success',
        entityType: 'workspace',
        entityId: workspaceId,
      });
    }

    return { message: 'Invite accepted successfully' };
  }

  async declineInvite(token: string, _userId: string, email: string) {
    const invite = await inviteRepository.findByToken(token);
    if (!invite) {
      throw new AppError('Invalid invite token', 404);
    }

    if (invite.status !== 'pending') {
      throw new AppError('Invite is no longer pending', 400);
    }

    if (invite.email !== email) {
      throw new AppError('Invite email does not match your email', 403);
    }

    await inviteRepository.updateStatus(invite._id.toString(), 'declined');

    return { message: 'Invite declined successfully' };
  }

  async revokeInvite(workspaceId: string, ownerId: string, inviteId: string) {
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    if (workspace.owner.toString() !== ownerId) {
      throw new AppError('Only workspace owner can revoke invites', 403);
    }

    const invite = await inviteRepository.findById(inviteId);
    if (!invite) {
      throw new AppError('Invite not found', 404);
    }

    await inviteRepository.delete(inviteId);

    await logActivity({
      userId: ownerId,
      action: 'revoked invite',
      entityType: 'member',
      entityId: workspaceId,
      entityName: workspace.name,
      metadata: { email: invite.email },
    });

    return { message: 'Invite revoked successfully' };
  }

  async getPendingInvitesForUser(email: string) {
    return inviteRepository.findByUserEmail(email);
  }

  async getInviteStats(workspaceId: string) {
    const invites = await inviteRepository.findByWorkspace(workspaceId);
    const pending = invites.filter((i: IInviteDocument) => i.status === 'pending').length;
    const accepted = invites.filter((i: IInviteDocument) => i.status === 'accepted').length;
    const declined = invites.filter((i: IInviteDocument) => i.status === 'declined').length;
    const expired = invites.filter((i: IInviteDocument) => i.status === 'expired').length;

    return {
      total: invites.length,
      pending,
      accepted,
      declined,
      expired,
    };
  }
}

export const inviteService = new InviteService();
