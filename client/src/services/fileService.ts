import api from './api';
import { demo, noop } from './demo';
import { getFilesForWorkspace, demoFiles, demoFolders, demoUser } from '../data/demoData';
import type { UploadedFile } from '../types';

export const fileService = {
  async getAll(params: {
    workspaceId: string;
    folder?: string;
    search?: string;
  }): Promise<UploadedFile[]> {
    return demo(
      () => api.get('/files', { params }).then((response) => response.data.data.files),
      () => {
        let list = getFilesForWorkspace(params.workspaceId);
        if (params.folder) {
          list = list.filter((f) => f.folder === params.folder);
        }
        if (params.search) {
          const search = params.search.toLowerCase();
          list = list.filter((f) => f.name.toLowerCase().includes(search));
        }
        return list;
      },
    );
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

    return demo(
      () =>
        api
          .post('/files', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          .then((response) => response.data.data.file),
      () => {
        const nowIso = new Date().toISOString();
        return {
          _id: `file-demo-${Date.now()}`,
          name: file.name,
          originalName: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          path: `/${data.folder || 'Root'}/${file.name}`,
          workspace: data.workspaceId,
          room: data.roomId,
          folder: data.folder || 'Root',
          uploader: demoUser,
          isDeleted: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
      },
    );
  },

  async delete(id: string): Promise<void> {
    await noop(() => api.delete(`/files/${id}`));
  },

  async rename(id: string, name: string): Promise<UploadedFile> {
    return demo(
      () => api.put(`/files/${id}/rename`, { name }).then((response) => response.data.data.file),
      () => {
        const file = demoFiles.find((f) => f._id === id) || demoFiles[0];
        return { ...file, name, originalName: name, updatedAt: new Date().toISOString() };
      },
    );
  },

  async download(id: string, fileName: string): Promise<void> {
    await noop(async () => {
      const response = await api.get(`/files/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  },

  async getFolders(workspaceId: string): Promise<string[]> {
    return demo(
      () =>
        api
          .get('/files/folders', { params: { workspaceId } })
          .then((response) => response.data.data.folders),
      () => demoFolders,
    );
  },
};
