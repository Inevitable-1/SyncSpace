import api from './api';

export const memberService = {
  async getMembers(workspaceId: string, params?: Record<string, unknown>) {
    const response = await api.get(`/workspaces/${workspaceId}/members`, { params });
    return response.data;
  },

  async addMember(workspaceId: string, userId: string, role?: string) {
    const response = await api.post(`/workspaces/${workspaceId}/members`, { userId, role });
    return response.data;
  },

  async removeMember(workspaceId: string, memberId: string) {
    const response = await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
    return response.data;
  },

  async updateMemberRole(workspaceId: string, memberId: string, role: string) {
    const response = await api.put(`/workspaces/${workspaceId}/members/${memberId}/role`, { role });
    return response.data;
  },

  async suspendMember(workspaceId: string, memberId: string) {
    const response = await api.put(`/workspaces/${workspaceId}/members/${memberId}/suspend`);
    return response.data;
  },

  async reactivateMember(workspaceId: string, memberId: string) {
    const response = await api.put(`/workspaces/${workspaceId}/members/${memberId}/reactivate`);
    return response.data;
  },

  async getMemberStats(workspaceId: string) {
    const response = await api.get(`/workspaces/${workspaceId}/members/stats`);
    return response.data;
  },
};
