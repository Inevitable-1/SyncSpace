import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Member, MemberState, PaginatedResponse } from '../../types';
import { memberService } from '../../services/memberService';

const initialState: MemberState = {
  members: [],
  isLoading: false,
  error: null,
  pagination: null,
};

export const fetchMembers = createAsyncThunk(
  'members/fetchMembers',
  async ({ workspaceId, params }: { workspaceId: string; params?: Record<string, unknown> }) => {
    const response = await memberService.getMembers(workspaceId, params);
    return response.data;
  },
);

export const addMember = createAsyncThunk(
  'members/addMember',
  async ({ workspaceId, userId, role }: { workspaceId: string; userId: string; role?: string }) => {
    const response = await memberService.addMember(workspaceId, userId, role);
    return response.data;
  },
);

export const removeMember = createAsyncThunk(
  'members/removeMember',
  async ({ workspaceId, memberId }: { workspaceId: string; memberId: string }) => {
    await memberService.removeMember(workspaceId, memberId);
    return memberId;
  },
);

export const updateMemberRole = createAsyncThunk(
  'members/updateMemberRole',
  async ({
    workspaceId,
    memberId,
    role,
  }: {
    workspaceId: string;
    memberId: string;
    role: string;
  }) => {
    const response = await memberService.updateMemberRole(workspaceId, memberId, role);
    return response.data;
  },
);

export const suspendMember = createAsyncThunk(
  'members/suspendMember',
  async ({ workspaceId, memberId }: { workspaceId: string; memberId: string }) => {
    const response = await memberService.suspendMember(workspaceId, memberId);
    return response.data;
  },
);

export const reactivateMember = createAsyncThunk(
  'members/reactivateMember',
  async ({ workspaceId, memberId }: { workspaceId: string; memberId: string }) => {
    const response = await memberService.reactivateMember(workspaceId, memberId);
    return response.data;
  },
);

const memberSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    clearMembers: (state) => {
      state.members = [];
      state.pagination = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMembers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchMembers.fulfilled,
        (state, action: PayloadAction<PaginatedResponse<Member>>) => {
          state.isLoading = false;
          state.members = action.payload.data;
          state.pagination = action.payload.pagination;
        },
      )
      .addCase(fetchMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch members';
      })
      .addCase(addMember.fulfilled, (state, action: PayloadAction<Member>) => {
        state.members.unshift(action.payload);
      })
      .addCase(removeMember.fulfilled, (state, action: PayloadAction<string>) => {
        state.members = state.members.filter((m) => m._id !== action.payload);
      })
      .addCase(updateMemberRole.fulfilled, (state, action: PayloadAction<Member>) => {
        const index = state.members.findIndex((m) => m._id === action.payload._id);
        if (index !== -1) {
          state.members[index] = action.payload;
        }
      })
      .addCase(suspendMember.fulfilled, (state, action: PayloadAction<Member>) => {
        const index = state.members.findIndex((m) => m._id === action.payload._id);
        if (index !== -1) {
          state.members[index] = action.payload;
        }
      })
      .addCase(reactivateMember.fulfilled, (state, action: PayloadAction<Member>) => {
        const index = state.members.findIndex((m) => m._id === action.payload._id);
        if (index !== -1) {
          state.members[index] = action.payload;
        }
      });
  },
});

export const { clearMembers, clearError } = memberSlice.actions;
export default memberSlice.reducer;
