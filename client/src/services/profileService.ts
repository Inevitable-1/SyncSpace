import api from './api';

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar: string;
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

export const profileService = {
  async getProfile(): Promise<Profile> {
    const { data } = await api.get('/profile');
    return data.data.profile as Profile;
  },

  async updateProfile(patch: { name?: string; avatar?: string; bio?: string }): Promise<Profile> {
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
};
