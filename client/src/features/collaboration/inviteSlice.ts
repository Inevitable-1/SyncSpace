import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Invite, InviteState, PaginatedResponse } from '../../types';
import { inviteService } from '../../services/inviteService';

const initialState: InviteState = {
  invites: [],
  pendingInvites: [],
  isLoading: false,
  error: null,
  pagination: null,
};

export const fetchInvites = createAsyncThunk(
  'invites/fetchInvites',
  async ({ workspaceId, params }: { workspaceId: string; params?: Record<string, unknown> }) => {
    const response = await inviteService.getInvites(workspaceId, params);
    return response.data;
  },
);

export const createInvite = createAsyncThunk(
  'invites/createInvite',
  async ({ workspaceId, email, role }: { workspaceId: string; email: string; role?: string }) => {
    const response = await inviteService.createInvite(workspaceId, email, role);
    return response.data;
  },
);

export const revokeInvite = createAsyncThunk(
  'invites/revokeInvite',
  async ({ workspaceId, inviteId }: { workspaceId: string; inviteId: string }) => {
    await inviteService.revokeInvite(workspaceId, inviteId);
    return inviteId;
  },
);

export const fetchPendingInvites = createAsyncThunk('invites/fetchPendingInvites', async () => {
  const response = await inviteService.getPendingInvites();
  return response.data;
});

export const acceptInvite = createAsyncThunk('invites/acceptInvite', async (token: string) => {
  const response = await inviteService.acceptInvite(token);
  return response.data;
});

export const declineInvite = createAsyncThunk('invites/declineInvite', async (token: string) => {
  const response = await inviteService.declineInvite(token);
  return response.data;
});

const inviteSlice = createSlice({
  name: 'invites',
  initialState,
  reducers: {
    clearInvites: (state) => {
      state.invites = [];
      state.pendingInvites = [];
      state.pagination = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchInvites.fulfilled,
        (state, action: PayloadAction<PaginatedResponse<Invite>>) => {
          state.isLoading = false;
          state.invites = action.payload.data;
          state.pagination = action.payload.pagination;
        },
      )
      .addCase(fetchInvites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch invites';
      })
      .addCase(createInvite.fulfilled, (state, action: PayloadAction<Invite>) => {
        state.invites.unshift(action.payload);
      })
      .addCase(revokeInvite.fulfilled, (state, action: PayloadAction<string>) => {
        state.invites = state.invites.filter((i) => i._id !== action.payload);
      })
      .addCase(fetchPendingInvites.fulfilled, (state, action: PayloadAction<Invite[]>) => {
        state.pendingInvites = action.payload;
      });
  },
});

export const { clearInvites, clearError } = inviteSlice.actions;
export default inviteSlice.reducer;
