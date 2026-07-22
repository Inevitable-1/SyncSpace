import api from './api';

export const inviteService = {
  async getInvites(workspaceId: string, params?: Record<string, unknown>) {
    const response = await api.get(`/workspaces/${workspaceId}/invites`, { params });
    return response.data;
  },

  async createInvite(workspaceId: string, email: string, role?: string) {
    const response = await api.post(`/workspaces/${workspaceId}/invites`, { email, role });
    return response.data;
  },

  async revokeInvite(workspaceId: string, inviteId: string) {
    const response = await api.delete(`/workspaces/${workspaceId}/invites/${inviteId}`);
    return response.data;
  },

  async getPendingInvites() {
    const response = await api.get('/invites/pending');
    return response.data;
  },

  async acceptInvite(token: string) {
    const response = await api.post(`/invites/${token}/accept`);
    return response.data;
  },

  async declineInvite(token: string) {
    const response = await api.post(`/invites/${token}/decline`);
    return response.data;
  },

  async getInviteStats(workspaceId: string) {
    const response = await api.get(`/workspaces/${workspaceId}/invites/stats`);
    return response.data;
  },
};
