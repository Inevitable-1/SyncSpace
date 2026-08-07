import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService } from '../../services/notificationService';
import type { NotificationState, Notification } from '../../types';

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  'notification/fetchAll',
  async (limit: number | undefined, { rejectWithValue }) => {
    try {
      return await notificationService.getAll(limit);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  },
);

export const markNotificationRead = createAsyncThunk(
  'notification/markRead',
  async (id: string, { rejectWithValue }) => {
    try {
      await notificationService.markAsRead(id);
      return id;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
    }
  },
);

export const markAllNotificationsRead = createAsyncThunk(
  'notification/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllAsRead();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all as read');
    }
  },
);

export const clearNotifications = createAsyncThunk(
  'notification/clearAll',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.clearAll();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to clear notifications');
    }
  },
);

export const deleteNotification = createAsyncThunk(
  'notification/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await notificationService.delete(id);
      return id;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to delete notification');
    }
  },
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearNotificationError(state) {
      state.error = null;
    },
    addNotification(state, action) {
      state.notifications.unshift(action.payload as Notification);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const id = action.payload;
        const notif = state.notifications.find((n) => n._id === id);
        if (notif && !notif.isRead) {
          notif.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.isRead = true;
        });
        state.unreadCount = 0;
      })
      .addCase(clearNotifications.fulfilled, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const id = action.payload;
        const notif = state.notifications.find((n) => n._id === id);
        state.notifications = state.notifications.filter((n) => n._id !== id);
        if (notif && !notif.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
  },
});

export const { clearNotificationError, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
