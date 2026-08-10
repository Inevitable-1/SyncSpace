# PROJECT_EXPLANATION.md

## Overall Project Structure

SyncSpace is a real-time collaborative platform for teams, combining whiteboard drawing, code editing, chat, and task management in one integrated workspace. Built with modern web technologies, it provides enterprise-grade collaboration features.

```
SyncSpace/
├── client/                          # React frontend (port 5173)
│   ├── src/
│   │   ├── components/              # 16+ reusable UI components
│   │   │   ├── common/              # Button, Card, Badge, Avatar, Modal, etc.
│   │   │   ├── layout/              # Sidebar, TopNav, DashboardLayout
│   │   │   ├── whiteboard/          # Canvas, Toolbar, PropertiesPanel, Cursors
│   │   │   ├── editor/              # CodeIDE, MonacoEditor, FileExplorer
│   │   │   ├── collaboration/       # RoomLayout, Chat, Presence, Members
│   │   │   ├── tasks/               # KanbanBoard
│   │   │   ├── files/               # FileExplorer
│   │   │   └── charts/              # BarChart, DonutChart
│   │   ├── features/                # 12 Redux slices (auth, workspace, room, etc.)
│   │   ├── hooks/                   # useSocket, useCollaborationSocket, useEditorSocket
│   │   ├── pages/                   # 14 dashboard pages + auth pages
│   │   ├── services/                # 14 API service files
│   │   └── types/                   # Shared TypeScript interfaces
│   └── vite.config.ts
├── server/                          # Express backend (port 5000)
│   ├── src/
│   │   ├── models/                  # 16 Mongoose models
│   │   ├── controllers/             # 12 controllers (auth, workspace, room, etc.)
│   │   ├── routes/                  # 12 route files
│   │   ├── services/                # 3 business logic services
│   │   ├── repositories/            # 3 repository pattern files
│   │   ├── dto/                     # 4 DTO files
│   │   ├── socket/                  # Socket.IO handlers (whiteboard + editor)
│   │   ├── middleware/              # auth, errorHandler
│   │   └── utils/                   # tokens, logger, asyncHandler
│   └── tsconfig.json
├── docker/                          # Dockerfiles
├── docker-compose.yml               # MongoDB + Redis + Server + Client
└── docs/                            # Development reports and API reference
```

## Client Architecture

### Frontend Framework
- **React 18** with TypeScript 7 for type safety
- **Vite 8** for fast development and optimized builds
- **Redux Toolkit** for state management
- **Tailwind CSS 3** for styling
- **Framer Motion** for animations

### Key Components
1. **Authentication Context** - User login, registration, token management
2. **Theme Context** - Dark/light mode support
3. **Socket Connections** - Real-time whiteboard and editor collaboration
4. **API Services** - Axios-based HTTP client with interceptor for token refresh
5. **Toast Notifications** - Global notification system

### Routing System
- **Public Routes**: Landing, Login, Register, Forgot/Reset Password
- **Protected Routes**: Dashboard with layout and nested routes
- **Dynamic Routes**: Workspace/:id, Rooms/:id, Whiteboard/:roomId
- **Command Palette** - Global search and command interface
- **AI Sidebar** - AI assistant integration

## Server Architecture

### Backend Framework
- **Node.js** with Express 5 for HTTP server
- **TypeScript** for type safety
- **Mongoose 9** for MongoDB object modeling
- **Socket.IO 4** for real-time communication
- **Winston** for logging

### Core Modules
1. **Models** - Mongoose schemas for all data entities
2. **Controllers** - Express controllers with business logic
3. **Routes** - Express route definitions
4. **Repositories** - Data access layer using repository pattern
5. **Socket Handlers** - WebSocket event handlers for whiteboard and editor
6. **Middleware** - Authentication, error handling, file upload
7. **Utilities** - JWT tokens, asyncHandler, logger

## Data Flow

### Client → Server → Database
1. **API Calls**: HTTP requests via Axios with authentication
2. **WebSocket Events**: Real-time collaboration via Socket.IO
3. **Database Operations**: CRUD operations via Mongoose models
4. **Response Handling**: JSON responses with standardized format

### Server → Client
1. **HTTP Responses**: API endpoints return JSON data
2. **WebSocket Messages**: Real-time updates for whiteboard, editor, chat
3. **Push Notifications**: Activity, notifications via polling

## Authentication Flow

1. **Client Initiation**: User attempts to access protected route
2. **Token Check**: ProtectedRoute component checks for auth token
3. **Token Validation**: API interceptor adds auth header
4. **Refresh Token**: Automatic token refresh on 401 errors
5. **Session Management**: LocalStorage stores auth state
6. **Logout**: Clear localStorage and server-side session

## API Flow

### HTTP Request Processing
1. **Route Matching**: Express routes match incoming requests
2. **Authentication Middleware**: Validate JWT tokens
3. **Controller Execution**: Business logic in controllers
4. **Repository Operations**: Database operations
5. **Response Formatting**: Standardized JSON responses
6. **Error Handling**: ErrorHandler middleware formats errors

### WebSocket Event Processing
1. **Connection Establishment**: Socket.IO connection setup
2. **Authentication**: Validate socket connection
3. **Event Handling**: Specific handlers for whiteboard, editor, chat
4. **Broadcast**: Emit updates to all room participants
5. **Presence Tracking**: Monitor online users

## State Management

### Redux Architecture
- **Slices**: 12+ feature-specific reducers
- **Store**: Centralized state management
- **Actions**: Async thunks for API calls
- **Selectors**: State selection utilities
- **Middleware**: RTK Query, Saga for async flows

### Local Storage Integration
- **Persisted State**: Auth state stored in localStorage
- **User Workspaces**: Demo mode workspace management
- **Theme Preferences**: Dark/light mode persistence

## Routing

### Public Routes (No Auth Required)
- `/` - LandingPage (Marketing)
- `/login` - LoginPage
- `/register` - RegisterPage
- `/forgot-password` - ForgotPasswordPage
- `/reset-password` - ResetPasswordPage

### Protected Routes (Auth Required)
- `/dashboard` - DashboardLayout with sidebar
- `/dashboard/workspaces` - WorkspacesPage
- `/dashboard/workspaces/:id` - WorkspaceDetailPage
- `/dashboard/rooms` - RoomsPage
- `/dashboard/rooms/:id` - RoomDetailPage
- `/dashboard/meetings` - MeetingsPage
- `/dashboard/shared` - SharedWithMePage
- `/dashboard/activity` - ActivityPage
- `/dashboard/trash` - TrashPage
- `/dashboard/notifications` - NotificationsPage
- `/dashboard/settings` - SettingsPage
- `/dashboard/profile` - ProfilePage
- `/dashboard/insights` - InsightsPage
- `/dashboard/files` - FileManagerPage
- `/whiteboard/:roomId` - WhiteboardPage (full-screen)

## Database Connection

### MongoDB Setup
- **Database**: syncspace (MongoDB 7)
- **Connection**: Mongoose ODM with connection pooling
- **Environment**: Development and production configurations
- **Models**: 16 schemas with relationships

### Schema Relationships
- **Users**: User accounts with hashed passwords
- **Workspaces**: Workspace configuration and ownership
- **Rooms**: Collaboration rooms within workspaces
- **Members**: Role-based workspace membership
- **Invites**: Email-based invitation tracking
- **Tasks**: Kanban tasks with priorities and labels
- **TaskComments**: Comments on tasks
- **ChatMessages**: In-room chat messages
- **Whiteboards**: Konva.js whiteboard object storage
- **CodeDocuments**: Code files with version tracking
- **Activities**: Audit log of all actions
- **Notifications**: User notifications
- **RoomPresences**: Real-time presence tracking
- **RefreshTokens**: JWT refresh token rotation
- **UploadedFiles**: File upload metadata

## Whiteboard Architecture

### Canvas Implementation
- **Library**: React Konva for canvas rendering
- **Drawing Tools**: Rectangle, circle, text, arrow, line
- **Properties**: Stroke, fill, strokeWidth, cornerRadius
- **Interaction**: Mouse events for drawing and manipulation

### Drawing Engine
- **Real-time Synchronization**: Socket.IO broadcasts draw events
- **Object Storage**: MongoDB stores whiteboard objects per room
- **Version Control**: Auto-save on room changes
- **Cursor Tracking**: Multi-user cursor positions

### Undo/Redo
- **Client-side Stack**: Local undo/redo history
- **Server Sync**: Changes saved to database
- **Multi-user Support**: Per-user undo stacks

### Stroke Rendering
- **Vector Graphics**: Path-based rendering for smooth lines
- **Anti-aliasing**: High-quality rendering
- **Performance**: Batch rendering for complex canvases

## Meeting Architecture

### Meeting Management
- **Scheduling**: Create, update, cancel meetings
- **Participants**: Manage meeting attendees
- **Room Integration**: Link meetings to workspace rooms
- **Analytics**: Meeting statistics and insights

### Real-time Meeting
- **Live Streaming**: Video/audio integration (placeholder)
- **Screen Sharing**: Share desktop or application
- **Recording**: Optional meeting recording
- **Reactions**: Emoji and reactions

## Demo Mode Architecture

### Fallback Mechanism
- **API Service Wrapper**: All API calls wrapped in demo function
- **Demo Data**: Pre-populated workspaces, tasks, whiteboards
- **LocalStorage**: User workspace persistence
- **Silent Fallback**: Automatic switch to demo on API failure

### Demo Components
- **DemoUser**: Pre-defined demo user accounts
- **DemoWorkspaces**: Sample workspaces with realistic data
- **DemoData**: Sample tasks, chat messages, files
- **DemoServices**: All API services have demo implementations

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18, TypeScript 7, Vite 8 | UI framework and build tool |
| State | Redux Toolkit | State management |
| Styling | Tailwind CSS 3 | Utility-first CSS |
| Animation | Framer Motion | UI animations |
| Real-time | Socket.IO 4, React Konva | WebSocket and canvas |
| Backend | Node.js, Express 5, TypeScript 7 | Server framework |
| Database | MongoDB 7 with Mongoose 9 | Data storage |
| Auth | JWT, bcryptjs, httpOnly cookies | Authentication |
| DevOps | Docker Compose, Redis 7 | Deployment |

## Key Features

1. **Real-time Whiteboard** - Drawing tools, shapes, text, undo/redo
2. **Collaborative Code Editor** - Monaco Editor with live cursors
3. **Real-time Chat** - Messages, replies, emoji, typing indicators
4. **Kanban Task Board** - 4-column drag-and-drop with priorities
5. **Workspace Management** - Create, edit, delete, archive, favorite
6. **Member Management** - Roles, suspend, promote, demote
7. **Invite System** - Email-based invitations with token expiry
8. **Dashboard Analytics** - Stat cards, charts, activity timeline
9. **Global Search** - Cmd+K search across all entities
10. **Dark/Light Mode** - Full theme support with CSS variables
11. **Responsive Design** - Mobile-friendly layouts
12. **Professional UI** - 16+ reusable components

## Development Workflow

### Local Development
```bash
git clone https://github.com/Inevitable-1/SyncSpace.git
cd SyncSpace
npm install
npm run dev  # Starts client and server
```

### Production Build
```bash
npm run build
npm start  # Start server only
```

### Code Quality
```bash
npm run lint      # Prettier formatting check
npm run format    # Auto-format code
npm run typecheck # TypeScript type checking
```

## Security Features

1. **JWT Authentication** - Access and refresh tokens
2. **Password Hashing** - bcryptjs for secure password storage
3. **CORS Configuration** - Restrict API access by origin
4. **Helmet** - HTTP headers security
5. **Rate Limiting** - Prevent brute-force attacks
6. **Input Validation** - express-validator for request validation
7. **Error Handling** - Standardized error responses
8. **File Upload** - Multer with size limits and MIME validation

## Scalability Considerations

1. **Monorepo Architecture** - Shared dependencies and configuration
2. **Docker Support** - Containerized deployment
3. **Database Optimization** - Mongoose connection pooling
4. **Real-time Optimization** - Socket.IO room-based communication
5. **Performance Monitoring** - Build warnings and optimization suggestions

## Future Enhancements

1. **Operational Transform** - CRDT for conflict-free editing
2. **Docker-in-Docker** - Real terminal execution
3. **Rich Text Editing** - Document collaboration
4. **User Profiles** - Custom avatars and profiles
5. **Email Verification** - Account verification flow
6. **Rate Limiting** - API endpoint protection
7. **CI/CD Pipeline** - Automated testing and deployment
8. **End-to-end Testing** - Comprehensive test coverage
9. **WebSocket Reconnection** - Connection resilience
10. **Cloud Storage** - S3 integration for file uploads
11. **Search Engine** - Elasticsearch for full-text search

## Deployment Guide

### Local Deployment
```bash
docker compose up -d
```

### Environment Variables
```bash
# server/.env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/syncspace
CLIENT_URL=http://localhost:5173
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173

# client/.env
VITE_API_URL=http://localhost:5000
```

### Production Considerations
- Use environment-specific configurations
- Enable HTTPS for production
- Set appropriate CORS origins
- Use Redis for session storage
- Implement backup strategies for MongoDB
- Configure monitoring and logging

## Conclusion

SyncSpace is a comprehensive collaborative platform that combines multiple productivity tools into a single integrated workspace. Built with modern web technologies and best practices, it provides a robust foundation for team collaboration with real-time capabilities and offline fallback support.
