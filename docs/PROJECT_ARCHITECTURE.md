# SyncSpace Architecture

## Overview

SyncSpace is a full-stack MERN application with real-time collaboration via Socket.IO. It follows a layered backend architecture (Controller → Service → Repository → Model) and a Redux-based frontend with Socket.IO hooks for real-time features.

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (React)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │Dashboard │ │Whiteboard│ │Code IDE  │ │  Chat  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ │
│       │             │            │             │      │
│  ┌────┴─────────────┴────────────┴─────────────┴──┐  │
│  │              Redux Store (12 slices)            │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │                              │
│  ┌────────────────────┴───────────────────────────┐  │
│  │          API Layer (Axios + Socket.IO)          │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP + WebSocket
┌──────────────────────┴──────────────────────────────┐
│                  Server (Express)                     │
│  ┌──────────────────────────────────────────────┐    │
│  │              Routes → Controllers             │    │
│  └──────────────────┬───────────────────────────┘    │
│  ┌──────────────────┴───────────────────────────┐    │
│  │              Service Layer                    │    │
│  └──────────────────┬───────────────────────────┘    │
│  ┌──────────────────┴───────────────────────────┐    │
│  │              Repository Layer                 │    │
│  └──────────────────┬───────────────────────────┘    │
│  ┌──────────────────┴───────────────────────────┐    │
│  │              Mongoose Models                  │    │
│  └──────────────────┬───────────────────────────┘    │
│                     │                                │
│  ┌──────────────────┴───────────────────────────┐    │
│  │          Socket.IO Handlers                   │    │
│  │  (Whiteboard + Editor + Chat + Presence)      │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │
              ┌────────┴────────┐
              │    MongoDB 7    │
              │   (Docker)      │
              └─────────────────┘
```

## Backend Architecture

### Layered Architecture

```
Controller (HTTP handling)
    ↓
Service (Business logic)
    ↓
Repository (Data access)
    ↓
Model (Mongoose schema)
```

- **Controllers** handle HTTP request/response, validation, and authentication checks
- **Services** encapsulate business logic, authorization rules, and cross-cutting concerns
- **Repositories** abstract database queries and pagination
- **Models** define Mongoose schemas with indexes and validation

### Real-time Architecture

Socket.IO runs alongside Express on the same HTTP server:

- **WhiteboardHandler** — Manages drawing events, object sync, undo/redo stacks, cursor positions, room presence
- **EditorHandler** — Manages code change broadcasting, cursor/selection sync, document persistence
- **In-memory state** — Per-room maps for objects, users, undo stacks (not persisted to Redis)

### Authentication Flow

1. Register/Login → bcrypt password verification → JWT access token (15min) + refresh token (7 days)
2. Refresh token stored as httpOnly cookie + hashed in `refreshtokens` collection
3. Access token verified by `authenticate` middleware on protected routes
4. Token rotation on refresh — old refresh deleted, new pair created

## Frontend Architecture

### State Management

12 Redux Toolkit slices managing:

- `auth` — User, tokens, authentication state
- `workspace` — Workspace CRUD, favorites, trash
- `room` — Room CRUD, stats
- `members` — Member management with pagination
- `invites` — Invite lifecycle
- `chat` — Messages, typing users
- `presence` — Online users
- `tasks` — Kanban tasks
- `files` — File metadata
- `editor` — Code documents, settings, open files
- `notification` — Notifications, unread count
- `activity` — Activity feed

### Real-time Hooks

- `useSocket` — Whiteboard collaboration (join/leave, draw events, cursor sync)
- `useCollaborationSocket` — Chat messages, typing indicators, presence
- `useEditorSocket` — Code editing collaboration (changes, cursors, saves)

### Component Hierarchy

```
App
├── ThemeProvider
│   └── ToastProvider
│       └── BrowserRouter
│           ├── Landing Page
│           ├── Auth Pages (Login, Register, Forgot, Reset)
│           └── ProtectedRoute
│               └── DashboardLayout
│                   ├── Sidebar (collapsible)
│                   ├── TopNav (search, notifications, profile)
│                   └── <Outlet> (page routes)
│                       ├── DashboardHome
│                       ├── WorkspacesPage / WorkspaceDetailPage
│                       ├── RoomsPage / RoomDetailPage
│                       │   └── RoomLayout
│                       │       ├── WhiteboardCanvas
│                       │       ├── CodeIDE → MonacoEditor + FileExplorer
│                       │       ├── KanbanBoard
│                       │       ├── ChatPanel + ChatInput
│                       │       └── PresenceSidebar
│                       ├── ActivityPage
│                       ├── NotificationsPage
│                       ├── SettingsPage
│                       └── TrashPage / SharedWithMePage
```

## Database Schema

### Core Relationships

```
User ──< Workspace (owner, members)
Workspace ──< Room
Workspace ──< Member
Workspace ──< Invite
Room ──< Whiteboard (1:1)
Room ──< CodeDocument
Room ──< ChatMessage
Room ──< RoomPresence
Workspace ──< Task
Task ──< TaskComment
Workspace ──< UploadedFile
User ──< Activity
User ──< Notification
User ──< RefreshToken
```

## Key Design Decisions

1. **Last-write-wins for real-time** — Simpler than OT/CRDT; acceptable for MVP
2. **In-memory Socket.IO state** — No Redis adapter; single-server deployment
3. **JWT + httpOnly refresh tokens** — Secure token management without session storage
4. **Soft deletes everywhere** — `isDeleted` + `deletedAt` for all major entities
5. **Controller → Service → Repository** — Clean separation of concerns
6. **DTOs for type safety** — Shared interfaces between layers
7. **CSS variables for theming** — Enables dark/light mode without component changes
