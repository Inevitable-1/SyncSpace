import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { workspaceService, type WorkspaceQueryParams } from '../../services/workspaceService';
import type { WorkspaceState, Workspace } from '../../types';

const initialState: WorkspaceState = {
  workspaces: [],
  currentWorkspace: null,
  trashWorkspaces: [],
  isLoading: false,
  error: null,
  pagination: null,
};

export const fetchWorkspaces = createAsyncThunk(
  'workspace/fetchAll',
  async (params: WorkspaceQueryParams | undefined, { rejectWithValue }) => {
    try {
      return await workspaceService.getAll(params);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch workspaces');
    }
  },
);

export const createWorkspace = createAsyncThunk(
  'workspace/create',
  async (
    data: { name: string; description?: string; color?: string; icon?: string; isPublic?: boolean },
    { rejectWithValue },
  ) => {
    try {
      return await workspaceService.create(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to create workspace');
    }
  },
);

export const updateWorkspace = createAsyncThunk(
  'workspace/update',
  async (
    {
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        description?: string;
        color?: string;
        icon?: string;
        isPublic?: boolean;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      return await workspaceService.update(id, data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to update workspace');
    }
  },
);

export const deleteWorkspace = createAsyncThunk(
  'workspace/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await workspaceService.delete(id);
      return id;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to delete workspace');
    }
  },
);

export const fetchTrashWorkspaces = createAsyncThunk(
  'workspace/fetchTrash',
  async (_, { rejectWithValue }) => {
    try {
      return await workspaceService.getTrash();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trash');
    }
  },
);

export const restoreWorkspace = createAsyncThunk(
  'workspace/restore',
  async (id: string, { rejectWithValue }) => {
    try {
      return await workspaceService.restore(id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to restore workspace');
    }
  },
);

export const regenerateInviteCode = createAsyncThunk(
  'workspace/regenerateInviteCode',
  async (id: string, { rejectWithValue }) => {
    try {
      const inviteCode = await workspaceService.regenerateInviteCode(id);
      return { id, inviteCode };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to regenerate invite code');
    }
  },
);

export const joinByInviteCode = createAsyncThunk(
  'workspace/joinByInviteCode',
  async (inviteCode: string, { rejectWithValue }) => {
    try {
      return await workspaceService.joinByInviteCode(inviteCode);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to join workspace');
    }
  },
);

export const toggleFavorite = createAsyncThunk(
  'workspace/toggleFavorite',
  async (id: string, { rejectWithValue }) => {
    try {
      return await workspaceService.toggleFavorite(id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle favorite');
    }
  },
);

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    clearWorkspaceError(state) {
      state.error = null;
    },
    setCurrentWorkspace(state, action) {
      state.currentWorkspace = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workspaces = action.payload;
        state.pagination = null;
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.workspaces.unshift(action.payload as Workspace);
      })
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        const updated = action.payload as Workspace;
        const idx = state.workspaces.findIndex((w) => w._id === updated._id);
        if (idx !== -1) state.workspaces[idx] = updated;
        if (state.currentWorkspace?._id === updated._id) state.currentWorkspace = updated;
      })
      .addCase(deleteWorkspace.fulfilled, (state, action) => {
        state.workspaces = state.workspaces.filter((w) => w._id !== action.payload);
        if (state.currentWorkspace?._id === action.payload) state.currentWorkspace = null;
      })
      .addCase(fetchTrashWorkspaces.fulfilled, (state, action) => {
        state.trashWorkspaces = action.payload.workspaces;
      })
      .addCase(restoreWorkspace.fulfilled, (state, action) => {
        const restored = action.payload as Workspace;
        state.trashWorkspaces = state.trashWorkspaces.filter((w) => w._id !== restored._id);
        state.workspaces.unshift(restored);
      })
      .addCase(regenerateInviteCode.fulfilled, (state, action) => {
        const { id, inviteCode } = action.payload;
        const idx = state.workspaces.findIndex((w) => w._id === id);
        if (idx !== -1) state.workspaces[idx].inviteCode = inviteCode;
        if (state.currentWorkspace?._id === id) state.currentWorkspace.inviteCode = inviteCode;
      })
      .addCase(joinByInviteCode.fulfilled, (state, action) => {
        const workspace = action.payload as Workspace;
        const exists = state.workspaces.some((w) => w._id === workspace._id);
        if (!exists) state.workspaces.unshift(workspace);
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const updated = action.payload as Workspace;
        const idx = state.workspaces.findIndex((w) => w._id === updated._id);
        if (idx !== -1) state.workspaces[idx].isFavorite = updated.isFavorite;
        if (state.currentWorkspace?._id === updated._id) {
          state.currentWorkspace.isFavorite = updated.isFavorite;
        }
      });
  },
});

export const { clearWorkspaceError, setCurrentWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;
