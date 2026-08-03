import api from './api';
import { demo, noop } from './demo';
import { demoWorkspaces, getWorkspace, demoRooms, demoUser } from '../data/demoData';
import type { Workspace } from '../types';

export interface WorkspaceQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  isPublic?: boolean;
}

function buildDemoWorkspace(data: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic?: boolean;
}): Workspace {
  const nowIso = new Date().toISOString();
  return {
    _id: `ws-demo-${Date.now()}`,
    name: data.name,
    description: data.description || '',
    color: data.color || '#6366f1',
    icon: data.icon || '📁',
    isPublic: data.isPublic ?? false,
    inviteCode: `WS-DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    owner: demoUser.id,
    members: [demoUser.id],
    memberCount: 1,
    roomCount: 0,
    isDeleted: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export const workspaceService = {
  async getAll(params?: WorkspaceQueryParams): Promise<Workspace[]> {
    return demo(
      () => api.get('/workspaces', { params }).then((response) => response.data.data.workspaces),
      () => {
        let list = [...demoWorkspaces];
        const search = params?.search?.toLowerCase();
        if (search) {
          list = list.filter(
            (ws) =>
              ws.name.toLowerCase().includes(search) ||
              ws.description.toLowerCase().includes(search),
          );
        }
        if (params?.isPublic !== undefined) {
          list = list.filter((ws) => ws.isPublic === params.isPublic);
        }
        if (params?.limit) {
          list = list.slice(0, params.limit);
        }
        return list;
      },
    );
  },

  async getOne(id: string): Promise<{ workspace: Workspace; roomCount: number }> {
    return demo(
      () => api.get(`/workspaces/${id}`).then((response) => response.data.data),
      () => {
        const workspace = getWorkspace(id) || demoWorkspaces[0];
        return {
          workspace,
          roomCount: demoRooms.filter(
            (r) => (typeof r.workspace === 'object' ? r.workspace._id : r.workspace) === id,
          ).length,
        };
      },
    );
  },

  async create(data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    isPublic?: boolean;
  }): Promise<Workspace> {
    return demo(
      () => api.post('/workspaces', data).then((response) => response.data.data.workspace),
      () => buildDemoWorkspace(data),
    );
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
    return demo(
      () => api.put(`/workspaces/${id}`, data).then((response) => response.data.data.workspace),
      () => {
        const workspace =
          getWorkspace(id) || buildDemoWorkspace({ name: data.name || 'Workspace' });
        return { ...workspace, ...data, updatedAt: new Date().toISOString() };
      },
    );
  },

  async delete(id: string): Promise<void> {
    await noop(() => api.delete(`/workspaces/${id}`));
  },

  async restore(id: string): Promise<Workspace> {
    return demo(
      () => api.post(`/workspaces/${id}/restore`).then((response) => response.data.data.workspace),
      () => getWorkspace(id) || demoWorkspaces[0],
    );
  },

  async getTrash(): Promise<{ workspaces: Workspace[]; rooms: { _id: string }[] }> {
    return demo(
      () => api.get('/workspaces/trash').then((response) => response.data.data),
      () => ({ workspaces: [], rooms: [] }),
    );
  },

  async search(q: string, params?: WorkspaceQueryParams): Promise<Workspace[]> {
    return demo(
      () =>
        api
          .get('/workspaces/search', { params: { q, ...params } })
          .then((response) => response.data.data.workspaces),
      () => {
        const search = q.toLowerCase();
        return demoWorkspaces.filter(
          (ws) =>
            ws.name.toLowerCase().includes(search) || ws.description.toLowerCase().includes(search),
        );
      },
    );
  },

  async regenerateInviteCode(id: string): Promise<string> {
    return demo(
      () =>
        api.post(`/workspaces/${id}/invite-code`).then((response) => response.data.data.inviteCode),
      () => `WS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    );
  },

  async joinByInviteCode(inviteCode: string): Promise<Workspace> {
    return demo(
      () =>
        api
          .post('/workspaces/join', { inviteCode })
          .then((response) => response.data.data.workspace),
      () => demoWorkspaces[0],
    );
  },

  async toggleFavorite(id: string): Promise<Workspace> {
    return demo(
      () => api.post(`/workspaces/${id}/favorite`).then((response) => response.data.data.workspace),
      () => {
        const workspace = getWorkspace(id) || demoWorkspaces[0];
        return {
          ...workspace,
          isFavorite: !workspace.isFavorite,
          updatedAt: new Date().toISOString(),
        };
      },
    );
  },
};
