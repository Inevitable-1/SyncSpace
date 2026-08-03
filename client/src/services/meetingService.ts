import {
  getAllDemoMeetings,
  getDemoMeetingsForWorkspace,
  getDemoMeeting,
  addDemoMeeting,
  updateDemoMeeting,
  deleteDemoMeeting,
  getDemoMeetingStats,
  getDemoWorkspace,
} from '../data/demoWorkspaces';
import type { Meeting, MeetingStats, MeetingStatus } from '../types';

export const meetingService = {
  async getAll(params?: { workspaceId?: string }): Promise<Meeting[]> {
    if (!params?.workspaceId) return getAllDemoMeetings().filter((m) => !m.isDeleted);
    return getDemoMeetingsForWorkspace(params.workspaceId).filter((m) => !m.isDeleted);
  },

  async getById(id: string): Promise<Meeting> {
    return getDemoMeeting(id) || getAllDemoMeetings()[0];
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
    const ws = getDemoWorkspace(data.workspace);
    if (!ws) throw new Error('Workspace not found');
    return addDemoMeeting(data.workspace, data);
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
    const meeting = updateDemoMeeting(id, data as Partial<Meeting>);
    if (meeting) return meeting;
    return getDemoMeeting(id) || getAllDemoMeetings()[0];
  },

  async delete(id: string): Promise<void> {
    deleteDemoMeeting(id);
  },

  async start(id: string): Promise<Meeting> {
    const meeting = updateDemoMeeting(id, { status: 'ongoing' as MeetingStatus });
    return meeting || getDemoMeeting(id) || getAllDemoMeetings()[0];
  },

  async end(id: string): Promise<Meeting> {
    const meeting = updateDemoMeeting(id, {
      status: 'completed' as MeetingStatus,
      endedAt: new Date().toISOString(),
    });
    return meeting || getDemoMeeting(id) || getAllDemoMeetings()[0];
  },

  async join(id: string): Promise<Meeting> {
    return getDemoMeeting(id) || getAllDemoMeetings()[0];
  },

  async getStats(): Promise<MeetingStats> {
    return getDemoMeetingStats();
  },
};
