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

  async upload(
    file: File,
    data: {
      workspaceId: string;
      roomId?: string;
      folder?: string;
    },
  ): Promise<UploadedFile> {
    return addDemoFile(data.workspaceId, {
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      folder: data.folder || 'Root',
      roomId: data.roomId,
    });
  },

  async delete(id: string): Promise<void> {
    deleteDemoFile(id);
  },

  async rename(id: string, name: string): Promise<UploadedFile> {
    const file = updateDemoFile(id, { name, originalName: name });
    if (file) return file;
    return getDemoFile(id) || getAllDemoWorkspaces().flatMap((ws) => ws.files)[0];
  },

  async download(_id: string, fileName: string): Promise<void> {
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

  async getFolders(_workspaceId: string): Promise<string[]> {
    return demoFolders;
  },
};
