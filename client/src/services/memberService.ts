import api from './api';

function ok<T>(data: T) {
  return { data };
}

export const memberService = {
  async getMembers(workspaceId: string, params?: Record<string, unknown>) {
    const { data } = await api.get(`/workspaces/${workspaceId}/members`, { params });
    return ok(data.data);
  },

  async addMember(workspaceId: string, userId: string, role?: string) {
    const { data } = await api.post(`/workspaces/${workspaceId}/members`, { userId, role });
    return ok(data.data);
  },

  async removeMember(workspaceId: string, memberId: string) {
    await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
  },

  async updateMemberRole(workspaceId: string, memberId: string, role: string) {
    const { data } = await api.put(`/workspaces/${workspaceId}/members/${memberId}/role`, {
      role,
    });
    return ok(data.data);
  },

  async suspendMember(workspaceId: string, memberId: string) {
    const { data } = await api.put(`/workspaces/${workspaceId}/members/${memberId}/suspend`);
    return ok(data.data);
  },

  async reactivateMember(workspaceId: string, memberId: string) {
    const { data } = await api.put(`/workspaces/${workspaceId}/members/${memberId}/reactivate`);
    return ok(data.data);
  },
};
