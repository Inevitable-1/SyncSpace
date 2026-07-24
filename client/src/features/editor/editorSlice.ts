import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { documentService } from '../../services/documentService';
import type { CodeDocument, EditorSettings, EditorState } from '../../types';

const defaultSettings: EditorSettings = {
  fontSize: 14,
  tabSize: 2,
  theme: 'vs-dark',
  wordWrap: 'on',
  autoSave: true,
  minimap: true,
  lineNumbers: true,
};

const loadSettings = (): EditorSettings => {
  try {
    const saved = localStorage.getItem('syncspace-editor-settings');
    if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
  } catch {
    // ignore
  }
  return defaultSettings;
};

const loadRecentlyOpened = (): string[] => {
  try {
    const saved = localStorage.getItem('syncspace-recently-opened');
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return [];
};

const initialState: EditorState = {
  documents: [],
  currentFile: null,
  openFiles: [],
  recentlyOpened: loadRecentlyOpened(),
  settings: loadSettings(),
  isLoading: false,
  error: null,
};

export const fetchDocuments = createAsyncThunk(
  'editor/fetchDocuments',
  async (roomId: string, { rejectWithValue }) => {
    try {
      return await documentService.getByRoom(roomId);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch documents');
    }
  },
);

export const createDocument = createAsyncThunk(
  'editor/createDocument',
  async (
    data: {
      name: string;
      content?: string;
      language?: string;
      roomId: string;
      workspaceId: string;
      parentPath?: string;
      isFolder?: boolean;
    },
    { rejectWithValue },
  ) => {
    try {
      return await documentService.create(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to create document');
    }
  },
);

export const updateDocumentContent = createAsyncThunk(
  'editor/updateDocument',
  async (data: { id: string; content: string }, { rejectWithValue }) => {
    try {
      return await documentService.update(data.id, { content: data.content });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to update document');
    }
  },
);

export const deleteDocument = createAsyncThunk(
  'editor/deleteDocument',
  async (id: string, { rejectWithValue }) => {
    try {
      await documentService.delete(id);
      return id;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to delete document');
    }
  },
);

export const renameDocument = createAsyncThunk(
  'editor/renameDocument',
  async (data: { id: string; name: string }, { rejectWithValue }) => {
    try {
      return await documentService.rename(data.id, data.name);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to rename document');
    }
  },
);

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setCurrentFile(state, action: PayloadAction<CodeDocument | null>) {
      state.currentFile = action.payload;
      if (action.payload) {
        if (!state.openFiles.includes(action.payload.path)) {
          state.openFiles.push(action.payload.path);
        }
        const recentPath = action.payload.path;
        state.recentlyOpened = [
          recentPath,
          ...state.recentlyOpened.filter((p) => p !== recentPath),
        ].slice(0, 10);
        try {
          localStorage.setItem('syncspace-recently-opened', JSON.stringify(state.recentlyOpened));
        } catch {
          // ignore
        }
      }
    },
    closeFile(state, action: PayloadAction<string>) {
      state.openFiles = state.openFiles.filter((p) => p !== action.payload);
      if (state.currentFile?.path === action.payload) {
        const remaining = state.openFiles;
        if (remaining.length > 0) {
          const lastFile = state.documents.find((d) => d.path === remaining[remaining.length - 1]);
          state.currentFile = lastFile || null;
        } else {
          state.currentFile = null;
        }
      }
    },
    updateSettings(state, action: PayloadAction<Partial<EditorSettings>>) {
      state.settings = { ...state.settings, ...action.payload };
      try {
        localStorage.setItem('syncspace-editor-settings', JSON.stringify(state.settings));
      } catch {
        // ignore
      }
    },
    clearEditor(state) {
      state.documents = [];
      state.currentFile = null;
      state.openFiles = [];
      state.error = null;
    },
    addDocumentLocally(state, action: PayloadAction<CodeDocument>) {
      const exists = state.documents.find((d) => d._id === action.payload._id);
      if (!exists) {
        state.documents.push(action.payload);
      }
    },
    removeDocumentLocally(state, action: PayloadAction<string>) {
      state.documents = state.documents.filter((d) => d._id !== action.payload);
    },
    updateDocumentLocally(state, action: PayloadAction<CodeDocument>) {
      const idx = state.documents.findIndex((d) => d._id === action.payload._id);
      if (idx !== -1) {
        state.documents[idx] = action.payload;
      }
      if (state.currentFile?._id === action.payload._id) {
        state.currentFile = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.documents = action.payload;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createDocument.fulfilled, (state, action) => {
        state.documents.push(action.payload as CodeDocument);
      })
      .addCase(createDocument.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(updateDocumentContent.fulfilled, (state, action) => {
        const updated = action.payload as CodeDocument;
        const idx = state.documents.findIndex((d) => d._id === updated._id);
        if (idx !== -1) state.documents[idx] = updated;
        if (state.currentFile?._id === updated._id) state.currentFile = updated;
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        const deletedId = action.payload as string;
        state.documents = state.documents.filter((d) => d._id !== deletedId);
        state.openFiles = state.openFiles.filter((p) => {
          const doc = state.documents.find((d) => d.path === p);
          return doc && doc._id !== deletedId;
        });
      })
      .addCase(renameDocument.fulfilled, (state, action) => {
        const renamed = action.payload as CodeDocument;
        const idx = state.documents.findIndex((d) => d._id === renamed._id);
        if (idx !== -1) state.documents[idx] = renamed;
        if (state.currentFile?._id === renamed._id) state.currentFile = renamed;
      });
  },
});

export const {
  setCurrentFile,
  closeFile,
  updateSettings,
  clearEditor,
  addDocumentLocally,
  removeDocumentLocally,
  updateDocumentLocally,
} = editorSlice.actions;

export default editorSlice.reducer;
