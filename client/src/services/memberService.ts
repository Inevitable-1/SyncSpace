import api from './api';
import { demo, noop, ok } from './demo';
import { getMembersForWorkspace, demoUsers, demoUser } from '../data/demoData';
import type { Member, MemberRole, MemberStatus } from '../types';

function buildDemoMember(
  workspaceId: string,
  memberId: string,
  role: MemberRole,
  status: MemberStatus,
): Member {
  const existing = getMembersForWorkspace(workspaceId).find((m) => m._id === memberId);
  if (existing) {
    return { ...existing, role, status, updatedAt: new Date().toISOString() };
  }
  const nowIso = new Date().toISOString();
  return {
    _id: memberId,
    userId: demoUser,
    workspaceId,
    role,
    status,
    invitedBy: demoUser,
    joinedAt: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

function memberStats(workspaceId: string) {
  const members = getMembersForWorkspace(workspaceId);
  return {
    total: members.length,
    active: members.filter((m) => m.status === 'active').length,
    invited: members.filter((m) => m.status === 'invited').length,
    suspended: members.filter((m) => m.status === 'suspended').length,
  };
}

export const memberService = {
  async getMembers(workspaceId: string, params?: Record<string, unknown>) {
    return demo(
      () =>
        api.get(`/workspaces/${workspaceId}/members`, { params }).then((response) => response.data),
      () => {
        const members = getMembersForWorkspace(workspaceId);
        return ok({
          data: members,
          pagination: { page: 1, limit: 50, total: members.length, totalPages: 1 },
        });
      },
    );
  },

  async addMember(workspaceId: string, userId: string, role?: string) {
    return demo(
      () =>
        api
          .post(`/workspaces/${workspaceId}/members`, { userId, role })
          .then((response) => response.data),
      () => {
        const user = demoUsers.find((u) => u.id === userId) || demoUser;
        const nowIso = new Date().toISOString();
        return ok({
          _id: `mem-${Date.now()}`,
          userId: user,
          workspaceId,
          role: (role as MemberRole) || 'member',
          status: 'active' as MemberStatus,
          invitedBy: demoUser,
          joinedAt: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso,
        } as Member);
      },
    );
  },

  async removeMember(workspaceId: string, memberId: string) {
    await noop(() => api.delete(`/workspaces/${workspaceId}/members/${memberId}`));
  },

  async updateMemberRole(workspaceId: string, memberId: string, role: string) {
    return demo(
      () =>
        api
          .put(`/workspaces/${workspaceId}/members/${memberId}/role`, { role })
          .then((response) => response.data),
      () => ok(buildDemoMember(workspaceId, memberId, role as MemberRole, 'active')),
    );
  },

  async suspendMember(workspaceId: string, memberId: string) {
    return demo(
      () =>
        api
          .put(`/workspaces/${workspaceId}/members/${memberId}/suspend`)
          .then((response) => response.data),
      () => ok(buildDemoMember(workspaceId, memberId, 'member', 'suspended')),
    );
  },

  async reactivateMember(workspaceId: string, memberId: string) {
    return demo(
      () =>
        api
          .put(`/workspaces/${workspaceId}/members/${memberId}/reactivate`)
          .then((response) => response.data),
      () => ok(buildDemoMember(workspaceId, memberId, 'member', 'active')),
    );
  },

  async getMemberStats(workspaceId: string) {
    return demo(
      () => api.get(`/workspaces/${workspaceId}/members/stats`).then((response) => response.data),
      () => ok(memberStats(workspaceId)),
    );
  },
};
