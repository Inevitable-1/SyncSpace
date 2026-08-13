# Architecture

How SyncSpace is structured — frontend, backend, authentication, database, routing and components.

---

## System Overview

```
┌─────────────────────────────────────────────┐
│                 Browser / Client            │
│   React 18 · TypeScript · Vite · Tailwind   │
│   Redux Toolkit · Socket.IO client · Konva  │
└──────────────┬──────────────────────────────┘
               │ REST (axios)         │ WebSocket (socket.io)
               ▼                      ▼
┌─────────────────────────────────────────────┐
│                   Server                    │
│   Express 5 · TypeScript · Socket.IO        │
│   Controllers → Services → Repositories     │
│   Middleware (auth, error, upload, helmet)  │
└──────────────┬──────────────────────────────┘
               │ Mongoose
               ▼
┌─────────────────────────────────────────────┐
│                   MongoDB 7                 │
│   16 collections · indexed & timestamped    │
└─────────────────────────────────────────────┘
```

---

## Frontend (`client/`)

### Stack

- **React 18** with hooks and function components.
- **TypeScript 7** — strict typing shared with the backend via a central `types/` module.
- **Vite 8** for fast dev server and production builds.
- **Tailwind CSS 3** for styling, with CSS-variable theming (light/dark).

### State management — Redux Toolkit

The client is organized into **12 domain slices**:

| Slice | Responsibility |
| ----- | -------------- |
| `auth` | Session, user, tokens |
| `workspace` | Workspace CRUD, trash, favorites |
| `room` | Rooms and current room |
| `member` | Membership & roles |
| `invite` | Invitations |
| `chat` | Messages, typing users |
| `editor` | Code documents, open files, settings |
| `presence` | Online users |
| `task` | Kanban tasks |
| `notification` | Notification center |
| `meeting` | Meetings & stats |
| `file` | Uploaded files & folders |
| `activity` | Audit log |

### Real-time layer

Dedicated hooks wrap the Socket.IO client:

- `useSocket` — connection lifecycle + auth handshake.
- `useCollaborationSocket` — whiteboard, chat and presence events.
- `useEditorSocket` — code editor sync events.

### Services

`services/` contains thin axios wrappers (one per domain). Every service supports a **demo-mode fallback** so the UI remains explorable when the API is offline.

---

## Backend (`server/`)

### Layered design

```
Routes  →  Middleware (validation/auth)  →  Controllers  →  Services  →  Repositories  →  Models
```

- **Routes** declare HTTP methods and validation via `express-validator`.
- **Controllers** parse requests, orchestrate and format responses.
- **Services** contain business logic (membership rules, invite expiry, soft-delete flows).
- **Repositories** abstract Mongoose queries behind focused interfaces.
- **Models** define Mongoose schemas with indexes and hooks.

### Middleware

- `auth` — verifies the JWT and attaches the user.
- `errorHandler` — centralized AppError handling with consistent JSON shape.
- `upload` — multer configuration for file uploads.

### Socket layer

Two handlers (`whiteboardHandler`, `editorHandler`) own real-time event channels:

- Whiteboard: `draw`, `update-object`, `cursor-move`, `undo`, `redo`, `clear-canvas`.
- Editor: `code-change`, `cursor-update`, `selection-update`, `save-document`.

---

## Authentication

- **Passwordless onboarding** — users sign in with name + email (an existing email auto-signs-in).
- **JWT access token** (short-lived) returned to the client and kept in memory.
- **Refresh token** (long-lived) stored as an **httpOnly cookie**.
- **Rotation** — every `/refresh-token` call issues a new pair and revokes the old one.
- Protected endpoints run through the `auth` middleware before touching any domain logic.

---

## Database (MongoDB)

16 models, all timestamped:

`User`, `RefreshToken`, `Workspace`, `Member`, `Invite`, `Room`, `RoomPresence`,
`Whiteboard`, `CodeDocument`, `ChatMessage`, `Task`, `TaskComment`, `UploadedFile`,
`Meeting`, `Activity`, `Notification`.

Key design points:

- **Unique indexes** on emails, invite tokens and invite codes.
- **TTL index** on `Invite.expiresAt` for automatic expiry.
- **Soft deletes** via `isDeleted` / `deletedAt` for workspaces, rooms, files and tasks.
- **Population** of member/user relationships on read.

---

## Routing

### Client routing (`react-router-dom` v6)

| Route | Purpose |
| ----- | ------- |
| `/` | Landing page |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Auth pages |
| `/dashboard` | Protected dashboard hub |
| `/dashboard/*` | Workspaces, rooms, meetings, files, insights, activity, trash, notifications, settings, profile |
| `/whiteboard/:roomId` | Full-screen whiteboard |
| `*` | 404 not found |

### Server routing

Each domain exposes a REST API mounted under `/api/...`:

`/api/auth`, `/api/workspaces`, `/api/rooms`, `/api/members`, `/api/invites`,
`/api/chat`, `/api/tasks`, `/api/files`, `/api/documents`, `/api/meetings`,
`/api/whiteboards`, `/api/activities`, `/api/notifications`.

See [API_REFERENCE.md](./API_REFERENCE.md) for the full endpoint list.

---

## Components

The client is organized into focused directories:

- `components/common` — Button, Card, Modal, Spinner, Skeleton, Avatar, Toast, EmptyState, Dropdown, Toggle, ConfirmDialog, ErrorMessage, ErrorBoundary.
- `components/layout` — DashboardLayout, Sidebar, TopNav.
- `components/whiteboard` — WhiteboardCanvas, Toolbar, PropertiesPanel, CursorsOverlay, StatusBar.
- `components/editor` — CodeIDE, MonacoEditor, FileExplorer, LiveCursors, Terminal, Output, Settings.
- `components/collaboration` — RoomLayout, ChatPanel, PresenceSidebar, WorkspaceMembers, InviteModal, GlobalSearch, ActivityFeed/Timeline.
- `components/tasks` — KanbanBoard.
- `components/meeting` — MeetingRoom.
- `components/logo` — LogoMark, AnimatedLogo, LoadingScreen.
- `components/workspace` — WorkspaceCard, WorkspaceOnboarding.

Reusable primitives keep pages declarative: pages compose layout + domain components + shared UI.
