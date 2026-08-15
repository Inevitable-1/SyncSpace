import api from './api';
import { branch } from './demo';
import {
  getDemoMembersForWorkspace,
  addDemoMember,
  updateDemoMember,
  removeDemoMember,
} from '../data/demoWorkspaces';
import type { MemberRole, MemberStatus } from '../types';

function ok<T>(data: T) {
  return { data };
}

export const memberService = {
  async getMembers(workspaceId: string, params?: Record<string, unknown>) {
    return branch(
      () => {
        const members = getDemoMembersForWorkspace(workspaceId);
        return ok({
          data: members,
          pagination: { page: 1, limit: 50, total: members.length, totalPages: 1 },
        });
      },
      async () => {
        const { data } = await api.get(`/workspaces/${workspaceId}/members`, { params });
        return ok(data.data);
      },
    );
  },

  async addMember(workspaceId: string, userId: string, role?: string) {
    return branch(
      () => ok(addDemoMember(workspaceId, { userId, role })),
      async () => {
        const { data } = await api.post(`/workspaces/${workspaceId}/members`, { userId, role });
        return ok(data.data);
      },
    );
  },

  async removeMember(workspaceId: string, memberId: string) {
    return branch(
      () => {
        removeDemoMember(workspaceId, memberId);
      },
      async () => {
        await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
      },
    );
  },

  async updateMemberRole(workspaceId: string, memberId: string, role: string) {
    return branch(
      () => {
        const member = updateDemoMember(workspaceId, memberId, { role: role as MemberRole });
        return ok(member || getDemoMembersForWorkspace(workspaceId)[0]);
      },
      async () => {
        const { data } = await api.put(`/workspaces/${workspaceId}/members/${memberId}/role`, {
          role,
        });
        return ok(data.data);
      },
    );
  },

  async suspendMember(workspaceId: string, memberId: string) {
    return branch(
      () => {
        const member = updateDemoMember(workspaceId, memberId, {
          status: 'suspended' as MemberStatus,
        });
        return ok(member || getDemoMembersForWorkspace(workspaceId)[0]);
      },
      async () => {
        const { data } = await api.put(`/workspaces/${workspaceId}/members/${memberId}/suspend`);
        return ok(data.data);
      },
    );
  },

  async reactivateMember(workspaceId: string, memberId: string) {
    return branch(
      () => {
        const member = updateDemoMember(workspaceId, memberId, {
          status: 'active' as MemberStatus,
        });
        return ok(member || getDemoMembersForWorkspace(workspaceId)[0]);
      },
      async () => {
        const { data } = await api.put(`/workspaces/${workspaceId}/members/${memberId}/reactivate`);
        return ok(data.data);
      },
    );
  },
};
