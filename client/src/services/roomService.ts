import api from './api';
import type { Room } from '../types';

export const roomService = {
  async getAll(workspaceId?: string): Promise<Room[]> {
    const params = workspaceId ? { workspaceId } : {};
    const response = await api.get('/rooms', { params });
    return response.data.data.rooms;
  },

  async getOne(id: string): Promise<Room> {
    const response = await api.get(`/rooms/${id}`);
    return response.data.data.room;
  },

  async create(data: { name: string; type?: string; workspaceId: string }): Promise<Room> {
    const response = await api.post('/rooms', data);
    return response.data.data.room;
  },

  async update(id: string, data: { name?: string; type?: string }): Promise<Room> {
    const response = await api.put(`/rooms/${id}`, data);
    return response.data.data.room;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/rooms/${id}`);
  },

  async restore(id: string): Promise<Room> {
    const response = await api.post(`/rooms/${id}/restore`);
    return response.data.data.room;
  },

  async join(inviteCode: string): Promise<Room> {
    const response = await api.post('/rooms/join', { inviteCode });
    return response.data.data.room;
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
    const response = await api.get('/rooms/stats');
    return response.data.data;
  },

  async search(q: string): Promise<Room[]> {
    const response = await api.get('/rooms', { params: { q } });
    return response.data.data.rooms;
  },
};
