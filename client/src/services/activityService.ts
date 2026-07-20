import api from './api';
import type { Activity } from '../types';

export const activityService = {
  async getAll(entityType?: string): Promise<Activity[]> {
    const params = entityType ? { entityType } : {};
    const response = await api.get('/activities', { params });
    return response.data.data.activities;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/activities/${id}`);
  },

  async clearAll(): Promise<void> {
    await api.delete('/activities/clear');
  },
};
