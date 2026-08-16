import api from './api';
import type { Meeting, MeetingStats } from '../types';

export const meetingService = {
  async getAll(params?: { workspaceId?: string }): Promise<Meeting[]> {
    const { data } = await api.get('/meetings', { params });
    return data.data.meetings as Meeting[];
  },

  async create(data: {
    name: string;
    description?: string;
    workspace: string;
    participants?: string[];
    scheduledAt: string;
    duration?: number;
    agenda?: string;
  }): Promise<Meeting> {
    const { data: res } = await api.post('/meetings', data);
    return res.data.meeting as Meeting;
  },

  async update(id: string, patch: Partial<Meeting>): Promise<Meeting> {
    const { data: res } = await api.put(`/meetings/${id}`, patch);
    return res.data.meeting as Meeting;
  },

  async start(id: string): Promise<Meeting> {
    const { data: res } = await api.post(`/meetings/${id}/start`);
    return res.data.meeting as Meeting;
  },

  async end(id: string): Promise<Meeting> {
    const { data: res } = await api.post(`/meetings/${id}/end`);
    return res.data.meeting as Meeting;
  },

  async join(id: string): Promise<Meeting> {
    const { data: res } = await api.post(`/meetings/${id}/join`);
    return res.data.meeting as Meeting;
  },

  async getStats(): Promise<MeetingStats> {
    const { data } = await api.get('/meetings/stats');
    return data.data.stats as MeetingStats;
  },
};
