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
    const { data } = await api.get('/workspaces', { params });
    return data.data.workspaces as Workspace[];
  },

  async create(data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    isPublic?: boolean;
  }): Promise<Workspace> {
    const { data: res } = await api.post('/workspaces', data);
    return res.data.workspace as Workspace;
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
    const { data: res } = await api.put(`/workspaces/${id}`, data);
    return res.data.workspace as Workspace;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/workspaces/${id}`);
  },

  async restore(id: string): Promise<Workspace> {
    const { data: res } = await api.post(`/workspaces/${id}/restore`);
    return res.data.workspace as Workspace;
  },

  async getTrash(): Promise<{ workspaces: Workspace[]; rooms: { _id: string }[] }> {
    const { data } = await api.get('/workspaces/trash');
    return data.data as { workspaces: Workspace[]; rooms: { _id: string }[] };
  },

  async regenerateInviteCode(id: string): Promise<string> {
    const { data: res } = await api.post(`/workspaces/${id}/invite-code`);
    return res.data.inviteCode as string;
  },

  async joinByInviteCode(inviteCode: string): Promise<Workspace> {
    const { data: res } = await api.post('/workspaces/join', { inviteCode });
    return res.data.workspace as Workspace;
  },

  async toggleFavorite(id: string): Promise<Workspace> {
    const { data: res } = await api.post(`/workspaces/${id}/favorite`);
    return res.data.data as Workspace;
  },

  async getSharedWorkspaces(): Promise<Workspace[]> {
    const { data } = await api.get('/shared/workspaces');
    return data.data.workspaces as Workspace[];
  },
};
