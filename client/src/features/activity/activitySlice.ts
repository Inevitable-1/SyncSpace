import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { activityService } from '../../services/activityService';
import type { Activity, ActivityState } from '../../types';

const initialState: ActivityState = {
  activities: [],
  isLoading: false,
  error: null,
};

export const fetchActivities = createAsyncThunk(
  'activity/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await activityService.getAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch activities';
      return rejectWithValue(message);
    }
  },
);

export const clearAllActivities = createAsyncThunk(
  'activity/clearAll',
  async (_, { rejectWithValue }) => {
    try {
      await activityService.clearAll();
      return [];
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to clear activities';
      return rejectWithValue(message);
    }
  },
);

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    addActivity(state, action) {
      state.activities.unshift(action.payload as Activity);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activities = action.payload as Activity[];
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(clearAllActivities.fulfilled, (state) => {
        state.activities = [];
      });
  },
});

export const { addActivity } = activitySlice.actions;
export default activitySlice.reducer;
