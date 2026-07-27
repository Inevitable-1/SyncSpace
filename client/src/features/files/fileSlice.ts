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
      file: File;
      workspaceId: string;
      roomId?: string;
      folder?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      return await fileService.upload(data.file, {
        workspaceId: data.workspaceId,
        roomId: data.roomId,
        folder: data.folder,
      });
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

export const renameFile = createAsyncThunk(
  'file/rename',
  async ({ id, name }: { id: string; name: string }, { rejectWithValue }) => {
    try {
      return await fileService.rename(id, name);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to rename file');
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
      .addCase(renameFile.fulfilled, (state, action) => {
        const index = state.files.findIndex((f) => f._id === (action.payload as UploadedFile)._id);
        if (index !== -1) {
          state.files[index] = action.payload as UploadedFile;
        }
      })
      .addCase(fetchFolders.fulfilled, (state, action) => {
        state.folders = action.payload as string[];
      });
  },
});

export const { clearFileError } = fileSlice.actions;
export default fileSlice.reducer;
