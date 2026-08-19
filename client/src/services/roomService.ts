import api from './api';
import type { Room } from '../types';

export const roomService = {
  async getAll(workspaceId?: string): Promise<Room[]> {
    const { data } = await api.get('/rooms', {
      params: workspaceId ? { workspaceId } : undefined,
    });
    return data.data.rooms as Room[];
  },

  async create(data: { name: string; type?: string; workspaceId?: string }): Promise<Room> {
    const { data: res } = await api.post('/rooms', data);
    return res.data.room as Room;
  },

  async update(id: string, data: { name?: string; type?: string }): Promise<Room> {
    const { data: res } = await api.put(`/rooms/${id}`, data);
    return res.data.room as Room;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/rooms/${id}`);
  },

  async restore(id: string): Promise<Room> {
    const { data: res } = await api.post(`/rooms/${id}/restore`);
    return res.data.room as Room;
  },

  async join(inviteCode: string): Promise<Room> {
    const { data: res } = await api.post('/rooms/join', { inviteCode });
    return res.data.room as Room;
  },
};
