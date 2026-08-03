import api from './api';
import { demo, noop, ok } from './demo';
import { getInvitesForWorkspace, demoInvites, demoUser } from '../data/demoData';
import { toWorkspaceShape, getAllDemoWorkspaces } from '../data/demoWorkspaces';
import type { Invite, InviteRole, InviteStatus } from '../types';

function buildDemoInvite(workspaceId: string, email: string, role?: string): Invite {
  const nowIso = new Date().toISOString();
  return {
    _id: `inv-${Date.now()}`,
    email,
    workspaceId,
    invitedBy: demoUser,
    role: (role as InviteRole) || 'member',
    status: 'pending' as InviteStatus,
    token: `demo-invite-${Math.random().toString(36).slice(2, 10)}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export const inviteService = {
  async getInvites(workspaceId: string, params?: Record<string, unknown>) {
    return demo(
      () =>
        api.get(`/workspaces/${workspaceId}/invites`, { params }).then((response) => response.data),
      () => {
        const invites = getInvitesForWorkspace(workspaceId);
        return ok({
          data: invites,
          pagination: { page: 1, limit: 50, total: invites.length, totalPages: 1 },
        });
      },
    );
  },

  async createInvite(workspaceId: string, email: string, role?: string) {
    return demo(
      () =>
        api
          .post(`/workspaces/${workspaceId}/invites`, { email, role })
          .then((response) => response.data),
      () => ok(buildDemoInvite(workspaceId, email, role)),
    );
  },

  async revokeInvite(workspaceId: string, inviteId: string) {
    await noop(() => api.delete(`/workspaces/${workspaceId}/invites/${inviteId}`));
  },

  async getPendingInvites() {
    return demo(
      () => api.get('/invites/pending').then((response) => response.data),
      () => ok(demoInvites),
    );
  },

  async acceptInvite(token: string) {
    return demo(
      () => api.post(`/invites/${token}/accept`).then((response) => response.data),
      () => ok(toWorkspaceShape(getAllDemoWorkspaces()[0])),
    );
  },

  async declineInvite(token: string) {
    return demo(
      () => api.post(`/invites/${token}/decline`).then((response) => response.data),
      () => ok(demoInvites[0]),
    );
  },

  async getInviteStats(workspaceId: string) {
    return demo(
      () => api.get(`/workspaces/${workspaceId}/invites/stats`).then((response) => response.data),
      () => {
        const invites = getInvitesForWorkspace(workspaceId);
        return ok({
          total: invites.length,
          pending: invites.filter((i) => i.status === 'pending').length,
          accepted: invites.filter((i) => i.status === 'accepted').length,
          declined: invites.filter((i) => i.status === 'declined').length,
          expired: invites.filter((i) => i.status === 'expired').length,
        });
      },
    );
  },
};
