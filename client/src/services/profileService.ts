import api from './api';

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  coverImage: string;
  bio: string;
  isEmailVerified: boolean;
}

export interface ContributionScore {
  score: number;
  level: number;
  nextLevelAt: number;
  progress: number;
  badges: string[];
  breakdown: {
    workspacesCreated: number;
    roomsCreated: number;
    filesUploaded: number;
    meetingsCreated: number;
    invitesSent: number;
    tasksCreated: number;
    totalActivities: number;
  };
}

export interface MonthlyCalendar {
  month: number;
  year: number;
  totalActivities: number;
  calendar: Array<{ date: string; count: number }>;
  actionBreakdown: Record<string, number>;
}

export interface HeatmapData {
  heatmap: Array<{ date: string; count: number }>;
  totalContributions: number;
  recentActions: Array<{ action: string; date: string }>;
}

export const profileService = {
  async getProfile(): Promise<Profile> {
    const { data } = await api.get('/profile');
    return data.data.profile as Profile;
  },

  async updateProfile(patch: {
    name?: string;
    avatar?: string;
    bio?: string;
    coverImage?: string;
  }): Promise<Profile> {
    const { data } = await api.put('/profile', patch);
    return data.data.profile as Profile;
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.put('/profile/password', data);
  },

  async deleteAccount(): Promise<void> {
    await api.delete('/profile');
  },

  async getContributionScore(): Promise<ContributionScore> {
    const { data } = await api.get('/profile/contributions');
    return data.data as ContributionScore;
  },

  async getHeatmapData(): Promise<HeatmapData> {
    const { data } = await api.get('/profile/heatmap');
    return data.data as HeatmapData;
  },

  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/files/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data.url as string;
  },

  async uploadCover(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/files/cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data.url as string;
  },

  async getMonthlyCalendar(month?: number, year?: number): Promise<MonthlyCalendar> {
    const params: Record<string, string> = {};
    if (month !== undefined) params.month = String(month);
    if (year !== undefined) params.year = String(year);
    const { data } = await api.get('/profile/calendar', { params });
    return data.data as MonthlyCalendar;
  },
};
