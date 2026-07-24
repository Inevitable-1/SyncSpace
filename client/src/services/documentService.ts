import api from './api';
import type { CodeDocument } from '../types';

export const documentService = {
  async getByRoom(roomId: string): Promise<CodeDocument[]> {
    const response = await api.get(`/documents/room/${roomId}`);
    return response.data.data.documents;
  },

  async getById(id: string): Promise<CodeDocument> {
    const response = await api.get(`/documents/${id}`);
    return response.data.data.document;
  },

  async create(data: {
    name: string;
    content?: string;
    language?: string;
    roomId: string;
    workspaceId: string;
    parentPath?: string;
    isFolder?: boolean;
  }): Promise<CodeDocument> {
    const response = await api.post('/documents', data);
    return response.data.data.document;
  },

  async update(
    id: string,
    data: { content?: string; name?: string; language?: string },
  ): Promise<CodeDocument> {
    const response = await api.put(`/documents/${id}`, data);
    return response.data.data.document;
  },

  async rename(id: string, name: string): Promise<CodeDocument> {
    const response = await api.put(`/documents/${id}/rename`, { name });
    return response.data.data.document;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
};
