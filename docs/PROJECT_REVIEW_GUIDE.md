# SyncSpace — Project Review Guide

A feature-by-feature review script for presenting SyncSpace to reviewers. For every major feature: **purpose**, **why it was built**, **files used**, **how it works**, **API**, **backend**, and **frontend**.

---

## Suggested Review Flow

1. Landing page + intro screen
2. Demo login (offline, zero setup)
3. Workspace management
4. Real-time whiteboard (2 browser tabs)
5. Collaborative code editor (2 browser tabs)
6. Real-time chat + presence
7. Kanban tasks + files
8. Meetings + notifications + activity
9. Settings, theming, search
10. Architecture walkthrough (layered backend, Socket.IO, Redux)

---

## 1. Authentication

**Purpose** — Secure signup/login with JWT, refresh-token rotation, password reset, and instant demo access.

**Why built** — No collaboration platform is usable without identity, authorization, and protected routes.

**Files**
- Frontend: `pages/LoginPage.tsx`, `pages/RegisterPage.tsx`, `pages/ForgotPasswordPage.tsx`, `pages/ResetPasswordPage.tsx`, `features/auth/authSlice.ts`, `services/authService.ts`, `components/ProtectedRoute.tsx`
- Backend: `controllers/auth.ts`, `routes/auth.ts`, `middleware/auth.ts`, `utils/tokens.ts`, `models/User.ts`, `models/RefreshToken.ts`

**How it works** — Register/login returns an access JWT + refresh token. Access token is attached as `Authorization: Bearer` and verified by `authenticate` middleware. Refresh tokens are random and **hashed at rest**. `/api/auth/demo` provides a demo session.

**API** — `POST /api/auth/register`, `login`, `demo`, `logout`, `forgot-password`, `reset-password`

---

## 2. Landing Page & Intro Experience

**Purpose** — A premium first impression with animated canvas intro scenes and marketing landing.

**Why built** — Distinguishes the product; showcases the design polish (post-review enhancement).

**Files** — `pages/LandingPage.tsx`, `components/intro/` (`IntroScreen`, `BrainScene`, `DeskScene`, `MindLinkScene`, `NotebookScene`, `canvas.tsx`, `geometry.ts`, `timeline.ts`, `audio.ts`)

---

## 3. Dashboard

**Purpose** — Central overview: stats, recent workspaces, quick actions, activity feed.

**Why built** — The home surface after login; aggregates data across all modules.

**Files** — `pages/dashboard/DashboardHome.tsx`, `components/layout/DashboardLayout.tsx`, `Sidebar.tsx`, `TopNav.tsx`, `components/workspace/WorkspaceCard.tsx`

**API** — `GET /api/workspaces`, `GET /api/rooms`, `GET /api/activities`, `GET /api/notifications`, `GET /api/meetings` (stats endpoints)

---

## 4. Workspace Management

**Purpose** — Top-level organizational unit: CRUD, members, invites, favorites, archive, trash/restore, join-by-code.

**Why built** — Teams need a container that groups rooms, members, tasks, and files.

**Files**
- Frontend: `pages/dashboard/WorkspacesPage.tsx`, `WorkspaceDetailPage.tsx`, `TrashPage.tsx`, `features/workspace/workspaceSlice.ts`, `services/workspaceService.ts`, `components/workspace/WorkspaceOnboarding.tsx`
- Backend: `controllers/workspace.ts`, `services/workspaceService.ts`, `repositories/workspace.repository.ts`, `models/Workspace.ts`

**How it works** — REST CRUD + soft delete (`isDeleted`) with trash/restore. Invite codes auto-generated. Members added by email invite or user id. Favorite (`isFavorite`) and archive (`isArchived`) toggles. Search + pagination server-side.

**API** — `/api/workspaces` (12+ endpoints incl. `/trash`, `/search`, `/:id/members`, `/:id/invites`, `/:id/favorite`, `/:id/archive`, `/:id/regenerate-invite-code`, `/join-invite`)

---

## 5. Room Management

**Purpose** — Collaboration containers typed as whiteboard / code / document.

**Why built** — Each room type mounts the correct tooling (canvas, editor, document).

**Files**
- Frontend: `pages/dashboard/RoomsPage.tsx`, `RoomDetailPage.tsx`, `components/common/CreateRoomModal.tsx`, `components/collaboration/RoomLayout.tsx`, `features/room/roomSlice.ts`, `services/roomService.ts`
- Backend: `controllers/room.ts`, `models/Room.ts`, `models/RoomPresence.ts`

**How it works** — Rooms belong to a workspace; each has a type. `RoomLayout` presents 8 tabs (Whiteboard, Code, Files, Chat, Members, Activity, Tasks, Settings). Presence tracked via `RoomPresence` (socket → user).

**API** — `/api/rooms` (CRUD, join/leave, stats)

---

## 6. Real-time Whiteboard

**Purpose** — Multi-user collaborative drawing with live cursors (Excalidraw-style).

**Why built** — The signature visual collaboration feature and one of the first built (Day 3).

**Files**
- Frontend: `pages/WhiteboardPage.tsx`, `components/whiteboard/WhiteboardCanvas.tsx`, `components/whiteboard/Toolbar.tsx`, `hooks/useSocket.ts`, `services/whiteboardService.ts`
- Backend: `controllers/whiteboard.ts`, `socket/whiteboardHandler.ts`, `models/Whiteboard.ts`

**How it works** — React-Konva canvas. Tools: pen, line, rect, circle, arrow, text. Color/stroke/fill/opacity. Undo/redo, pan/zoom. Every draw/transform/delete is broadcast over Socket.IO to the room. Cursor positions streamed live. Canvas auto-saved to MongoDB.

**Socket events** — `join-room`, `draw`, `update-object`, `delete-object`, `cursor-move`, `undo`, `redo`, `clear-canvas`, `save-whiteboard`

**API** — `GET /api/whiteboard/:roomId`, `POST /api/whiteboard/:roomId/save`

---

## 7. Collaborative Code Editor

**Purpose** — Real-time Monaco editor with multi-file support, live cursors, terminal + output panels.

**Why built** — Brings VS Code Live Share-style collaboration into SyncSpace (Day 6).

**Files**
- Frontend: `components/editor/CodeIDE.tsx`, `MonacoEditor.tsx`, `CodeFileExplorer.tsx`, `LiveCursors.tsx`, `CodeSettings.tsx`, `TerminalPanel.tsx`, `OutputPanel.tsx`, `hooks/useEditorSocket.ts`, `features/editor/editorSlice.ts`
- Backend: `socket/editorHandler.ts`, `controllers/codeDocument.ts`, `models/CodeDocument.ts`

**How it works** — Documents stored per room. Editor events sync code deltas, cursors, and selections in real time. Multi-file tree with nested folders, rename/delete cascade, context menu, tabs. Auto-save (2s debounce) + Ctrl+S.

**Socket events** — `editor:join`, `editor:leave`, `code:change`, `cursor:update`, `selection:update`, `editor:save-document`, `editor:sync-document`

**API** — `/api/documents` (CRUD, room-scoped)

---

## 8. Real-time Chat

**Purpose** — Persistent per-room chat with typing indicators and seen tracking.

**Why built** — Core team communication alongside collaboration (Day 5).

**Files**
- Frontend: `components/chat/ChatPanel.tsx`, `ChatInput.tsx`, `ChatMessageItem.tsx`, `features/chat/chatSlice.ts`, `services/chatService.ts`
- Backend: `controllers/chat.ts`, `models/ChatMessage.ts`

**How it works** — Messages persisted via REST and broadcast over Socket.IO. Typing indicators and seen-by tracking in real time. Sender populated for display.

**Socket events** — `chat:message`, `chat:typing`, `chat:seen`
**API** — `/api/chat` (list, send, edit, delete)

---

## 9. Presence & Collaboration Sidebar

**Purpose** — See who is online, their activity status, and live cursors.

**Why built** — Presence is what makes a tool feel "real-time" and collaborative.

**Files** — `components/collaboration/PresenceSidebar.tsx`, `WorkspaceMembers.tsx`, `features/presence/presenceSlice.ts`, `models/RoomPresence.ts`

---

## 10. Kanban Task Board

**Purpose** — Drag-and-drop task management across 4 columns.

**Why built** — Lightweight project tracking within the workspace (Day 5).

**Files** — `components/tasks/KanbanBoard.tsx`, `features/task/taskSlice.ts`, `services/taskService.ts`, `controllers/task.ts`, `models/Task.ts`, `models/TaskComment.ts`

**How it works** — Tasks scoped to a workspace; columns driven by `status`. Drag-and-drop updates status. Priority, labels, due dates, checklists, comments.

**API** — `/api/tasks` (CRUD, comments)

---

## 11. File Management

**Purpose** — Upload, browse, rename, download, delete files per workspace.

**Why built** — Shared file artifacts are essential in team workspaces (Day 5/7).

**Files** — `components/files/FileExplorer.tsx`, `pages/dashboard/FileManagerPage.tsx`, `features/files/fileSlice.ts`, `services/fileService.ts`, `controllers/file.ts`, `middleware/upload.ts`, `models/UploadedFile.ts`

**How it works** — Multer uploads (50MB limit), metadata in MongoDB, folder navigation + search, download via blob.

**API** — `/api/files` (upload, list, rename, delete, download)

---

## 12. Meetings

**Purpose** — Schedule and manage meetings per workspace.

**Why built** — Integrated scheduling keeps meeting context inside the workspace.

**Files** — `components/meeting/MeetingRoom.tsx`, `pages/dashboard/MeetingsPage.tsx`, `features/meeting/meetingSlice.ts`, `controllers/meeting.ts`, `models/Meeting.ts`

**How it works** — CRUD with start time, duration, agenda, participants, status (scheduled/ongoing/completed).

**API** — `/api/meetings` (CRUD, stats)

---

## 13. Notifications & Activity

**Purpose** — Real-time notifications plus a filterable audit-log activity feed.

**Why built** — Keeps users informed and provides an audit trail of actions.

**Files**
- Frontend: `pages/dashboard/NotificationsPage.tsx`, `ActivityPage.tsx`, `components/collaboration/ActivityFeed.tsx`, `ActivityTimeline.tsx`, `features/notification/notificationSlice.ts`, `features/activity/activitySlice.ts`
- Backend: `controllers/notification.ts`, `controllers/activity.ts`, `models/Notification.ts`, `models/Activity.ts`

**API** — `/api/notifications` (list, mark read, clear all), `/api/activities` (list, create, delete)

---

## 14. Global Search (Cmd+K)

**Purpose** — Cross-module search across workspaces, rooms, members, tasks.

**Why built** — Fast navigation is a hallmark of a polished productivity tool.

**Files** — `components/CommandPalette.tsx`, `components/collaboration/GlobalSearch.tsx`

**API** — `GET /api/workspaces/search`, `GET /api/rooms/search`

---

## 15. Settings & Profile

**Purpose** — Account, appearance, notification preferences, privacy, password, danger zone.

**Files** — `pages/dashboard/SettingsPage.tsx`, `ProfilePage.tsx`, `context/ThemeContext.tsx`

---

## 16. Demo Mode (Zero-Setup Review)

**Purpose** — Full app functionality offline with realistic seeded data.

**Why built** — Lets reviewers explore everything without MongoDB/Docker setup.

**Files** — `services/demo.ts`, `data/demoData.ts`, `data/demoWorkspaces.ts`, `server/scripts/seed.ts`

**How it works** — `demo()` wrapper tries the real API and falls back to seeded payloads on any failure; `noop()` swallows mutations offline. Demo login via `POST /api/auth/demo` or `demoAuth()`.

---

## 17. Architecture & Code Quality

**Purpose** — Maintainable, testable, type-safe codebase.

**Highlights**
- Layered backend: Controller → Service → Repository → Model
- 87 REST endpoints, 16 Mongoose models, 2 Socket.IO handler groups
- 14 Redux slices, 56 components, 20 pages
- TypeScript strict on both workspaces
- Prettier enforced, lint clean
- Docker + docker-compose for deployment

**Verification commands**
```bash
npm run typecheck   # client + server
npm run lint        # prettier check
npm run build       # production builds
```

---

_See also: [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) for system design and [PROJECT_PROGRESS.md](./PROJECT_PROGRESS.md) for the build history._
