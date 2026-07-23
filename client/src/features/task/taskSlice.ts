import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { taskService } from '../../services/taskService';
import type { Task, TaskState, TaskStatus, TaskPriority } from '../../types';

const initialState: TaskState = {
  tasks: [],
  isLoading: false,
  error: null,
};

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (workspaceId: string, { rejectWithValue }) => {
    try {
      return await taskService.getTasksByWorkspace(workspaceId);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  },
);

interface UpdateTaskPayload {
  taskId: string;
  data: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignee?: string | null;
    labels?: string[];
    dueDate?: string | null;
    checklist?: { text: string; done: boolean }[];
    order?: number;
  };
}

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async (payload: UpdateTaskPayload, { rejectWithValue }) => {
    try {
      return await taskService.updateTask(payload.taskId, payload.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  },
);

interface CreateTaskPayload {
  title: string;
  description?: string;
  workspace: string;
  room?: string;
  assignee?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  labels?: string[];
  dueDate?: string;
}

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (payload: CreateTaskPayload, { rejectWithValue }) => {
    try {
      return await taskService.createTask(payload);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to create task');
    }
  },
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      await taskService.deleteTask(taskId);
      return taskId;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
    }
  },
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTaskError(state) {
      state.error = null;
    },
    optimisticallyUpdateTask(state, action: PayloadAction<Partial<Task> & { _id: string }>) {
      const index = state.tasks.findIndex((t) => t._id === action.payload._id);
      if (index !== -1) {
        state.tasks[index] = { ...state.tasks[index], ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t._id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearTaskError, optimisticallyUpdateTask } = taskSlice.actions;
export default taskSlice.reducer;
