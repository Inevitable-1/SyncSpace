import api from './api';
import { branch } from './demo';
import {
  getAllDemoWorkspaces,
  getDemoWorkspace,
  createDemoWorkspace,
  updateDemoWorkspace,
  removeDemoWorkspace,
  restoreDemoWorkspace,
  toWorkspaceShape,
  getDemoWorkspaceByInviteCode,
} from '../data/demoWorkspaces';
import type { Workspace } from '../types';

export interface WorkspaceQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  isPublic?: boolean;
}

function toShape(id: string): Workspace {
  return toWorkspaceShape(getDemoWorkspace(id) || getAllDemoWorkspaces()[0]);
}

export const workspaceService = {
  async getAll(params?: WorkspaceQueryParams): Promise<Workspace[]> {
    return branch(
      () => {
        let list = getAllDemoWorkspaces()
          .filter((ws) => !ws.isDeleted)
          .map(toWorkspaceShape);
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
      async () => {
        const { data } = await api.get('/workspaces', { params });
        return data.data.workspaces as Workspace[];
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
    return branch(
      () => toWorkspaceShape(createDemoWorkspace(data)),
      async () => {
        const { data: res } = await api.post('/workspaces', data);
        return res.data.workspace as Workspace;
      },
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
    return branch(
      () => {
        const updated = updateDemoWorkspace(id, data) || getDemoWorkspace(id);
        return toWorkspaceShape(updated || getAllDemoWorkspaces()[0]);
      },
      async () => {
        const { data: res } = await api.put(`/workspaces/${id}`, data);
        return res.data.workspace as Workspace;
      },
    );
  },

  async delete(id: string): Promise<void> {
    return branch(
      () => {
        removeDemoWorkspace(id);
      },
      async () => {
        await api.delete(`/workspaces/${id}`);
      },
    );
  },

  async restore(id: string): Promise<Workspace> {
    return branch(
      () => toShape(restoreDemoWorkspace(id)?.id || id),
      async () => {
        const { data: res } = await api.post(`/workspaces/${id}/restore`);
        return res.data.workspace as Workspace;
      },
    );
  },

  async getTrash(): Promise<{ workspaces: Workspace[]; rooms: { _id: string }[] }> {
    return branch(
      () => {
        const workspaces = getAllDemoWorkspaces()
          .filter((ws) => ws.isDeleted)
          .map(toWorkspaceShape);
        const rooms = getAllDemoWorkspaces()
          .filter((ws) => ws.isDeleted)
          .flatMap((ws) => ws.rooms.map((r) => ({ _id: r._id })));
        return { workspaces, rooms };
      },
      async () => {
        const { data } = await api.get('/workspaces/trash');
        return data.data as { workspaces: Workspace[]; rooms: { _id: string }[] };
      },
    );
  },

  async regenerateInviteCode(id: string): Promise<string> {
    return branch(
      () => {
        const code = `WS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        updateDemoWorkspace(id, { inviteCode: code });
        return code;
      },
      async () => {
        const { data: res } = await api.post(`/workspaces/${id}/invite-code`);
        return res.data.inviteCode as string;
      },
    );
  },

  async joinByInviteCode(inviteCode: string): Promise<Workspace> {
    return branch(
      () => toWorkspaceShape(getDemoWorkspaceByInviteCode(inviteCode) || getAllDemoWorkspaces()[0]),
      async () => {
        const { data: res } = await api.post('/workspaces/join', { inviteCode });
        return res.data.workspace as Workspace;
      },
    );
  },

  async toggleFavorite(id: string): Promise<Workspace> {
    return branch(
      () => {
        const ws = getDemoWorkspace(id) || getAllDemoWorkspaces()[0];
        return toWorkspaceShape(updateDemoWorkspace(id, { isFavorite: !ws.isFavorite }) || ws);
      },
      async () => {
        const { data: res } = await api.post(`/workspaces/${id}/favorite`);
        return res.data.data as Workspace;
      },
    );
  },
};
