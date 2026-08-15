import api from './api';
import { branch } from './demo';
import {
  getAllDemoMeetings,
  getDemoMeetingsForWorkspace,
  getDemoMeeting,
  addDemoMeeting,
  updateDemoMeeting,
  getDemoMeetingStats,
  getDemoWorkspace,
} from '../data/demoWorkspaces';
import type { Meeting, MeetingStats, MeetingStatus } from '../types';

export const meetingService = {
  async getAll(params?: { workspaceId?: string }): Promise<Meeting[]> {
    return branch(
      () => {
        if (!params?.workspaceId) return getAllDemoMeetings().filter((m) => !m.isDeleted);
        return getDemoMeetingsForWorkspace(params.workspaceId).filter((m) => !m.isDeleted);
      },
      async () => {
        const { data } = await api.get('/meetings', { params });
        return data.data.meetings as Meeting[];
      },
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
    return branch(
      () => {
        const ws = getDemoWorkspace(data.workspace);
        if (!ws) throw new Error('Workspace not found');
        return addDemoMeeting(data.workspace, data);
      },
      async () => {
        const { data: res } = await api.post('/meetings', data);
        return res.data.meeting as Meeting;
      },
    );
  },

  async update(id: string, patch: Partial<Meeting>): Promise<Meeting> {
    return branch(
      () => {
        const meeting = updateDemoMeeting(id, patch);
        return meeting || getDemoMeeting(id) || getAllDemoMeetings()[0];
      },
      async () => {
        const { data: res } = await api.put(`/meetings/${id}`, patch);
        return res.data.meeting as Meeting;
      },
    );
  },

  async start(id: string): Promise<Meeting> {
    return branch(
      () => {
        const meeting = updateDemoMeeting(id, { status: 'ongoing' as MeetingStatus });
        return meeting || getDemoMeeting(id) || getAllDemoMeetings()[0];
      },
      async () => {
        const { data: res } = await api.post(`/meetings/${id}/start`);
        return res.data.meeting as Meeting;
      },
    );
  },

  async end(id: string): Promise<Meeting> {
    return branch(
      () => {
        const meeting = updateDemoMeeting(id, {
          status: 'completed' as MeetingStatus,
          endedAt: new Date().toISOString(),
        });
        return meeting || getDemoMeeting(id) || getAllDemoMeetings()[0];
      },
      async () => {
        const { data: res } = await api.post(`/meetings/${id}/end`);
        return res.data.meeting as Meeting;
      },
    );
  },

  async join(id: string): Promise<Meeting> {
    return branch(
      () => getDemoMeeting(id) || getAllDemoMeetings()[0],
      async () => {
        const { data: res } = await api.post(`/meetings/${id}/join`);
        return res.data.meeting as Meeting;
      },
    );
  },

  async getStats(): Promise<MeetingStats> {
    return branch(
      () => getDemoMeetingStats(),
      async () => {
        const { data } = await api.get('/meetings/stats');
        return data.data.stats as MeetingStats;
      },
    );
  },
};
