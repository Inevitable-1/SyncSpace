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
  async getMembers(workspaceId: string, _params?: Record<string, unknown>) {
    const members = getDemoMembersForWorkspace(workspaceId);
    return ok({
      data: members,
      pagination: { page: 1, limit: 50, total: members.length, totalPages: 1 },
    });
  },

  async addMember(workspaceId: string, userId: string, role?: string) {
    const member = addDemoMember(workspaceId, { userId, role });
    return ok(member);
  },

  async removeMember(workspaceId: string, memberId: string) {
    removeDemoMember(workspaceId, memberId);
  },

  async updateMemberRole(workspaceId: string, memberId: string, role: string) {
    const member = updateDemoMember(workspaceId, memberId, { role: role as MemberRole });
    return ok(member || getDemoMembersForWorkspace(workspaceId)[0]);
  },

  async suspendMember(workspaceId: string, memberId: string) {
    const member = updateDemoMember(workspaceId, memberId, { status: 'suspended' as MemberStatus });
    return ok(member || getDemoMembersForWorkspace(workspaceId)[0]);
  },

  async reactivateMember(workspaceId: string, memberId: string) {
    const member = updateDemoMember(workspaceId, memberId, { status: 'active' as MemberStatus });
    return ok(member || getDemoMembersForWorkspace(workspaceId)[0]);
  },
};
