import api from './api';
import { branch } from './demo';
import {
  getDemoFilesForWorkspace,
  getDemoFile,
  addDemoFile,
  updateDemoFile,
  deleteDemoFile,
  getAllDemoWorkspaces,
} from '../data/demoWorkspaces';
import { demoFolders } from '../data/demoData';
import type { UploadedFile } from '../types';

export const fileService = {
  async getAll(params: {
    workspaceId: string;
    folder?: string;
    search?: string;
  }): Promise<UploadedFile[]> {
    return branch(
      () => {
        let list = getDemoFilesForWorkspace(params.workspaceId).filter((f) => !f.isDeleted);
        if (params.folder) {
          list = list.filter((f) => f.folder === params.folder);
        }
        if (params.search) {
          const search = params.search.toLowerCase();
          list = list.filter((f) => f.name.toLowerCase().includes(search));
        }
        return list;
      },
      async () => {
        const { data } = await api.get('/files', { params });
        return data.data.files as UploadedFile[];
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
    return branch(
      () =>
        addDemoFile(data.workspaceId, {
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          folder: data.folder || 'Root',
          roomId: data.roomId,
        }),
      async () => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workspace', data.workspaceId);
        if (data.roomId) formData.append('roomId', data.roomId);
        if (data.folder) formData.append('folder', data.folder);
        const { data: res } = await api.post('/files', formData);
        return res.data.file as UploadedFile;
      },
    );
  },

  async delete(id: string): Promise<void> {
    return branch(
      () => {
        deleteDemoFile(id);
      },
      async () => {
        await api.delete(`/files/${id}`);
      },
    );
  },

  async rename(id: string, name: string): Promise<UploadedFile> {
    return branch(
      () => {
        const file = updateDemoFile(id, { name, originalName: name });
        if (file) return file;
        return getDemoFile(id) || getAllDemoWorkspaces().flatMap((ws) => ws.files)[0];
      },
      async () => {
        const { data: res } = await api.put(`/files/${id}/rename`, { name });
        return res.data.file as UploadedFile;
      },
    );
  },

  async download(id: string, fileName: string): Promise<void> {
    return branch(
      () => {
        const blob = new Blob([`Demo file: ${fileName}`], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      },
      async () => {
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
    );
  },

  async getFolders(workspaceId: string): Promise<string[]> {
    return branch(
      () => demoFolders,
      async () => {
        const { data } = await api.get('/files/folders', { params: { workspaceId } });
        return data.data.folders as string[];
      },
    );
  },
};
