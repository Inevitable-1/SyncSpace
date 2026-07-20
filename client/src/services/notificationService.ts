import api from './api';
import type { Notification } from '../types';

export const notificationService = {
  async getAll(limit?: number): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const params = limit ? { limit } : {};
    const response = await api.get('/notifications', { params });
    return response.data.data;
  },

  async markAsRead(id: string): Promise<void> {
    await api.put(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.put('/notifications/read-all');
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },

  async clearAll(): Promise<void> {
    await api.delete('/notifications/clear');
  },
};
