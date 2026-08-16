import api from './api';
import type { UploadedFile } from '../types';

export const fileService = {
  async getAll(params: {
    workspaceId: string;
    folder?: string;
    search?: string;
  }): Promise<UploadedFile[]> {
    const { data } = await api.get('/files', { params });
    return data.data.files as UploadedFile[];
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
    const { data: res } = await api.post('/files', formData);
    return res.data.file as UploadedFile;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/files/${id}`);
  },

  async rename(id: string, name: string): Promise<UploadedFile> {
    const { data: res } = await api.put(`/files/${id}/rename`, { name });
    return res.data.file as UploadedFile;
  },

  async download(id: string, fileName: string): Promise<void> {
    const res = await api.get(`/files/${id}/download`, { responseType: 'blob' });
    const blob = res.data as Blob;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async getFolders(workspaceId: string): Promise<string[]> {
    const { data } = await api.get('/files/folders', { params: { workspaceId } });
    return data.data.folders as string[];
  },
};
