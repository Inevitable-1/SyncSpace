import { getAllDemoActivities, getAllDemoWorkspaces } from '../data/demoWorkspaces';
import type { Activity } from '../types';

export const activityService = {
  async getAll(entityType?: string): Promise<Activity[]> {
    if (!entityType) return getAllDemoActivities();
    return getAllDemoActivities().filter((a) => a.entityType === entityType);
  },

  async delete(id: string): Promise<void> {
    for (const ws of getAllDemoWorkspaces()) {
      ws.activity = ws.activity.filter((a) => a._id !== id);
    }
  },

  async clearAll(): Promise<void> {
    for (const ws of getAllDemoWorkspaces()) {
      ws.activity = [];
    }
  },
};
