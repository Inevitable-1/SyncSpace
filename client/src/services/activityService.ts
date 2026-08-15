import api from './api';
import { branch } from './demo';
import { getAllDemoActivities, getAllDemoWorkspaces } from '../data/demoWorkspaces';
import type { Activity } from '../types';

export const activityService = {
  async getAll(entityType?: string): Promise<Activity[]> {
    return branch(
      () => {
        if (!entityType) return getAllDemoActivities();
        return getAllDemoActivities().filter((a) => a.entityType === entityType);
      },
      async () => {
        const { data } = await api.get('/activities', {
          params: entityType ? { entityType } : undefined,
        });
        return data.data.activities as Activity[];
      },
    );
  },

  async clearAll(): Promise<void> {
    return branch(
      () => {
        for (const ws of getAllDemoWorkspaces()) {
          ws.activity = [];
        }
      },
      async () => {
        await api.delete('/activities/clear');
      },
    );
  },
};
