import api from './api';
import { demo, noop } from './demo';
import { demoNotifications } from '../data/demoData';
import type { Notification } from '../types';

export const notificationService = {
  async getAll(limit?: number): Promise<{ notifications: Notification[]; unreadCount: number }> {
    return demo(
      () => {
        const params = limit ? { limit } : {};
        return api.get('/notifications', { params }).then((response) => response.data.data);
      },
      () => {
        const list = limit ? demoNotifications.slice(0, limit) : [...demoNotifications];
        return {
          notifications: list,
          unreadCount: demoNotifications.filter((n) => !n.isRead).length,
        };
      },
    );
  },

  async markAsRead(id: string): Promise<void> {
    await noop(() => api.put(`/notifications/${id}/read`));
  },

  async markAllAsRead(): Promise<void> {
    await noop(() => api.put('/notifications/read-all'));
  },

  async delete(id: string): Promise<void> {
    await noop(() => api.delete(`/notifications/${id}`));
  },

  async clearAll(): Promise<void> {
    await noop(() => api.delete('/notifications/clear'));
  },
};
