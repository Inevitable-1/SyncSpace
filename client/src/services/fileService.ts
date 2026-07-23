import api from './api';
import type { UploadedFile } from '../types';

export const fileService = {
  async getAll(params: {
    workspaceId: string;
    folder?: string;
    search?: string;
  }): Promise<UploadedFile[]> {
    const response = await api.get('/files', { params });
    return response.data.data.files;
  },

  async upload(data: {
    name: string;
    originalName: string;
    mimeType: string;
    size: number;
    workspaceId: string;
    roomId?: string;
    folder?: string;
  }): Promise<UploadedFile> {
    const response = await api.post('/files', data);
    return response.data.data.file;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/files/${id}`);
  },

  async rename(id: string, name: string): Promise<UploadedFile> {
    const response = await api.put(`/files/${id}/rename`, { name });
    return response.data.data.file;
  },

  async getFolders(workspaceId: string): Promise<string[]> {
    const response = await api.get('/files/folders', { params: { workspaceId } });
    return response.data.data.folders;
  },
};
