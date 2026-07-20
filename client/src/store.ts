import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import workspaceReducer from './features/workspace/workspaceSlice';
import roomReducer from './features/room/roomSlice';
import notificationReducer from './features/notification/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    room: roomReducer,
    notification: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
