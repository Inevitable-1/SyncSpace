import api from './api';
import { branch } from './demo';
import {
  getAllDemoRooms,
  getDemoRoomsForWorkspace,
  getDemoRoom,
  addDemoRoom,
  updateDemoRoom,
  deleteDemoRoom,
} from '../data/demoWorkspaces';
import type { Room } from '../types';

export const roomService = {
  async getAll(workspaceId?: string): Promise<Room[]> {
    return branch(
      () => {
        if (!workspaceId) return getAllDemoRooms().filter((r) => !r.isDeleted);
        return getDemoRoomsForWorkspace(workspaceId).filter((r) => !r.isDeleted);
      },
      async () => {
        const { data } = await api.get('/rooms', {
          params: workspaceId ? { workspaceId } : undefined,
        });
        return data.data.rooms as Room[];
      },
    );
  },

  async create(data: { name: string; type?: string; workspaceId: string }): Promise<Room> {
    return branch(
      () => addDemoRoom(data.workspaceId, data),
      async () => {
        const { data: res } = await api.post('/rooms', data);
        return res.data.room as Room;
      },
    );
  },

  async update(id: string, data: { name?: string; type?: string }): Promise<Room> {
    return branch(
      () => {
        const room = updateDemoRoom(id, { ...data, type: data.type as Room['type'] });
        if (room) return room;
        return getDemoRoom(id) || getAllDemoRooms()[0];
      },
      async () => {
        const { data: res } = await api.put(`/rooms/${id}`, data);
        return res.data.room as Room;
      },
    );
  },

  async delete(id: string): Promise<void> {
    return branch(
      () => {
        deleteDemoRoom(id);
      },
      async () => {
        await api.delete(`/rooms/${id}`);
      },
    );
  },

  async restore(id: string): Promise<Room> {
    return branch(
      () => {
        const room = getDemoRoom(id) || getAllDemoRooms()[0];
        updateDemoRoom(id, { isDeleted: false });
        return room;
      },
      async () => {
        const { data: res } = await api.post(`/rooms/${id}/restore`);
        return res.data.room as Room;
      },
    );
  },

  async join(inviteCode: string): Promise<Room> {
    return branch(
      () => getAllDemoRooms().find((r) => r.inviteCode === inviteCode) || getAllDemoRooms()[0],
      async () => {
        const { data: res } = await api.post('/rooms/join', { inviteCode });
        return res.data.room as Room;
      },
    );
  },
};
