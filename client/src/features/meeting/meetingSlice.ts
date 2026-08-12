import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { meetingService } from '../../services/meetingService';
import type { MeetingState, Meeting } from '../../types';

const initialState: MeetingState = {
  meetings: [],
  currentMeeting: null,
  stats: null,
  isLoading: false,
  error: null,
};

function getErrorMessage(err: unknown, fallback: string): string {
  const error = err as { response?: { data?: { message?: string } } };
  return error.response?.data?.message || fallback;
}

export const fetchMeetings = createAsyncThunk(
  'meeting/fetchAll',
  async (params: { workspaceId?: string } | undefined, { rejectWithValue }) => {
    try {
      return await meetingService.getAll(params);
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, 'Failed to fetch meetings'));
    }
  },
);

export const fetchMeetingStats = createAsyncThunk(
  'meeting/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      return await meetingService.getStats();
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, 'Failed to fetch meeting stats'));
    }
  },
);

export const createMeeting = createAsyncThunk(
  'meeting/create',
  async (
    data: {
      name: string;
      description?: string;
      workspace: string;
      participants?: string[];
      scheduledAt: string;
      duration?: number;
      agenda?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      return await meetingService.create(data);
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, 'Failed to schedule meeting'));
    }
  },
);

export const startMeeting = createAsyncThunk(
  'meeting/start',
  async (id: string, { rejectWithValue }) => {
    try {
      return await meetingService.start(id);
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, 'Failed to start meeting'));
    }
  },
);

export const endMeeting = createAsyncThunk(
  'meeting/end',
  async (id: string, { rejectWithValue }) => {
    try {
      return await meetingService.end(id);
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, 'Failed to end meeting'));
    }
  },
);

export const joinMeeting = createAsyncThunk(
  'meeting/join',
  async (id: string, { rejectWithValue }) => {
    try {
      return await meetingService.join(id);
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, 'Failed to join meeting'));
    }
  },
);

export const updateMeeting = createAsyncThunk(
  'meeting/update',
  async (patch: Partial<Meeting>, { rejectWithValue }) => {
    try {
      return await meetingService.update(patch._id as string, patch);
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, 'Failed to update meeting'));
    }
  },
);

const upsertMeeting = (list: Meeting[], updated: Meeting): Meeting[] => {
  const idx = list.findIndex((m) => m._id === updated._id);
  if (idx === -1) return [updated, ...list];
  const next = [...list];
  next[idx] = updated;
  return next;
};

const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  reducers: {
    clearMeetingError(state) {
      state.error = null;
    },
    setCurrentMeeting(state, action) {
      state.currentMeeting = action.payload;
    },
    clearCurrentMeeting(state) {
      state.currentMeeting = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMeetings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMeetings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.meetings = action.payload;
      })
      .addCase(fetchMeetings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMeetingStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(createMeeting.fulfilled, (state, action) => {
        state.meetings.unshift(action.payload as Meeting);
        state.stats = null;
      })
      .addCase(startMeeting.fulfilled, (state, action) => {
        const updated = action.payload as Meeting;
        state.meetings = upsertMeeting(state.meetings, updated);
        if (state.currentMeeting?._id === updated._id) state.currentMeeting = updated;
      })
      .addCase(endMeeting.fulfilled, (state, action) => {
        const updated = action.payload as Meeting;
        state.meetings = upsertMeeting(state.meetings, updated);
        if (state.currentMeeting?._id === updated._id) state.currentMeeting = updated;
      })
      .addCase(joinMeeting.fulfilled, (state, action) => {
        const updated = action.payload as Meeting;
        state.meetings = upsertMeeting(state.meetings, updated);
        if (state.currentMeeting?._id === updated._id) state.currentMeeting = updated;
      })
      .addCase(updateMeeting.fulfilled, (state, action) => {
        const updated = action.payload as Meeting;
        state.meetings = upsertMeeting(state.meetings, updated);
        if (state.currentMeeting?._id === updated._id) state.currentMeeting = updated;
      });
  },
});

export const { clearMeetingError, setCurrentMeeting, clearCurrentMeeting } = meetingSlice.actions;
export default meetingSlice.reducer;
