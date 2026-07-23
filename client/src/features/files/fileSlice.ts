import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fileService } from '../../services/fileService';
import type { FileState, UploadedFile } from '../../types';

const initialState: FileState = {
  files: [],
  folders: [],
  isLoading: false,
  error: null,
};

export const fetchFiles = createAsyncThunk(
  'file/fetchAll',
  async (
    params: { workspaceId: string; folder?: string; search?: string },
    { rejectWithValue },
  ) => {
    try {
      return await fileService.getAll(params);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch files');
    }
  },
);

export const uploadFile = createAsyncThunk(
  'file/upload',
  async (
    data: {
      name: string;
      originalName: string;
      mimeType: string;
      size: number;
      workspaceId: string;
      roomId?: string;
      folder?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      return await fileService.upload(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to upload file');
    }
  },
);

export const deleteFile = createAsyncThunk(
  'file/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await fileService.delete(id);
      return id;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to delete file');
    }
  },
);

export const fetchFolders = createAsyncThunk(
  'file/fetchFolders',
  async (workspaceId: string, { rejectWithValue }) => {
    try {
      return await fileService.getFolders(workspaceId);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch folders');
    }
  },
);

const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    clearFileError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFiles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.files = action.payload;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.files.unshift(action.payload as UploadedFile);
      })
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.files = state.files.filter((f) => f._id !== action.payload);
      })
      .addCase(fetchFolders.fulfilled, (state, action) => {
        state.folders = action.payload as string[];
      });
  },
});

export const { clearFileError } = fileSlice.actions;
export default fileSlice.reducer;
