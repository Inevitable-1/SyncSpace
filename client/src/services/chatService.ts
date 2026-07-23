import api from './api';
import type { ChatMessage } from '../types';

export const chatService = {
  async getMessages(roomId: string, limit?: number, before?: string): Promise<ChatMessage[]> {
    const params: Record<string, string | number> = {};
    if (limit) params.limit = limit;
    if (before) params.before = before;
    const response = await api.get(`/chat/${roomId}`, { params });
    return response.data.data.messages;
  },

  async sendMessage(
    roomId: string,
    content: string,
    type?: string,
    replyTo?: string,
  ): Promise<ChatMessage> {
    const response = await api.post(`/chat/${roomId}`, { content, type, replyTo });
    return response.data.data.message;
  },

  async editMessage(messageId: string, content: string): Promise<ChatMessage> {
    const response = await api.put(`/chat/${messageId}`, { content });
    return response.data.data.message;
  },

  async deleteMessage(messageId: string): Promise<void> {
    await api.delete(`/chat/${messageId}`);
  },

  async markSeen(roomId: string): Promise<void> {
    await api.post(`/chat/${roomId}/seen`);
  },
};
