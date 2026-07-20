import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { workspaceService } from '../../services/workspaceService';
import type { WorkspaceState, Workspace } from '../../types';

const initialState: WorkspaceState = {
  workspaces: [],
  currentWorkspace: null,
  trashWorkspaces: [],
  isLoading: false,
  error: null,
};

export const fetchWorkspaces = createAsyncThunk(
  'workspace/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await workspaceService.getAll();
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
    { id, data }: { id: string; data: { name?: string; description?: string; color?: string } },
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
      });
  },
});

export const { clearWorkspaceError, setCurrentWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;
