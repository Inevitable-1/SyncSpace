import { createSlice } from '@reduxjs/toolkit';
import type { PresenceState, PresenceUser } from '../../types';

const initialState: PresenceState = {
  onlineUsers: [],
  memberCount: 0,
};

const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    setOnlineUsers(state, action) {
      state.onlineUsers = action.payload as PresenceUser[];
      state.memberCount = state.onlineUsers.length;
    },
    addOnlineUser(state, action) {
      const user = action.payload as PresenceUser;
      const exists = state.onlineUsers.some((u) => u.userId === user.userId);
      if (!exists) {
        state.onlineUsers.push(user);
        state.memberCount = state.onlineUsers.length;
      }
    },
    removeOnlineUser(state, action) {
      const { userId } = action.payload as { userId: string };
      state.onlineUsers = state.onlineUsers.filter((u) => u.userId !== userId);
      state.memberCount = state.onlineUsers.length;
    },
    updatePresenceStatus(state, action) {
      const { userId, status, currentActivity } = action.payload as {
        userId: string;
        status?: string;
        currentActivity?: string;
      };
      const user = state.onlineUsers.find((u) => u.userId === userId);
      if (user) {
        if (status) user.status = status as PresenceUser['status'];
        if (currentActivity) user.currentActivity = currentActivity;
      }
    },
    clearPresence(state) {
      state.onlineUsers = [];
      state.memberCount = 0;
    },
  },
});

export const {
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  updatePresenceStatus,
  clearPresence,
} = presenceSlice.actions;
export default presenceSlice.reducer;
