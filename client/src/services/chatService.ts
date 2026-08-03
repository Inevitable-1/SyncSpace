import api from './api';
import { demo, noop } from './demo';
import { getMessagesForRoom, demoChatMessages, demoUser } from '../data/demoData';
import type { ChatMessage } from '../types';

export const chatService = {
  async getMessages(roomId: string, limit?: number, before?: string): Promise<ChatMessage[]> {
    return demo(
      () => {
        const params: Record<string, string | number> = {};
        if (limit) params.limit = limit;
        if (before) params.before = before;
        return api
          .get(`/chat/${roomId}`, { params })
          .then((response) => response.data.data.messages);
      },
      () => {
        let messages = getMessagesForRoom(roomId);
        if (before) {
          messages = messages.filter((m) => m.createdAt < before);
        }
        if (limit) {
          messages = messages.slice(-limit);
        }
        return messages;
      },
    );
  },

  async sendMessage(
    roomId: string,
    content: string,
    type?: string,
    replyTo?: string,
  ): Promise<ChatMessage> {
    return demo(
      () =>
        api
          .post(`/chat/${roomId}`, { content, type, replyTo })
          .then((response) => response.data.data.message),
      () => {
        const nowIso = new Date().toISOString();
        return {
          _id: `msg-demo-${Date.now()}`,
          room: roomId,
          sender: demoUser,
          content,
          type: (type as ChatMessage['type']) || 'text',
          replyTo,
          edited: false,
          isDeleted: false,
          seenBy: [demoUser],
          createdAt: nowIso,
          updatedAt: nowIso,
        };
      },
    );
  },

  async editMessage(messageId: string, content: string): Promise<ChatMessage> {
    return demo(
      () =>
        api.put(`/chat/${messageId}`, { content }).then((response) => response.data.data.message),
      () => {
        const message = demoChatMessages.find((m) => m._id === messageId) || demoChatMessages[0];
        return {
          ...message,
          content,
          edited: true,
          editedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      },
    );
  },

  async deleteMessage(messageId: string): Promise<void> {
    await noop(() => api.delete(`/chat/${messageId}`));
  },

  async markSeen(roomId: string): Promise<void> {
    await noop(() => api.post(`/chat/${roomId}/seen`));
  },
};
