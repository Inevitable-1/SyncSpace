# FEATURE_GUIDE.md

## Overview

SyncSpace is a comprehensive collaborative platform with multiple interconnected features. This document provides a detailed mapping of all features, their responsible files, request flows, and implementation details.

## Feature Mapping

### 1. Authentication System

**Purpose**: User authentication, registration, session management, and password recovery

**Files Responsible**:
- `client/src/features/auth/authSlice.ts` - Redux auth state management
- `client/src/services/authService.ts` - API service for auth operations
- `server/src/controllers/auth.ts` - Express auth controller
- `server/src/routes/auth.ts` - Auth route definitions
- `server/src/models/User.ts` - User model
- `client/src/pages/LoginPage.tsx` - Login UI
- `client/src/pages/RegisterPage.tsx` - Registration UI
- `client/src/context/AuthContext.tsx` - Auth context (if exists)
- `client/src/components/ProtectedRoute.tsx` - Protected route component

**Request Flow**:
1. **User Registration**:
   - Client: POST `/api/auth/register` with email, password, name
   - Server: Validate input, create user with hashed password
   - Response: Return user data and JWT tokens
   - Client: Store tokens in localStorage, update auth state

2. **User Login**:
   - Client: POST `/api/auth/login` with email, password
   - Server: Validate credentials, generate JWT tokens
   - Response: Return user data and access/refresh tokens
   - Client: Store tokens, set authentication state

3. **Token Refresh**:
   - Client: Automatic refresh on 401 errors via API interceptor
   - Server: Validate refresh token, generate new access token
   - Response: Return new access token

4. **Logout**:
   - Client: Clear localStorage, reset auth state
   - Server: Invalidate refresh token (if implemented)

**Example**:
```typescript
// Client registration
export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      const result = await authService.register(data);
      localStorage.setItem('auth', JSON.stringify({
        state: { user: result.user, accessToken: result.accessToken }
      }));
      return result;
    } catch (err) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);
```

### 2. Workspace Management

**Purpose**: Create, read, update, delete workspaces with member management and collaboration settings

**Files Responsible**:
- `client/src/features/workspace/workspaceSlice.ts` - Workspace state management
- `client/src/services/workspaceService.ts` - Workspace API service
- `server/src/controllers/workspace.ts` - Workspace controller
- `server/src/routes/workspace.ts` - Workspace routes
- `server/src/models/Workspace.ts` - Workspace model
- `client/src/pages/dashboard/WorkspacesPage.tsx` - Workspaces list UI
- `client/src/pages/dashboard/WorkspaceDetailPage.tsx` - Workspace details UI
- `client/src/components/workspace/WorkspaceCard.tsx` - Workspace display component

**Request Flow**:
1. **Create Workspace**:
   - Client: POST `/api/workspaces` with workspace data
   - Server: Validate, create workspace, add creator as owner
   - Response: Return created workspace

2. **List Workspaces**:
   - Client: GET `/api/workspaces` (filters by user)
   - Server: Query workspaces where user is member or owner
   - Response: List of workspaces with metadata

3. **Update Workspace**:
   - Client: PUT `/api/workspaces/:id` with updates
   - Server: Validate permissions, update workspace
   - Response: Updated workspace

4. **Delete/Aarchive Workspace**:
   - Client: DELETE `/api/workspaces/:id`
   - Server: Soft delete, update member relationships
   - Response: Success confirmation

5. **Member Management**:
   - Client: GET/POST/DELETE `/api/workspaces/:id/members`
   - Server: Handle member additions, role changes, removals
   - Response: Member list or operation result

**Example**:
```typescript
// Client workspace creation
export const createWorkspace = createAsyncThunk(
  'workspace/create',
  async (data: CreateWorkspaceRequest, { rejectWithValue }) => {
    try {
      const result = await workspaceService.create(data);
      return result;
    } catch (err) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);
```

### 3. Room Management (Whiteboard, Code Editor, Document)

**Purpose**: Create and manage collaboration rooms for different types of work

**Files Responsible**:
- `client/src/features/room/roomSlice.ts` - Room state management
- `client/src/services/roomService.ts` - Room API service
- `server/src/controllers/room.ts` - Room controller
- `server/src/routes/room.ts` - Room routes
- `server/src/models/Room.ts` - Room model
- `client/src/pages/dashboard/RoomsPage.tsx` - Rooms list UI
- `client/src/pages/dashboard/RoomDetailPage.tsx` - Room details UI
- `client/src/components/collaboration/RoomLayout.tsx` - Room layout component
- `client/src/components/whiteboard/WhiteboardCanvas.tsx` - Whiteboard implementation
- `client/src/components/editor/CodeIDE.tsx` - Code editor implementation

**Request Flow**:
1. **Create Room**:
   - Client: POST `/api/rooms` with room data (name, type, workspaceId)
   - Server: Validate workspace permissions, create room
   - Response: Return created room with invite code

2. **Join Room**:
   - Client: POST `/api/rooms/join` with invite code
   - Server: Validate invite code, add user to room participants
   - Response: Return room data

3. **Room Operations**:
   - Client: GET/PUT/DELETE `/api/rooms/:id`
   - Server: Handle room operations with permission checks
   - Response: Room data or operation result

4. **Real-time Collaboration**:
   - Client: WebSocket connections via Socket.IO
   - Server: Socket.IO handlers for whiteboard and editor events
   - Response: Real-time updates to all room participants

**Example**:
```typescript
// Client room creation
export const createRoom = createAsyncThunk(
  'room/create',
  async (data: CreateRoomRequest, { rejectWithValue }) => {
    try {
      const result = await roomService.create(data);
      return result;
    } catch (err) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);
```

### 4. Whiteboard Collaboration

**Purpose**: Real-time drawing and diagram creation with multi-user support

**Files Responsible**:
- `client/src/features/collaboration/whiteboardSlice.ts` - Whiteboard state
- `client/src/services/whiteboardService.ts` - Whiteboard API service
- `server/src/controllers/whiteboard.ts` - Whiteboard controller
- `server/src/routes/whiteboard.ts` - Whiteboard routes
- `server/src/models/Whiteboard.ts` - Whiteboard model
- `server/src/socket/whiteboardHandler.ts` - Socket.IO whiteboard handler
- `client/src/components/whiteboard/WhiteboardCanvas.tsx` - Canvas component
- `client/src/components/whiteboard/Toolbar.tsx` - Tool controls
- `client/src/components/whiteboard/PropertiesPanel.tsx` - Object properties
- `client/src/components/whiteboard/CursorsOverlay.tsx` - User cursors
- `client/src/hooks/useCollaborationSocket.ts` - Socket hook

**Request Flow**:
1. **Initialize Whiteboard**:
   - Client: GET `/api/whiteboards/:roomId` (auto-creates if missing)
   - Server: Return existing or create new whiteboard
   - Response: Whiteboard data with objects

2. **Save Whiteboard**:
   - Client: PUT `/api/whiteboards/:roomId` with updated objects
   - Server: Validate and save objects to database
   - Response: Success confirmation

3. **Real-time Operations**:
   - Client: WebSocket events (draw, update-object, delete-object)
   - Server: Broadcast events to all room participants
   - Response: Real-time rendering on all clients

4. **Undo/Redo Operations**:
   - Client: WebSocket events (undo, redo)
   - Server: Maintain operation history per room
   - Response: Synchronized undo/redo across all users

**Example**:
```typescript
// Socket.IO whiteboard handler
export function initializeSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    socket.on('join-room', (data) => {
      socket.join(data.roomId);
      // Load existing whiteboard
      const whiteboard = await whiteboardService.getForRoom(data.roomId);
      socket.emit('whiteboard-load', whiteboard);
    });
    
    socket.on('draw', async (data) => {
      await whiteboardService.addObject(data.roomId, data.object);
      socket.to(data.roomId).emit('draw', data);
    });
  });
}
```

### 5. Code Editor Collaboration

**Purpose**: Real-time code editing with Monaco Editor and live cursors

**Files Responsible**:
- `client/src/features/editor/editorSlice.ts` - Editor state management
- `client/src/services/documentService.ts` - Document API service
- `server/src/controllers/codeDocument.ts` - Code document controller
- `server/src/routes/codeDocument.ts` - Code document routes
- `server/src/models/CodeDocument.ts` - Code document model
- `server/src/socket/editorHandler.ts` - Socket.IO editor handler
- `client/src/components/editor/CodeIDE.tsx` - Main editor component
- `client/src/components/editor/MonacoEditor.tsx` - Monaco configuration
- `client/src/components/editor/FileExplorer.tsx` - File management
- `client/src/hooks/useEditorSocket.ts` - Editor socket hook

**Request Flow**:
1. **Document Management**:
   - Client: CRUD operations on `/api/documents`
   - Server: Create, read, update, delete code documents
   - Response: Document data with content

2. **Real-time Editing**:
   - Client: WebSocket events (code-change, cursor-update)
   - Server: Sync changes across all room participants
   - Response: Real-time editor updates

3. **Save Operations**:
   - Client: WebSocket events (save-document, sync-document)
   - Server: Persist document content to database
   - Response: Acknowledgment and broadcast to others

**Example**:
```typescript
// Socket.IO editor handler
export function initializeEditorHandlers(io: Server) {
  io.on('connection', (socket) => {
    socket.on('editor-join', async (data) => {
      socket.join(data.roomId);
      // Load all documents for room
      const documents = await documentService.getForRoom(data.roomId);
      socket.emit('documents-load', documents);
    });
    
    socket.on('code-change', async (data) => {
      await documentService.updateContent(data.fileName, data.content, data.roomId);
      socket.to(data.roomId).emit('code-change', data);
    });
  });
}
```

### 6. Chat and Communication

**Purpose**: Real-time chat with messaging, typing indicators, and message history

**Files Responsible**:
- `client/src/features/chat/chatSlice.ts` - Chat state management
- `client/src/services/chatService.ts` - Chat API service
- `server/src/controllers/chat.ts` - Chat controller
- `server/src/routes/chat.ts` - Chat routes
- `server/src/models/ChatMessage.ts` - Chat message model
- `server/src/socket/chatHandler.ts` - Socket.IO chat handler (if exists)
- `client/src/components/collaboration/RoomLayout.tsx` - Chat interface
- `client/src/hooks/useCollaborationSocket.ts` - Chat socket integration

**Request Flow**:
1. **Message History**:
   - Client: GET `/api/chat/:roomId` with pagination
   - Server: Return paginated message history
   - Response: Messages with sender information

2. **Send Message**:
   - Client: POST `/api/chat/:roomId` with message content
   - Server: Validate, save message, broadcast via WebSocket
   - Response: Created message

3. **Message Operations**:
   - Client: PUT/DELETE `/api/chat/:messageId`
   - Server: Handle edit/delete with permission checks
   - Response: Operation result

4. **Presence Features**:
   - Client: WebSocket events (typing-start, typing-stop, mark-seen)
   - Server: Track user activity and broadcast status
   - Response: Real-time UI updates

**Example**:
```typescript
// Chat API service
export const chatService = {
  getMessages: async (roomId: string, before?: string, limit: number = 50) => {
    const response = await api.get(`/chat/${roomId}`, {
      params: { before, limit }
    });
    return response.data;
  },
  
  sendMessage: async (roomId: string, content: string, type: string = 'text', replyTo?: string) => {
    const response = await api.post(`/chat/${roomId}`, {
      content, type, replyTo
    });
    return response.data;
  }
};
```

### 7. Task Management (Kanban Board)

**Purpose**: Task tracking with priorities, labels, checklists, and status management

**Files Responsible**:
- `client/src/features/task/taskSlice.ts` - Task state management
- `client/src/services/taskService.ts` - Task API service
- `server/src/controllers/task.ts` - Task controller
- `server/src/routes/task.ts` - Task routes
- `server/src/models/Task.ts` - Task model
- `server/src/models/TaskComment.ts` - Task comment model
- `client/src/components/tasks/KanbanBoard.tsx` - Kanban board UI
- `client/src/pages/dashboard/ActivityPage.tsx` - Task activity view
- `client/src/hooks/useCollaborationSocket.ts` - Task socket integration

**Request Flow**:
1. **Task Operations**:
   - Client: CRUD operations on `/api/tasks` and `/api/tasks/workspace/:workspaceId`
   - Server: Handle task creation, updates, deletions
   - Response: Task data with relationships

2. **Comments**:
   - Client: GET/POST `/api/tasks/:id/comments`
   - Server: Manage task comments with nested structure
   - Response: Comment lists or individual comments

3. **Kanban Operations**:
   - Client: Drag-and-drop with status updates
   - Server: Update task status, order, priorities
   - Response: Real-time board updates

**Example**:
```typescript
// Task API service
export const taskService = {
  getTasks: async (workspaceId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (workspaceId) params.append('workspaceId', workspaceId);
    if (status) params.append('status', status);
    
    const response = await api.get(`/tasks${params.toString() ? '?' + params.toString() : ''}`);
    return response.data;
  },
  
  createTask: async (data: CreateTaskRequest) => {
    const response = await api.post('/tasks', data);
    return response.data;
  }
};
```

### 8. File Management

**Purpose**: Upload, organize, and manage files within workspaces

**Files Responsible**:
- `client/src/features/files/fileSlice.ts` - File state management
- `client/src/services/fileService.ts` - File API service
- `server/src/controllers/file.ts` - File controller
- `server/src/routes/file.ts` - File routes
- `server/src/models/UploadedFile.ts` - File metadata model
- `client/src/components/files/FileExplorer.tsx` - File browser UI
- `client/src/pages/dashboard/FileManagerPage.tsx` - File manager page

**Request Flow**:
1. **File Listing**:
   - Client: GET `/api/files` with workspace and folder filters
   - Server: Query files with metadata
   - Response: File list with metadata

2. **File Upload**:
   - Client: POST `/api/files` with file data
   - Server: Validate, store file metadata, save file to disk
   - Response: File metadata

3. **File Operations**:
   - Client: GET `/api/files/folders` for folder structure
   - Client: PUT `/api/files/:id/rename` for renaming
   - Client: DELETE `/api/files/:id` for deletion
   - Server: Handle file operations with workspace permissions

**Example**:
```typescript
// File API service
export const fileService = {
  getFiles: async (workspaceId?: string, folder?: string) => {
    const params = new URLSearchParams();
    if (workspaceId) params.append('workspaceId', workspaceId);
    if (folder) params.append('folder', folder);
    
    const response = await api.get(`/files${params.toString() ? '?' + params.toString() : ''}`);
    return response.data;
  },
  
  uploadFile: async (formData: FormData) => {
    const response = await api.post('/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};
```

### 9. Meeting Management

**Purpose**: Schedule, manage, and track meetings with participants and agenda

**Files Responsible**:
- `client/src/features/meeting/meetingSlice.ts` - Meeting state management
- `client/src/services/meetingService.ts` - Meeting API service
- `server/src/controllers/meeting.ts` - Meeting controller
- `server/src/routes/meeting.ts` - Meeting routes
- `server/src/models/Meeting.ts` - Meeting model
- `client/src/components/meeting/MeetingRoom.tsx` - Meeting UI
- `client/src/pages/dashboard/MeetingsPage.tsx` - Meetings list page

**Request Flow**:
1. **Meeting Operations**:
   - Client: CRUD operations on `/api/meetings`
   - Server: Handle meeting creation, scheduling, status updates
   - Response: Meeting data with participants and details

2. **Participant Management**:
   - Client: Manage attendees and permissions
   - Server: Track meeting participants
   - Response: Updated participant lists

**Example**:
```typescript
// Meeting API service
export const meetingService = {
  getMeetings: async (workspaceId?: string) => {
    const params = workspaceId ? `?workspaceId=${workspaceId}` : '';
    const response = await api.get(`/meetings${params}`);
    return response.data;
  },
  
  createMeeting: async (data: CreateMeetingRequest) => {
    const response = await api.post('/meetings', data);
    return response.data;
  }
};
```

### 10. Notifications System

**Purpose**: Real-time notifications for user activities and system updates

**Files Responsible**:
- `client/src/features/notification/notificationSlice.ts` - Notification state management
- `client/src/services/notificationService.ts` - Notification API service
- `server/src/controllers/notification.ts` - Notification controller
- `server/src/routes/notification.ts` - Notification routes
- `server/src/models/Notification.ts` - Notification model
- `client/src/components/common/Toast.tsx` - Toast notification UI
- `client/src/pages/dashboard/NotificationsPage.tsx` - Notifications page

**Request Flow**:
1. **Notification Listing**:
   - Client: GET `/api/notifications` with limit
   - Server: Return paginated notifications for user
   - Response: Notification list with read status

2. **Notification Actions**:
   - Client: PUT `/api/notifications/read-all` to mark all read
   - Client: PUT `/api/notifications/:id/read` for individual
   - Client: DELETE `/api/notifications/:id` for removal
   - Client: DELETE `/api/notifications/clear` for bulk clear
   - Server: Update notification states
   - Response: Operation results

### 11. Activity Timeline

**Purpose**: Audit log of all user actions and system events

**Files Responsible**:
- `client/src/features/activity/activitySlice.ts` - Activity state management
- `client/src/services/activityService.ts` - Activity API service
- `server/src/controllers/activity.ts` - Activity controller
- `server/src/routes/activity.ts` - Activity routes
- `server/src/models/Activity.ts` - Activity model
- `client/src/components/collaboration/ActivityTimeline.tsx` - Timeline UI
- `client/src/pages/dashboard/ActivityPage.tsx` - Activity page

**Request Flow**:
1. **Activity Listing**:
   - Client: GET `/api/activities` with entity type filtering
   - Server: Query activities for authenticated user
   - Response: Activity timeline with filtering

2. **Activity Deletion**:
   - Client: DELETE `/api/activities/:id` for individual deletion
   - Client: DELETE `/api/activities/clear` for bulk deletion
   - Server: Remove activities with permission checks
   - Response: Operation results

### 12. Invite System

**Purpose**: Email-based invitations with token-based acceptance

**Files Responsible**:
- `client/src/features/collaboration/inviteSlice.ts` - Invite state management
- `client/src/services/inviteService.ts` - Invite API service
- `server/src/controllers/invite.ts` - Invite controller
- `server/src/routes/invite.ts` - Invite routes
- `server/src/models/Invite.ts` - Invite model
- `client/src/components/collaboration/InviteModal.tsx` - Invite UI

**Request Flow**:
1. **Invite Creation**:
   - Client: POST `/api/workspaces/:id/invites` with email and role
   - Server: Generate invite token, send email (if implemented)
   - Response: Created invite data

2. **Invite Acceptance**:
   - Client: POST `/api/invites/:token/accept`
   - Client: POST `/api/invites/:token/decline`
   - Server: Validate token, add user to workspace
   - Response: Success or error

3. **Invite Management**:
   - Client: GET `/api/invites/pending` for user's pending invites
   - Client: DELETE `/api/workspaces/:id/invites/:inviteId` for revocation
   - Server: Handle invite operations

### 13. Member Management

**Purpose**: Role-based workspace membership with permissions

**Files Responsible**:
- `client/src/features/collaboration/memberSlice.ts` - Member state management
- `client/src/services/memberService.ts` - Member API service
- `server/src/controllers/member.ts` - Member controller
- `server/src/routes/member.ts` - Member routes
- `server/src/models/Member.ts` - Member model
- `client/src/components/collaboration/WorkspaceMembers.tsx` - Member management UI

**Request Flow**:
1. **Member Listing**:
   - Client: GET `/api/workspaces/:id/members` with filters
   - Server: Return paginated member list with roles
   - Response: Member data with user information

2. **Member Operations**:
   - Client: POST `/api/workspaces/:id/members` to add members
   - Client: PUT `/api/workspaces/:id/members/:mid/role` for role changes
   - Client: PUT `/api/workspaces/:id/members/:mid/suspend` for suspension
   - Client: PUT `/api/workspaces/:id/members/:mid/reactivate` for reactivation
   - Client: DELETE `/api/workspaces/:id/members/:mid` for removal
   - Server: Handle all member operations with permission checks

### 14. Global Search

**Purpose**: Comprehensive search across all workspace entities

**Files Responsible**:
- `client/src/components/collaboration/GlobalSearch.tsx` - Search component
- `server/src/controllers/search.ts` - Search controller (if exists)
- Various API endpoints with search parameters

**Request Flow**:
1. **Global Search**:
   - Client: Access global search via Command Palette
   - Server: Search across workspaces, rooms, members, tasks, files
   - Response: Search results with highlighting

### 15. Analytics and Insights

**Purpose**: Data visualization and analytics for workspace metrics

**Files Responsible**:
- `client/src/pages/dashboard/InsightsPage.tsx` - Insights page
- `server/src/controllers/analytics.ts` - Analytics controller (if exists)
- Various API endpoints with statistics

**Request Flow**:
1. **Dashboard Analytics**:
   - Client: GET `/api/rooms/stats` for room statistics
   - Client: GET `/api/workspaces/:id/members/stats` for member stats
   - Client: GET `/api/workspaces/:id/invites/stats` for invite stats
   - Server: Calculate and return metrics
   - Response: Chart data and statistics

## Demo Mode Implementation

Demo Mode is a critical fallback system that ensures the application remains fully functional even when backend APIs are unavailable.

### Demo Mode Architecture

**Key Components**:
1. **Demo Token System**: Special `demo-token` JWT for demo authentication
2. **Demo Service Wrapper**: All API calls wrapped in demo fallback logic
3. **Shared Demo Data**: Centralized demo data in `client/src/data/demoWorkspaces.ts`
4. **LocalStorage Persistence**: User workspace state stored locally

**Demo Mode Files**:
- `client/src/services/demo.ts` - Demo mode utilities
- `client/src/data/demoWorkspaces.ts` - Centralized demo workspace data
- `client/src/data/demoData.ts` - Shared demo data structures
- All API service files with demo implementations (e.g., `client/src/services/workspaceService.ts`)

**Demo Mode Flow**:
1. **API Call Intercepted**: Every API call checks for demo mode
2. **Real Call Attempt**: Try to make real API call
3. **Demo Fallback**: If API fails, use demo data and operations
4. **Silent Operation**: Users experience no interruption
5. **Local Storage**: Changes persist across sessions

**Example Demo Implementation**:
```typescript
// Demo service pattern
export async function demo<T>(
  realCall: () => Promise<T>,
  fallback: () => T | Promise<T>
): Promise<T> {
  try {
    return await realCall();
  } catch {
    return await fallback();
  }
}
```

## Integration Points

### Client-Side Integration
1. **Auth State**: Demo mode sets `isDemo: true` in auth state
2. **API Interceptors**: Demo-aware API service calls
3. **Navigation**: Protected routes work with demo tokens
4. **Service Layer**: All services have demo implementations

### Server-Side Integration
1. **Demo Endpoints**: Special demo endpoints for local development
2. **Fallback APIs**: Mock API responses when database unavailable
3. **Demo User Support**: Special demo user accounts for testing

## Security Considerations in Demo Mode

1. **Token Validation**: Demo token distinguished from real tokens
2. **Operation Restrictions**: Demo mode prevents sensitive operations
3. **Data Isolation**: Demo data separate from production data
4. **Permission Boundaries**: Demo users have limited permissions

## Testing and Validation

Demo Mode enables comprehensive testing without backend dependency:

1. **Offline Development**: Work without server running
2. **Feature Testing**: Test all UI features independently
3. **User Experience**: Validate user flows and interactions
4. **Performance Testing**: Test with large demo datasets
5. **Bug Isolation**: Separate UI from backend issues

## Performance Optimization

Demo Mode includes optimizations for smooth user experience:

1. **Lazy Loading**: Load demo data on demand
2. **Caching**: Local caching of demo responses
3. **Background Sync**: Sync changes when backend available
4. **Compression**: Efficient demo data formats

## Conclusion

The feature mapping above demonstrates the comprehensive nature of SyncSpace, with 15+ major features that work together to provide a full-featured collaborative platform. Each feature follows consistent patterns for implementation, testing, and user experience, ensuring a cohesive and professional application.

The Demo Mode architecture ensures that users always have a fully functional experience, making SyncSpace ideal for presentations, training, and production deployments with limited infrastructure requirements.