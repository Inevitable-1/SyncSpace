import api from './api';
import type { Workspace } from '../types';

export interface WorkspaceQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  isPublic?: boolean;
}

export const workspaceService = {
  async getAll(params?: WorkspaceQueryParams): Promise<Workspace[]> {
    const response = await api.get('/workspaces', { params });
    return response.data.data.workspaces;
  },

  async getOne(id: string): Promise<{ workspace: Workspace; roomCount: number }> {
    const response = await api.get(`/workspaces/${id}`);
    return response.data.data;
  },

  async create(data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    isPublic?: boolean;
  }): Promise<Workspace> {
    const response = await api.post('/workspaces', data);
    return response.data.data.workspace;
  },

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      color?: string;
      icon?: string;
      isPublic?: boolean;
    },
  ): Promise<Workspace> {
    const response = await api.put(`/workspaces/${id}`, data);
    return response.data.data.workspace;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/workspaces/${id}`);
  },

  async restore(id: string): Promise<Workspace> {
    const response = await api.post(`/workspaces/${id}/restore`);
    return response.data.data.workspace;
  },

  async getTrash(): Promise<{ workspaces: Workspace[]; rooms: { _id: string }[] }> {
    const response = await api.get('/workspaces/trash');
    return response.data.data;
  },

  async search(q: string, params?: WorkspaceQueryParams): Promise<Workspace[]> {
    const response = await api.get('/workspaces/search', { params: { q, ...params } });
    return response.data.data.workspaces;
  },

  async regenerateInviteCode(id: string): Promise<string> {
    const response = await api.post(`/workspaces/${id}/invite-code`);
    return response.data.data.inviteCode;
  },

  async joinByInviteCode(inviteCode: string): Promise<Workspace> {
    const response = await api.post('/workspaces/join', { inviteCode });
    return response.data.data.workspace;
  },

  async toggleFavorite(id: string): Promise<Workspace> {
    const response = await api.post(`/workspaces/${id}/favorite`);
    return response.data.data.workspace;
  },
};
