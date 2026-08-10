import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Invite, InviteState } from '../../types';
import { inviteService } from '../../services/inviteService';

const initialState: InviteState = {
  invites: [],
  pendingInvites: [],
  isLoading: false,
  error: null,
  pagination: null,
};

export const createInvite = createAsyncThunk(
  'invites/createInvite',
  async ({ workspaceId, email, role }: { workspaceId: string; email: string; role?: string }) => {
    const response = await inviteService.createInvite(workspaceId, email, role);
    return response.data;
  },
);

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
    builder.addCase(createInvite.fulfilled, (state, action: PayloadAction<Invite>) => {
      state.invites.unshift(action.payload);
    });
  },
});

export const { clearInvites, clearError } = inviteSlice.actions;
export default inviteSlice.reducer;
