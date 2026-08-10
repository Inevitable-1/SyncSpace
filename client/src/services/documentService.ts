import api from './api';
import { demo, noop } from './demo';
import { getDocumentsForRoom, demoDocuments, demoUser } from '../data/demoData';
import type { CodeDocument } from '../types';

function buildDemoDocument(data: {
  name: string;
  content?: string;
  language?: string;
  roomId: string;
  workspaceId: string;
  parentPath?: string;
  isFolder?: boolean;
}): CodeDocument {
  const nowIso = new Date().toISOString();
  return {
    _id: `doc-demo-${Date.now()}`,
    name: data.name,
    path: `${data.parentPath || ''}/${data.name}`,
    content: data.content || '',
    language: data.language || 'plaintext',
    room: data.roomId,
    workspace: data.workspaceId,
    createdBy: demoUser,
    lastEditedBy: demoUser,
    parentPath: data.parentPath,
    isFolder: data.isFolder || false,
    isDeleted: false,
    versionTimestamps: [nowIso],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export const documentService = {
  async getByRoom(roomId: string): Promise<CodeDocument[]> {
    return demo(
      () => api.get(`/documents/room/${roomId}`).then((response) => response.data.data.documents),
      () => getDocumentsForRoom(roomId),
    );
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
    return demo(
      () => api.post('/documents', data).then((response) => response.data.data.document),
      () => buildDemoDocument(data),
    );
  },

  async update(
    id: string,
    data: { content?: string; name?: string; language?: string },
  ): Promise<CodeDocument> {
    return demo(
      () => api.put(`/documents/${id}`, data).then((response) => response.data.data.document),
      () => {
        const doc = demoDocuments.find((d) => d._id === id) || demoDocuments[0];
        return { ...doc, ...data, updatedAt: new Date().toISOString() };
      },
    );
  },

  async rename(id: string, name: string): Promise<CodeDocument> {
    return demo(
      () =>
        api
          .put(`/documents/${id}/rename`, { name })
          .then((response) => response.data.data.document),
      () => {
        const doc = demoDocuments.find((d) => d._id === id) || demoDocuments[0];
        return { ...doc, name, updatedAt: new Date().toISOString() };
      },
    );
  },

  async delete(id: string): Promise<void> {
    await noop(() => api.delete(`/documents/${id}`));
  },
};
