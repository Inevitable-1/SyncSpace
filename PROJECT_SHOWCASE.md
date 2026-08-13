# SyncSpace — Project Showcase

> **One workspace for every team.** Real-time whiteboards, collaborative coding, team chat, project boards, meetings, and file sharing — all in one elegant, brand-consistent workspace.

Built as a **3-week internship project** (React + TypeScript + Node.js/Express + MongoDB + Socket.IO).

![SyncSpace Logo](client/public/logo.svg)

---

## Overview

SyncSpace is a full-stack collaboration platform that brings the tools a modern team needs into a single, coherent product:

- **Brainstorm** on a real-time whiteboard
- **Code together** in a live shared editor with cursors
- **Chat** with your team in rooms with presence and typing indicators
- **Plan** work on a drag-and-drop Kanban board
- **Schedule & run** meetings
- **Organize** files inside workspaces
- **Stay informed** with realtime notifications and an activity audit trail

Everything is presented behind one consistent brand: a geometric gold "S" mark with a single red center dot, on a clean white-and-dark theme.

---

## Key Features

| Feature | Highlights |
|---|---|
| **Authentication** | Passwordless sign-in (name + email), one-click demo login, JWT + refresh-token rotation, forgot/reset password, route protection |
| **Workspaces** | Create/update/delete, favorites, archive, invite codes, soft-delete + trash restore, members with roles (owner/admin/member), invites |
| **Rooms** | Whiteboard / code / document rooms with invite codes, settings, delete/restore |
| **Whiteboard** | Real-time canvas, 9 tools, properties panel, undo/redo, autosave, live cursors, presence |
| **Live Coding** | Monaco editor, file tree CRUD, live cursors & selections, output + terminal panels, realtime document sync |
| **Team Chat** | Realtime messages, typing indicators, edit/delete, read receipts, emoji/system messages |
| **Project Boards** | Kanban with drag-and-drop, priorities, labels, checklists, due dates, comments |
| **Meetings** | Schedule, start/join/end lifecycle, stats, meeting-room UI (mic/cam/chat/notes) |
| **Files** | Upload/rename/delete/download, folder grouping, per-workspace storage |
| **Notifications** | Realtime delivery, read/unread, clear, unread badges |
| **Activity & Insights** | Live activity feed, per-room timeline, analytics dashboard, animated stats |
| **Dashboard** | Today's work, quick actions, recent workspaces/rooms/files/meetings/notifications |
| **AI Assistant** | Post-login assistant drawer (Ctrl+Shift+A) with context-aware prompts |
| **Marketing** | Landing, Features, About pages + FAQ section + branded 404 |

---

## Architecture

```
SyncSpace (npm workspaces monorepo)
├── client/  React 18 + TypeScript + Vite
│   ├── src/pages        → route-level pages (public + dashboard)
│   ├── src/components   → 48 components (common, collaboration, chat, whiteboard, editor, files, tasks, meeting, logo, layout)
│   ├── src/features     → Redux Toolkit slices (auth, workspace, room, chat, task, editor, meeting, …)
│   ├── src/services     → API layer with demo-mode fallback
│   ├── src/hooks        → useSocket, useCollaborationSocket, useEditorSocket
│   └── src/context      → ThemeContext
└── server/  Express 5 + TypeScript + Socket.IO
    ├── src/controllers  → REST handlers (17 domains)
    ├── src/models       → 16 Mongoose models
    ├── src/routes       → 17 Express routers
    ├── src/middleware   → auth (JWT), errorHandler, upload
    ├── src/socket       → whiteboard + editor realtime handlers
    └── src/repositories → data access helpers
```

### Real-time layer

Socket.IO powers whiteboards, chat, presence, notifications, activity feeds, and the code editor. Clients authenticate via JWT in the socket handshake.

### Data layer

MongoDB (via Mongoose) stores 16 models; Redis (docker-compose) is provisioned for the stack. Uploads are stored on disk with metadata in the `UploadedFile` model.

### Demo mode

A first-class demo data layer (`client/src/data/*`, `client/src/services/demo.ts`) keeps the full UI functional even when the backend is offline — ideal for presentations and local development.

---

## Screenshots

> 📷 Add screenshots here before publishing the showcase.

| Landing page | Dashboard | Whiteboard | Code editor |
|---|---|---|---|
| `client/public/screenshots/landing.png` | `client/public/screenshots/dashboard.png` | `client/public/screenshots/whiteboard.png` | `client/public/screenshots/editor.png` |

| Room hub | Kanban board | Meetings | About page |
|---|---|---|---|
| `client/public/screenshots/room.png` | `client/public/screenshots/kanban.png` | `client/public/screenshots/meetings.png` | `client/public/screenshots/about.png` |

---

## Team Contributions

SyncSpace was developed over three weeks with a modular, feature-driven structure. Every module is connected, documented, and discoverable — nothing sits orphaned in the repo.

| Module | Status | Primary files |
|---|---|---|
| Auth & session system | ✅ | `client/src/features/auth`, `server/src/controllers/auth.ts` |
| Workspace & membership | ✅ | `workspace.ts`, `member.ts`, `invite.ts` (controllers/routes/models) |
| Real-time collaboration hub | ✅ | `RoomDetailPage.tsx`, `RoomLayout.tsx`, socket handlers |
| Whiteboard | ✅ | `components/whiteboard/*`, `useSocket.ts` |
| Live code editor | ✅ | `components/editor/*`, `useEditorSocket.ts`, `editorHandler.ts` |
| Team chat + presence | ✅ | `components/chat/*`, `whiteboardHandler.ts` |
| Task management / Kanban | ✅ | `components/tasks/KanbanBoard.tsx`, `task.ts` |
| Meetings | ✅ | `meeting.ts`, `MeetingRoom.tsx` |
| Files | ✅ | `file.ts`, `FileExplorer.tsx` |
| Notifications & activity | ✅ | `notification.ts`, `activity.ts` |
| Dashboard & insights | ✅ | `DashboardHome.tsx`, `InsightsPage.tsx` |
| Brand & marketing pages | ✅ | `logo/*`, `LandingPage.tsx`, `FeaturesPage.tsx`, `AboutPage.tsx` |

All modules are wired end-to-end (page → component → Redux slice → service → REST/socket → model). See `docs/FeatureMap.md` for the full map and `docs/Components.md` for the component inventory.

---

## Future Scope

- Real WebRTC audio/video for meeting rooms
- Wire demo-backed frontend services to the live REST API
- Email verification + granular workspace roles
- Public workspace discovery and templates
- Offline sync / PWA support

Full roadmap: [`docs/FutureRoadmap.md`](docs/FutureRoadmap.md)

---

## Getting Started

```bash
npm install
docker compose up -d          # MongoDB + Redis
cp client/.env.example client/.env
npm run dev                    # client :5173, server :5000
```

Detailed setup: [`README.md`](README.md) and [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md).

## Project Timeline

| Week | Milestone | Doc |
|---|---|---|
| 1 | Foundation, auth, workspaces, rooms | [`docs/Week1.md`](docs/Week1.md) |
| 2 | Collaboration UI, chat, whiteboard, tasks, files | [`docs/Week2.md`](docs/Week2.md) |
| 3 | Editor, meetings, insights, branding, docs, polish | [`docs/Week3.md`](docs/Week3.md) |
| — | Full journey & decisions | [`docs/ProjectJourney.md`](docs/ProjectJourney.md) |
