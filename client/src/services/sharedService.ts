import api from './api';
import type { Workspace, Room, UploadedFile } from '../types';

export const sharedService = {
  async getSharedWorkspaces(): Promise<Workspace[]> {
    const { data } = await api.get('/shared/workspaces');
    return data.data.workspaces as Workspace[];
  },

  async getSharedRooms(): Promise<Room[]> {
    const { data } = await api.get('/shared/rooms');
    return data.data.rooms as Room[];
  },

  async getSharedFiles(): Promise<UploadedFile[]> {
    const { data } = await api.get('/shared/files');
    return data.data.files as UploadedFile[];
  },
};
