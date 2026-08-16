import api from './api';
import type { CodeDocument } from '../types';

export interface CreateDocumentRequest {
  name: string;
  content?: string;
  language?: string;
  roomId: string;
  workspaceId: string;
  parentPath?: string;
  isFolder?: boolean;
}

export const documentService = {
  async getByRoom(roomId: string): Promise<CodeDocument[]> {
    const { data } = await api.get(`/documents/room/${roomId}`);
    return data.data.documents as CodeDocument[];
  },

  async create(data: CreateDocumentRequest): Promise<CodeDocument> {
    const { data: res } = await api.post('/documents', data);
    return res.data.document as CodeDocument;
  },

  async update(
    id: string,
    data: { content?: string; name?: string; language?: string },
  ): Promise<CodeDocument> {
    const { data: res } = await api.put(`/documents/${id}`, data);
    return res.data.document as CodeDocument;
  },

  async rename(id: string, name: string): Promise<CodeDocument> {
    const { data: res } = await api.put(`/documents/${id}/rename`, { name });
    return res.data.document as CodeDocument;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
};
