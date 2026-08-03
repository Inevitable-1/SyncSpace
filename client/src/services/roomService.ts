import api from './api';
import { demo, noop } from './demo';
import { demoRooms, getRoom, demoWorkspaces, demoUser } from '../data/demoData';
import { demoStats } from '../data/demoData';
import type { Room } from '../types';

function buildDemoRoom(data: { name: string; type?: string; workspaceId: string }): Room {
  const nowIso = new Date().toISOString();
  const workspace = demoWorkspaces.find((ws) => ws._id === data.workspaceId) || demoWorkspaces[0];
  return {
    _id: `room-demo-${Date.now()}`,
    name: data.name,
    type: (data.type as Room['type']) || 'whiteboard',
    workspace,
    owner: demoUser.id,
    inviteCode: `ROOM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    isActive: false,
    participants: [demoUser.id],
    isDeleted: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export const roomService = {
  async getAll(workspaceId?: string): Promise<Room[]> {
    return demo(
      () => {
        const params = workspaceId ? { workspaceId } : {};
        return api.get('/rooms', { params }).then((response) => response.data.data.rooms);
      },
      () => {
        if (!workspaceId) return [...demoRooms];
        return demoRooms.filter(
          (r) => (typeof r.workspace === 'object' ? r.workspace._id : r.workspace) === workspaceId,
        );
      },
    );
  },

  async getOne(id: string): Promise<Room> {
    return demo(
      () => api.get(`/rooms/${id}`).then((response) => response.data.data.room),
      () => getRoom(id) || demoRooms[0],
    );
  },

  async create(data: { name: string; type?: string; workspaceId: string }): Promise<Room> {
    return demo(
      () => api.post('/rooms', data).then((response) => response.data.data.room),
      () => buildDemoRoom(data),
    );
  },

  async update(id: string, data: { name?: string; type?: string }): Promise<Room> {
    return demo(
      () => api.put(`/rooms/${id}`, data).then((response) => response.data.data.room),
      () => {
        const room = getRoom(id) || demoRooms[0];
        return { ...room, ...data, updatedAt: new Date().toISOString() };
      },
    );
  },

  async delete(id: string): Promise<void> {
    await noop(() => api.delete(`/rooms/${id}`));
  },

  async restore(id: string): Promise<Room> {
    return demo(
      () => api.post(`/rooms/${id}/restore`).then((response) => response.data.data.room),
      () => getRoom(id) || demoRooms[0],
    );
  },

  async join(inviteCode: string): Promise<Room> {
    return demo(
      () => api.post('/rooms/join', { inviteCode }).then((response) => response.data.data.room),
      () => demoRooms[0],
    );
  },

  async getStats(): Promise<{
    totalWorkspaces: number;
    totalRooms: number;
    filesShared: number;
    onlineMembers: number;
    activeSessions: number;
    recentActivity: number;
    projectsCreated: number;
    growth: {
      workspaces: number;
      rooms: number;
      members: number;
      activity: number;
    };
  }> {
    return demo(
      () => api.get('/rooms/stats').then((response) => response.data.data),
      () => demoStats,
    );
  },

  async search(q: string): Promise<Room[]> {
    return demo(
      () => api.get('/rooms', { params: { q } }).then((response) => response.data.data.rooms),
      () => {
        const search = q.toLowerCase();
        return demoRooms.filter((r) => r.name.toLowerCase().includes(search));
      },
    );
  },
};
