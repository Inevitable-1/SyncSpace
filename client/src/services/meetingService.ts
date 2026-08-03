import api from './api';
import type { Meeting, MeetingStats } from '../types';

export const meetingService = {
  async getAll(params?: { workspaceId?: string }): Promise<Meeting[]> {
    const response = await api.get('/meetings', { params });
    return response.data.data.meetings;
  },

  async getById(id: string): Promise<Meeting> {
    const response = await api.get(`/meetings/${id}`);
    return response.data.data.meeting;
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
    const response = await api.post('/meetings', data);
    return response.data.data.meeting;
  },

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      participants: string[];
      scheduledAt: string;
      duration: number;
      agenda: string;
      status: string;
    }>,
  ): Promise<Meeting> {
    const response = await api.put(`/meetings/${id}`, data);
    return response.data.data.meeting;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/meetings/${id}`);
  },

  async start(id: string): Promise<Meeting> {
    const response = await api.post(`/meetings/${id}/start`);
    return response.data.data.meeting;
  },

  async end(id: string): Promise<Meeting> {
    const response = await api.post(`/meetings/${id}/end`);
    return response.data.data.meeting;
  },

  async join(id: string): Promise<Meeting> {
    const response = await api.post(`/meetings/${id}/join`);
    return response.data.data.meeting;
  },

  async getStats(): Promise<MeetingStats> {
    const response = await api.get('/meetings/stats');
    return response.data.data.stats;
  },
};
