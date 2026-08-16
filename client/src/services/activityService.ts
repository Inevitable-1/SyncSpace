import api from './api';
import type { Activity } from '../types';

export const activityService = {
  async getAll(entityType?: string): Promise<Activity[]> {
    const { data } = await api.get('/activities', {
      params: entityType ? { entityType } : undefined,
    });
    return data.data.activities as Activity[];
  },

  async clearAll(): Promise<void> {
    await api.delete('/activities/clear');
  },
};
