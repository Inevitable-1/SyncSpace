import api from './api';
import { demo, ok } from './demo';
import { demoUser } from '../data/demoData';
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
  async createInvite(workspaceId: string, email: string, role?: string) {
    return demo(
      () =>
        api
          .post(`/workspaces/${workspaceId}/invites`, { email, role })
          .then((response) => response.data),
      () => ok(buildDemoInvite(workspaceId, email, role)),
    );
  },
};
