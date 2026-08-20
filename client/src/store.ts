/**
 * Redux Toolkit store configuration for SyncSpace.
 *
 * Central state management with 13 slices covering all application domains:
 * - auth: User authentication state (tokens, user info, loading)
 * - workspace: Workspace CRUD and selection
 * - room: Room management within workspaces
 * - chat: Chat messages and typing indicators
 * - presence: Online user tracking per room
 * - notification: In-app notifications
 * - members: Workspace member management
 * - invites: Workspace invitation management
 * - tasks: Task management (kanban board)
 * - files: File upload and management
 * - editor: Code editor state
 * - activity: Activity feed
 * - meeting: Meeting scheduling and management
 */
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import workspaceReducer from './features/workspace/workspaceSlice';
import roomReducer from './features/room/roomSlice';
import notificationReducer from './features/notification/notificationSlice';
import memberReducer from './features/collaboration/memberSlice';
import inviteReducer from './features/collaboration/inviteSlice';
import chatReducer from './features/chat/chatSlice';
import presenceReducer from './features/presence/presenceSlice';
import taskReducer from './features/task/taskSlice';
import fileReducer from './features/files/fileSlice';
import editorReducer from './features/editor/editorSlice';
import activityReducer from './features/activity/activitySlice';
import meetingReducer from './features/meeting/meetingSlice';

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
    tasks: taskReducer,
    files: fileReducer,
    editor: editorReducer,
    activity: activityReducer,
    meeting: meetingReducer,
  },
});

/** Root state type — use `useSelector((state: RootState) => ...)` */
export type RootState = ReturnType<typeof store.getState>;

/** Dispatch type — use `useAppDispatch()` from hooks/useAppDispatch.ts */
export type AppDispatch = typeof store.dispatch;
