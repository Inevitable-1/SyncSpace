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

  async upload(
    file: File,
    data: {
      workspaceId: string;
      roomId?: string;
      folder?: string;
    },
  ): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspace', data.workspaceId);
    if (data.roomId) formData.append('roomId', data.roomId);
    if (data.folder) formData.append('folder', data.folder);

    const response = await api.post('/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data.file;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/files/${id}`);
  },

  async rename(id: string, name: string): Promise<UploadedFile> {
    const response = await api.put(`/files/${id}/rename`, { name });
    return response.data.data.file;
  },

  async download(id: string, fileName: string): Promise<void> {
    const response = await api.get(`/files/${id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async getFolders(workspaceId: string): Promise<string[]> {
    const response = await api.get('/files/folders', { params: { workspaceId } });
    return response.data.data.folders;
  },
};
