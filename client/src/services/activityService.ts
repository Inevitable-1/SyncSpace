import api from './api';
import { demo, noop } from './demo';
import { demoActivities } from '../data/demoData';
import type { Activity } from '../types';

export const activityService = {
  async getAll(entityType?: string): Promise<Activity[]> {
    return demo(
      () => {
        const params = entityType ? { entityType } : {};
        return api.get('/activities', { params }).then((response) => response.data.data.activities);
      },
      () => {
        if (!entityType) return [...demoActivities];
        return demoActivities.filter((a) => a.entityType === entityType);
      },
    );
  },

  async delete(id: string): Promise<void> {
    await noop(() => api.delete(`/activities/${id}`));
  },

  async clearAll(): Promise<void> {
    await noop(() => api.delete('/activities/clear'));
  },
};
