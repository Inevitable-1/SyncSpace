import api from './api';
import type { ChatMessage } from '../types';

export const chatService = {
  async getMessages(roomId: string, limit?: number, before?: string): Promise<ChatMessage[]> {
    const params: Record<string, string | number> = {};
    if (limit) params.limit = limit;
    if (before) params.before = before;
    const { data } = await api.get(`/chat/${roomId}`, { params });
    return data.data.messages as ChatMessage[];
  },

  async sendMessage(
    roomId: string,
    content: string,
    type?: string,
    replyTo?: string,
  ): Promise<ChatMessage> {
    const { data } = await api.post(`/chat/${roomId}`, { content, type, replyTo });
    return data.data.message as ChatMessage;
  },

  async editMessage(messageId: string, content: string): Promise<ChatMessage> {
    const { data } = await api.put(`/chat/${messageId}`, { content });
    return data.data.message as ChatMessage;
  },

  async deleteMessage(messageId: string): Promise<void> {
    await api.delete(`/chat/${messageId}`);
  },
};
