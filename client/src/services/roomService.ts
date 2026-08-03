import {
  getAllDemoRooms,
  getDemoRoomsForWorkspace,
  getDemoRoom,
  addDemoRoom,
  updateDemoRoom,
  deleteDemoRoom,
  getDemoStats,
} from '../data/demoWorkspaces';
import type { Room } from '../types';

export const roomService = {
  async getAll(workspaceId?: string): Promise<Room[]> {
    if (!workspaceId) return getAllDemoRooms().filter((r) => !r.isDeleted);
    return getDemoRoomsForWorkspace(workspaceId).filter((r) => !r.isDeleted);
  },

  async getOne(id: string): Promise<Room> {
    return getDemoRoom(id) || getAllDemoRooms()[0];
  },

  async create(data: { name: string; type?: string; workspaceId: string }): Promise<Room> {
    return addDemoRoom(data.workspaceId, data);
  },

  async update(id: string, data: { name?: string; type?: string }): Promise<Room> {
    const room = updateDemoRoom(id, { ...data, type: data.type as Room['type'] });
    if (room) return room;
    return getDemoRoom(id) || getAllDemoRooms()[0];
  },

  async delete(id: string): Promise<void> {
    deleteDemoRoom(id);
  },

  async restore(id: string): Promise<Room> {
    const room = getDemoRoom(id) || getAllDemoRooms()[0];
    updateDemoRoom(id, { isDeleted: false });
    return room;
  },

  async join(inviteCode: string): Promise<Room> {
    return getAllDemoRooms().find((r) => r.inviteCode === inviteCode) || getAllDemoRooms()[0];
  },

  async getStats() {
    return getDemoStats();
  },

  async search(q: string): Promise<Room[]> {
    const search = q.toLowerCase();
    return getAllDemoRooms().filter((r) => r.name.toLowerCase().includes(search));
  },
};
