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
    let list = getAllDemoWorkspaces()
      .filter((ws) => !ws.isDeleted)
      .map(toWorkspaceShape);
    const search = params?.search?.toLowerCase();
    if (search) {
      list = list.filter(
        (ws) =>
          ws.name.toLowerCase().includes(search) || ws.description.toLowerCase().includes(search),
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

  async create(data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    isPublic?: boolean;
  }): Promise<Workspace> {
    const ws = createDemoWorkspace(data);
    return toWorkspaceShape(ws);
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
    const updated = updateDemoWorkspace(id, data) || getDemoWorkspace(id);
    return toWorkspaceShape(updated || getAllDemoWorkspaces()[0]);
  },

  async delete(id: string): Promise<void> {
    removeDemoWorkspace(id);
  },

  async restore(id: string): Promise<Workspace> {
    return toShape(restoreDemoWorkspace(id)?.id || id);
  },

  async getTrash(): Promise<{ workspaces: Workspace[]; rooms: { _id: string }[] }> {
    const workspaces = getAllDemoWorkspaces()
      .filter((ws) => ws.isDeleted)
      .map(toWorkspaceShape);
    const rooms = getAllDemoWorkspaces()
      .filter((ws) => ws.isDeleted)
      .flatMap((ws) => ws.rooms.map((r) => ({ _id: r._id })));
    return { workspaces, rooms };
  },

  async regenerateInviteCode(id: string): Promise<string> {
    const code = `WS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    updateDemoWorkspace(id, { inviteCode: code });
    return code;
  },

  async joinByInviteCode(inviteCode: string): Promise<Workspace> {
    const ws = getDemoWorkspaceByInviteCode(inviteCode) || getAllDemoWorkspaces()[0];
    return toWorkspaceShape(ws);
  },

  async toggleFavorite(id: string): Promise<Workspace> {
    const ws = getDemoWorkspace(id) || getAllDemoWorkspaces()[0];
    return toWorkspaceShape(updateDemoWorkspace(id, { isFavorite: !ws.isFavorite }) || ws);
  },
};
