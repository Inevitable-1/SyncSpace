# SyncSpace — Project Architecture

A complete walkthrough of how SyncSpace is built: system overview, folder structure, frontend/backend/database design, and the key flows (auth, socket communication, whiteboard, room, workspace).

---

## 1. System Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Client (React)                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────────┐   │
│  │Dashboard│ │Whiteboard│ │ CodeIDE │ │ Chat / Kanban │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └──────┬────────┘   │
│       │           │           │              │            │
│  ┌────┴───────────┴───────────┴──────────────┴─────────┐  │
│  │              Redux Store (14 slices)                 │  │
│  └────────────────────────┬─────────────────────────────┘  │
│                           │                               │
│  ┌────────────────────────┴─────────────────────────────┐  │
│  │   Service Layer: Axios (REST) + Socket.IO (events)   │  │
│  │   Demo fallback: demo() / noop() wrappers             │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────┘
                             │ HTTP + WebSocket
┌────────────────────────────┴─────────────────────────────┐
│                    Server (Express)                       │
│  ┌─────────────┐   ┌─────────────┐   ┌──────────────┐    │
│  │ Routes      │ → │ Controllers │ → │ Services     │    │
│  │ (validation)│   │ (HTTP parse)│   │ (business)   │    │
│  └─────────────┘   └──────┬──────┘   └──────┬───────┘    │
│                           │                  │           │
│                      ┌────┴──────────────────┴─────┐     │
│                      │  Repositories (Mongoose)      │     │
│                      └──────────────┬───────────────┘     │
│                                     │                     │
│  ┌──────────────┐          ┌────────┴──────────┐          │
│  │ Socket.IO    │          │ MongoDB (16 models)│          │
│  │ (whiteboard  │          └───────────────────┘          │
│  │  + editor)   │                                        │
│  └──────────────┘                                        │
└──────────────────────────────────────────────────────────┘
```

**Key design decisions**

1. **Layered backend** (Controller → Service → Repository → Model) keeps business logic testable and data access isolated.
2. **Redux Toolkit** centralizes all client state; every domain has its own slice.
3. **Real-time via Socket.IO** for whiteboard and editor; REST for durable CRUD.
4. **Demo mode** — every service call is wrapped so the app runs fully offline with realistic seeded data.

---

## 2. Folder Structure

```
SyncSpace/
├── client/                          # React frontend (port 5173)
│   ├── src/
│   │   ├── App.tsx                  # Routing + providers
│   │   ├── main.tsx                 # Entry point
│   │   ├── store.ts                 # Redux store (14 slices)
│   │   ├── index.css                # Global styles + theme variables
│   │   ├── components/              # UI components grouped by domain
│   │   │   ├── chat/                # ChatPanel, ChatInput, ChatMessageItem
│   │   │   ├── collaboration/       # Presence, Members, Invites, Activity, RoomLayout
│   │   │   ├── common/              # Avatar, Modal, Toast, Spinner, Skeleton, etc.
│   │   │   ├── editor/              # CodeIDE, MonacoEditor, LiveCursors, Terminal/Output
│   │   │   ├── files/               # FileExplorer
│   │   │   ├── intro/               # IntroScreen + animated canvas scenes
│   │   │   ├── layout/              # DashboardLayout, Sidebar, TopNav
│   │   │   ├── meeting/             # MeetingRoom
│   │   │   ├── tasks/               # KanbanBoard
│   │   │   ├── whiteboard/          # WhiteboardCanvas, Toolbar
│   │   │   ├── workspace/           # WorkspaceOnboarding, WorkspaceCard
│   │   │   └── (root)               # Icons, CommandPalette, ProtectedRoute, ...
│   │   ├── context/                 # ThemeContext
│   │   ├── data/                    # demoData.ts, demoWorkspaces.ts
│   │   ├── features/                # 14 Redux slices (auth, workspace, room, chat, ...)
│   │   ├── hooks/                   # useSocket, useEditorSocket, useCollaborationSocket
│   │   ├── pages/                   # Auth pages + dashboard pages + WhiteboardPage
│   │   ├── services/                # REST service layer + demo.ts + api.ts
│   │   ├── types/                   # Shared TypeScript interfaces
│   │   └── utils/                   # confetti.ts, etc.
│   └── vite.config.ts
├── server/                          # Express backend (port 5000)
│   ├── src/
│   │   ├── app.ts                   # Express + Socket.IO bootstrap
│   │   ├── server.ts                # Entry point
│   │   ├── configs/db.ts            # MongoDB connection
│   │   ├── controllers/             # 13 controllers (auth, workspace, room, chat, ...)
│   │   ├── dto/                     # Validation DTOs (workspace, member, invite, common)
│   │   ├── middleware/              # auth, errorHandler, upload
│   │   ├── models/                  # 16 Mongoose models
│   │   ├── repositories/            # Data access layer (workspace, member, invite)
│   │   ├── routes/                  # 13 route files (87 endpoints)
│   │   ├── scripts/seed.ts          # Database seeding
│   │   ├── services/                # Business logic (workspace, member, invite)
│   │   ├── socket/                  # whiteboardHandler, editorHandler
│   │   ├── types/                   # Shared server types
│   │   └── utils/                   # asyncHandler, logger, tokens
│   └── package.json
├── docker/                          # Dockerfiles
├── docker-compose.yml               # Local compose setup
├── docs/                            # All project documentation
└── package.json                     # npm workspace root
```

---

## 3. Frontend Architecture

### 3.1 State management — Redux Toolkit (14 slices)

The single source of truth lives in `client/src/store.ts`:

| Slice | Responsibility |
| --- | --- |
| `auth` | user, tokens, demo flag |
| `workspace` | workspace CRUD, trash, favorites, search |
| `room` | rooms per workspace, active room |
| `chat` | messages, typing users |
| `presence` | connected users, cursors |
| `task` | Kanban tasks |
| `file` | files/folders |
| `editor` | code documents, live cursors, active file |
| `activity` | activity feed |
| `notification` | real-time notifications |
| `member` | workspace members |
| `invite` | workspace invites |
| `meeting` | meetings |

### 3.2 Service layer — REST with demo fallback

`client/src/services/api.ts` creates an Axios instance pointing at `VITE_API_URL || http://localhost:5000`. Each domain service (e.g. `workspaceService.ts`) wraps real calls:

```ts
// client/src/services/demo.ts
export async function demo<T>(realCall, fallback) {
  try {
    return await realCall();
  } catch {
    return await fallback(); // demo payload on ANY failure
  }
}
```

So every feature transparently works in **demo mode** (offline) and **live mode** (MongoDB connected).

### 3.3 Routing

`client/src/App.tsx` uses React Router:

| Route | Page |
| --- | --- |
| `/` | LandingPage |
| `/intro` | IntroScreen |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Auth pages |
| `/whiteboard/:roomId` | WhiteboardPage |
| `/dashboard/*` | Protected dashboard (workspaces, rooms, tasks, files, meetings, settings, ...) |

### 3.4 Theming

`context/ThemeContext.tsx` + CSS variables in `index.css` provide light/dark themes across the entire UI.

---

## 4. Backend Architecture

### 4.1 Layered flow

```
Route (express-validator)
  → Controller (parse request, call service, shape response)
    → Service (business logic, authz checks)
      → Repository (Mongoose queries)
        → Model (MongoDB schema)
```

The **Repository pattern** is used for the workspace/member/invite domain (where data access is complex). Other domains call Mongoose models directly from controllers/services.

### 4.2 API surface — 87 endpoints across 13 route files

| Module | Base path | Highlights |
| --- | --- | --- |
| auth | `/api/auth` | register, login, demo, logout, forgot/reset password |
| workspaces | `/api/workspaces` | CRUD, members, invites, trash, search, favorite, archive, restore |
| rooms | `/api/rooms` | CRUD, stats, join/leave |
| activities | `/api/activities` | list, create, delete |
| notifications | `/api/notifications` | CRUD, mark read, clear all |
| whiteboard | `/api/whiteboard` | get/save state |
| members | `/api/members` | role update, suspend/reactivate |
| invites | `/api/invites` | create, accept/decline, stats |
| chat | `/api/chat` | messages CRUD, seen |
| tasks | `/api/tasks` | task + comment CRUD |
| files | `/api/files` | upload, list, rename, delete, download |
| documents | `/api/documents` | code document CRUD |
| meetings | `/api/meetings` | CRUD, start/end, stats |

### 4.3 Middleware

- `authenticate` (`middleware/auth.ts`) — verifies `Bearer` JWT, attaches `req.user`
- `errorHandler` — unified error responses
- `upload` — multer file uploads (50MB limit)
- Global: `helmet`, `compression`, `cors`, `cookieParser`

### 4.4 Authentication & tokens (`utils/tokens.ts`)

- Access token: JWT signed with `JWT_SECRET`, expiry from `JWT_EXPIRES_IN` (default `15m`)
- Refresh token: `crypto.randomBytes(40)` random string, **hashed (sha256) at rest** in `RefreshToken` model, 7-day expiry

---

## 5. Database Architecture — 16 Mongoose Models

| Model | Purpose | Key fields |
| --- | --- | --- |
| `User` | accounts | email, password (hashed), name, avatar |
| `RefreshToken` | token rotation | userId, hashedToken, expiresAt |
| `Workspace` | top-level unit | name, description, color, icon, isPublic, inviteCode, members, isDeleted |
| `Member` | role-based membership | workspaceId, userId, role, status, invitedBy |
| `Invite` | email invitations | email, token, expiresAt, status, role |
| `Room` | collaboration room | name, type, workspace, owner, isActive, isDeleted |
| `RoomPresence` | live presence | roomId, socketId, userId, cursor |
| `Whiteboard` | whiteboard state | roomId, objects, selectedIds, tool, colors |
| `CodeDocument` | code docs | roomId, workspaceId, path, content, language |
| `ChatMessage` | persistent chat | roomId, sender, content, replyTo, seenBy |
| `Task` | Kanban tasks | workspaceId, title, status, priority, labels, dueDate, checklist |
| `TaskComment` | task comments | taskId, author, content |
| `UploadedFile` | file metadata | name, mimeType, size, folder, url |
| `Activity` | audit log | action, user, workspace, room, metadata |
| `Notification` | in-app alerts | type, title, message, read, workspace, room |
| `Meeting` | scheduled meetings | title, agenda, startTime, duration, participants, status |

---

## 6. Authentication Flow

```
Client                              Server
  │  POST /api/auth/register          │
  │──────────────────────────────────▶│  validate body (express-validator)
  │                                   │  hash password (bcrypt)
  │                                   │  create User
  │                                   │  generate access JWT + refresh token
  │◀──────────────────────────────────│  return { user, accessToken, refreshToken }
  │  store in Redux + localStorage    │
  │                                   │
  │  GET /api/workspaces (Bearer)     │
  │──────────────────────────────────▶│  authenticate middleware verifies JWT
  │◀──────────────────────────────────│  returns data scoped to req.user.id
```

- **Demo login**: `POST /api/auth/demo` returns a seeded demo user; the client uses `demoAuth()` offline.
- **Forgot/reset password**: `forgot-password` issues a reset token → `reset-password` verifies and updates the hash.

---

## 7. Socket Communication Flow

### 7.1 Server setup (`server/src/app.ts`)

- Same HTTP server handles REST + Socket.IO
- `initializeSocketHandlers(io)` → whiteboard events
- `initializeEditorHandlers(io)` → editor events
- Clients authenticate via `auth: { token }` on connection

### 7.2 Whiteboard events (`socket/whiteboardHandler.ts`)

| Event | Direction | Purpose |
| --- | --- | --- |
| `join-room` | client → server | join room, receive `room-joined` |
| `draw` | client → server → room | broadcast new object |
| `update-object` | client → server → room | broadcast object transform |
| `delete-object` | client → server → room | remove object |
| `cursor-move` | client → server → room | broadcast cursor position |
| `undo` / `redo` | client → server → room | history navigation |
| `clear-canvas` | client → server → room | clear all objects |
| `save-whiteboard` | client → server → DB | persist to MongoDB |
| `leave-room` | client → server | leave + cleanup presence |

### 7.3 Editor events (`socket/editorHandler.ts`)

| Event | Direction | Purpose |
| --- | --- | --- |
| `editor:join` / `editor:leave` | client ↔ server | document room membership |
| `code:change` | client → server → room | live code delta sync |
| `cursor:update` | client → server → room | live cursor positions |
| `selection:update` | client → server → room | text selection sync |
| `editor:save-document` | client → server → DB | persist document |
| `editor:sync-document` | server → client | initial document state |

### 7.4 Client hooks

- `useSocket` — core socket lifecycle, auth token injection, whiteboard events, exposes `emitDraw/emitUpdate/emitDelete/emitCursor/emitUndo/emitRedo/emitClear/emitSave`
- `useEditorSocket` — editor events, wires deltas into `editorSlice`
- `useCollaborationSocket` — chat/presence/notification events for the room layout

---

## 8. Whiteboard Flow

1. User opens `/whiteboard/:roomId` → `WhiteboardPage`.
2. `useSocket` connects with JWT, emits `join-room`.
3. Server replies `room-joined` with existing objects + connected users (from `Whiteboard` model).
4. `WhiteboardCanvas` (React-Konva) renders objects; `Toolbar` controls the active tool/color/stroke/fill/opacity.
5. Drawing emits `draw` → server broadcasts `object-added` → all clients update.
6. Transforming emits `update-object`; deleting emits `delete-object`.
7. Cursors broadcast via `cursor-move` / `cursor-update` with per-user colors.
8. Auto-save via `save-whiteboard` persists the canvas to MongoDB.

---

## 9. Room Flow

1. Within a workspace, a room is created (`CreateRoomModal`) with a **type** (whiteboard / code / document).
2. `roomService.create` persists a `Room` doc; room appears on `RoomsPage`.
3. Opening a room routes to `RoomDetailPage` → `RoomLayout` with 8 tabs: Whiteboard, Code, Files, Chat, Members, Activity, Tasks, Settings.
4. Each tab mounts the matching component + socket hook (canvas, CodeIDE, FileExplorer, ChatPanel, WorkspaceMembers, ActivityTimeline, KanbanBoard).
5. Rooms support join/leave, soft-delete (`isDeleted`), restore, and real-time presence via `RoomPresence`.

---

## 10. Workspace Flow

1. `WorkspacesPage` lists workspaces (searchable, favorite-able, archived).
2. Creating a workspace auto-generates an `inviteCode`.
3. `WorkspaceDetailPage` manages: rooms, members (role update, suspend/reactivate), invites (email + role, expiry).
4. Join flows: accept an email invite OR enter an invite code (`joinByInviteCode`).
5. Trash (`/api/workspaces/trash`) allows soft-deleted workspace restore.
6. Dashboard aggregates workspace stats for the home page.

---

## 11. Demo / Offline Mode

- All demo data centralized in `client/src/data/demoData.ts` + `demoWorkspaces.ts` (6 workspaces).
- `demo()` wrapper: real API call → falls back to demo payload on failure.
- `noop()` wrapper: real mutation → silently ignored in demo mode.
- `demoAuth()` returns a demo user + `demo-token` when offline.
- Server `scripts/seed.ts` seeds identical content into MongoDB for live mode.

---

## 12. Deployment

- **Docker**: `docker/Dockerfile.client`, `docker/Dockerfile.server`, `docker-compose.yml` (client + server + Mongo).
- **Env vars**: `VITE_API_URL`, `VITE_SOCKET_URL`, `CORS_ORIGIN`, `MONGODB_URI`, `JWT_SECRET`.
- **Scripts**: `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck` (all workspaces).

---

_See also: [PROJECT_PROGRESS.md](./PROJECT_PROGRESS.md) for the build history and [PROJECT_REVIEW_GUIDE.md](./PROJECT_REVIEW_GUIDE.md) for the feature-by-feature review script._
