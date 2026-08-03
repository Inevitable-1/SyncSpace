import api from './api';
import { demo, noop } from './demo';
import {
  demoMeetings,
  getMeeting,
  getWorkspace,
  demoUser,
  demoMeetingStats,
} from '../data/demoData';
import type { Meeting, MeetingStats } from '../types';

function buildDemoMeeting(data: {
  name: string;
  description?: string;
  workspace: string;
  participants?: string[];
  scheduledAt: string;
  duration?: number;
  agenda?: string;
}): Meeting {
  const nowIso = new Date().toISOString();
  const workspace = getWorkspace(data.workspace) || demoMeetings[0].workspace;
  return {
    _id: `meet-demo-${Date.now()}`,
    name: data.name,
    description: data.description || '',
    workspace,
    host: demoUser,
    participants: [demoUser, ...(data.participants || []).map(() => demoUser)],
    scheduledAt: data.scheduledAt,
    duration: data.duration || 30,
    status: 'scheduled',
    agenda: data.agenda || '',
    meetingCode: `MEET-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    isDeleted: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export const meetingService = {
  async getAll(params?: { workspaceId?: string }): Promise<Meeting[]> {
    return demo(
      () => api.get('/meetings', { params }).then((response) => response.data.data.meetings),
      () => {
        if (!params?.workspaceId) return [...demoMeetings];
        return demoMeetings.filter(
          (m) =>
            (typeof m.workspace === 'object' ? m.workspace._id : m.workspace) ===
            params.workspaceId,
        );
      },
    );
  },

  async getById(id: string): Promise<Meeting> {
    return demo(
      () => api.get(`/meetings/${id}`).then((response) => response.data.data.meeting),
      () => getMeeting(id) || demoMeetings[0],
    );
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
    return demo(
      () => api.post('/meetings', data).then((response) => response.data.data.meeting),
      () => buildDemoMeeting(data),
    );
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
    return demo(
      () => api.put(`/meetings/${id}`, data).then((response) => response.data.data.meeting),
      () => {
        const meeting = getMeeting(id) || demoMeetings[0];
        return { ...meeting, ...data, updatedAt: new Date().toISOString() };
      },
    );
  },

  async delete(id: string): Promise<void> {
    await noop(() => api.delete(`/meetings/${id}`));
  },

  async start(id: string): Promise<Meeting> {
    return demo(
      () => api.post(`/meetings/${id}/start`).then((response) => response.data.data.meeting),
      () => {
        const meeting = getMeeting(id) || demoMeetings[0];
        return { ...meeting, status: 'ongoing' as const, updatedAt: new Date().toISOString() };
      },
    );
  },

  async end(id: string): Promise<Meeting> {
    return demo(
      () => api.post(`/meetings/${id}/end`).then((response) => response.data.data.meeting),
      () => {
        const meeting = getMeeting(id) || demoMeetings[0];
        return {
          ...meeting,
          status: 'completed' as const,
          endedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      },
    );
  },

  async join(id: string): Promise<Meeting> {
    return demo(
      () => api.post(`/meetings/${id}/join`).then((response) => response.data.data.meeting),
      () => getMeeting(id) || demoMeetings[0],
    );
  },

  async getStats(): Promise<MeetingStats> {
    return demo(
      () => api.get('/meetings/stats').then((response) => response.data.data.stats),
      () => demoMeetingStats,
    );
  },
};
