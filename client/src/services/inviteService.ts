import api from './api';

export const inviteService = {
  async createInvite(workspaceId: string, email: string, role?: string) {
    return api
      .post(`/workspaces/${workspaceId}/invites`, { email, role })
      .then((response) => response.data);
  },
};
