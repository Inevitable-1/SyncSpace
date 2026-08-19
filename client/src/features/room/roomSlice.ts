import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { roomService } from '../../services/roomService';
import type { RoomState, Room } from '../../types';

const initialState: RoomState = {
  rooms: [],
  currentRoom: null,
  trashRooms: [],
  isLoading: false,
  error: null,
};

export const fetchRooms = createAsyncThunk(
  'room/fetchAll',
  async (workspaceId: string | undefined, { rejectWithValue }) => {
    try {
      return await roomService.getAll(workspaceId);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch rooms');
    }
  },
);

export const createRoom = createAsyncThunk(
  'room/create',
  async (data: { name: string; type?: string; workspaceId?: string }, { rejectWithValue }) => {
    try {
      return await roomService.create(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to create room');
    }
  },
);

export const updateRoom = createAsyncThunk(
  'room/update',
  async (
    { id, data }: { id: string; data: { name?: string; type?: string } },
    { rejectWithValue },
  ) => {
    try {
      return await roomService.update(id, data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to update room');
    }
  },
);

export const deleteRoom = createAsyncThunk(
  'room/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await roomService.delete(id);
      return id;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to delete room');
    }
  },
);

export const joinRoom = createAsyncThunk(
  'room/join',
  async (inviteCode: string, { rejectWithValue }) => {
    try {
      return await roomService.join(inviteCode);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to join room');
    }
  },
);

export const restoreRoom = createAsyncThunk(
  'room/restore',
  async (id: string, { rejectWithValue }) => {
    try {
      return await roomService.restore(id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to restore room');
    }
  },
);

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    clearRoomError(state) {
      state.error = null;
    },
    setCurrentRoom(state, action) {
      state.currentRoom = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRooms.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rooms = action.payload;
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.rooms.unshift(action.payload as Room);
      })
      .addCase(updateRoom.fulfilled, (state, action) => {
        const updated = action.payload as Room;
        const idx = state.rooms.findIndex((r) => r._id === updated._id);
        if (idx !== -1) state.rooms[idx] = updated;
        if (state.currentRoom?._id === updated._id) state.currentRoom = updated;
      })
      .addCase(deleteRoom.fulfilled, (state, action) => {
        state.rooms = state.rooms.filter((r) => r._id !== action.payload);
        if (state.currentRoom?._id === action.payload) state.currentRoom = null;
      })
      .addCase(joinRoom.fulfilled, (state, action) => {
        const room = action.payload as Room;
        const exists = state.rooms.some((r) => r._id === room._id);
        if (!exists) state.rooms.unshift(room);
      })
      .addCase(restoreRoom.fulfilled, (state, action) => {
        const restored = action.payload as Room;
        state.trashRooms = state.trashRooms.filter((r) => r._id !== restored._id);
        state.rooms.unshift(restored);
      });
  },
});

export const { clearRoomError, setCurrentRoom } = roomSlice.actions;
export default roomSlice.reducer;
