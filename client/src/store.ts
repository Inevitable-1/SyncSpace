import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import workspaceReducer from './features/workspace/workspaceSlice';
import roomReducer from './features/room/roomSlice';
import notificationReducer from './features/notification/notificationSlice';
import memberReducer from './features/collaboration/memberSlice';
import inviteReducer from './features/collaboration/inviteSlice';
import chatReducer from './features/chat/chatSlice';
import presenceReducer from './features/presence/presenceSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    room: roomReducer,
    notification: notificationReducer,
    members: memberReducer,
    invites: inviteReducer,
    chat: chatReducer,
    presence: presenceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
