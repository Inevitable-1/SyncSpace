import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { chatService } from '../../services/chatService';
import type { ChatState, ChatMessage, TypingUser } from '../../types';

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
  typingUsers: [],
};

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (
    { roomId, limit, before }: { roomId: string; limit?: number; before?: string },
    { rejectWithValue },
  ) => {
    try {
      return await chatService.getMessages(roomId, limit, before);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  },
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    clearChatError(state) {
      state.error = null;
    },
    addMessage(state, action) {
      const message = action.payload as ChatMessage;
      const exists = state.messages.some((m) => m._id === message._id);
      if (!exists) {
        state.messages.push(message);
      }
    },
    editMessage(state, action) {
      const { _id, content, edited, editedAt } = action.payload as {
        _id: string;
        content: string;
        edited: boolean;
        editedAt: string;
      };
      const msg = state.messages.find((m) => m._id === _id);
      if (msg) {
        msg.content = content;
        msg.edited = edited;
        msg.editedAt = editedAt;
      }
    },
    removeMessage(state, action) {
      const { messageId } = action.payload as { messageId: string };
      const msg = state.messages.find((m) => m._id === messageId);
      if (msg) {
        msg.isDeleted = true;
      }
    },
    setTypingUsers(state, action) {
      state.typingUsers = action.payload as TypingUser[];
    },
    addTypingUser(state, action) {
      const user = action.payload as TypingUser;
      const exists = state.typingUsers.some((u) => u.userId === user.userId);
      if (!exists) {
        state.typingUsers.push(user);
      }
    },
    removeTypingUser(state, action) {
      const { userId } = action.payload as { userId: string };
      state.typingUsers = state.typingUsers.filter((u) => u.userId !== userId);
    },
    clearMessages(state) {
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        const newMessages = action.payload as ChatMessage[];
        const existingIds = new Set(state.messages.map((m) => m._id));
        const unique = newMessages.filter((m) => !existingIds.has(m._id));
        state.messages = [...unique, ...state.messages];
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearChatError,
  addMessage,
  editMessage,
  removeMessage,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  clearMessages,
} = chatSlice.actions;
export default chatSlice.reducer;
