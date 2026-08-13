<div align="center">

# ✦ SyncSpace

**One workspace for every team — real-time whiteboards, code, chat and project boards.**

White / Gold / Red brand identity · Real-time collaboration · Enterprise-grade

[Features](https://github.com/Inevitable-1/SyncSpace#features) ·
[Tech Stack](https://github.com/Inevitable-1/SyncSpace#tech-stack) ·
[Installation](https://github.com/Inevitable-1/SyncSpace#installation) ·
[Documentation](https://github.com/Inevitable-1/SyncSpace/blob/main/docs/Architecture.md)

</div>

---

## Project Overview

SyncSpace is a real-time collaborative workspace for teams. Think **Excalidraw meets VS Code Live Share** — a single platform where teams brainstorm on an infinite whiteboard, write code side by side, chat, and track work on kanban boards, all simultaneously.

> **Mission:** Making collaboration simple, organized and accessible.
> **Vision:** One workspace for every team.

Built as a 3-week internship project, SyncSpace went from a blank repository to a complete, runnable SaaS product with a professional brand identity — see [docs/ProjectJourney.md](docs/ProjectJourney.md) for the full story.

## Features

### Core Collaboration

| Module | Highlights |
| ------ | ---------- |
| **Real-time Whiteboard** | Drawing tools, shapes, text, undo/redo, multi-user cursors (React Konva) |
| **Collaborative Code Editor** | Monaco Editor, live cursors, multi-file tabs, file explorer, themes |
| **Team Chat** | Replies, emoji, typing indicators, seen status |
| **Kanban Task Board** | 4-column drag-and-drop, priorities, labels, due dates, checklists |

### Workspace Management

- Create, edit, archive, trash/restore, favorite and search workspaces
- Rooms for whiteboard, code and document collaboration
- Roles (owner / admin / member), suspend / promote / demote
- Email-based invitations with expiring tokens + join-by-invite-code

### Platform

- **Dashboard** — analytics, activity timeline, notifications, global search (Ctrl+K)
- **Meetings** — schedule, join and host meetings
- **File Manager** — upload / download, folders, rename, trash, image previews
- **Insights** — workspace activity and room distribution
- **Passwordless authentication** — sign in with just name + email

### Brand & UX

- White / Gold / Red brand system with an animated logo (gold "S" + red center dot)
- Light & dark themes, responsive layouts, skeleton loaders
- Offline demo mode with realistic fallback data

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · Redux Toolkit · Framer Motion |
| Real-time | Socket.IO · React Konva · Monaco Editor |
| Backend | Node.js · Express 5 · TypeScript · Mongoose |
| Database | MongoDB 7 |
| Auth | JWT (access + rotating refresh) · httpOnly cookies |
| Tooling | npm workspaces · Prettier · Docker Compose |

## Screenshots

> Screenshots to be added — the app is live at `http://localhost:5173` after setup.

| Landing & Hero | Whiteboard | Code Editor |
| --- | --- | --- |
| Animated logo, gold hero, CTAs | Infinite canvas + cursors | Monaco with live cursors |

| Kanban Board | Team Chat | Dashboard |
| --- | --- | --- |
| Drag-and-drop tasks | Threads + typing | Analytics & activity |

## Installation

### Prerequisites

- Node.js 20+
- npm 9+
- Docker & Docker Compose (optional, for MongoDB)

### Setup

```bash
# 1. Clone
git clone https://github.com/Inevitable-1/SyncSpace.git
cd SyncSpace

# 2. Install dependencies
npm install
```

### Environment

**server/.env**

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/syncspace
CLIENT_URL=http://localhost:5173
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

**client/.env**

```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### Run

**Option A — Docker (MongoDB only) + local dev**

```bash
docker compose up -d mongo        # start MongoDB (and Redis if configured)
npm run dev                       # client on :5173, server on :5000
```

**Option B — Everything via Docker**

```bash
docker compose up -d
```

**Option C — Fully local**

Start a local MongoDB instance, then run `npm run dev`.

### Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start client + server in development |
| `npm run build` | Build both workspaces for production |
| `npm run lint` | Prettier checks across all workspaces |
| `npm run typecheck` | TypeScript checks for client + server |
| `npm run format` | Auto-format with Prettier |

## Project Structure

```
SyncSpace/
├── client/                        # React frontend
│   ├── public/                    # logo.svg, favicon.svg
│   └── src/
│       ├── components/            # common, layout, whiteboard, editor, chat,
│       │                          # tasks, collaboration, meeting, files, logo
│       ├── features/              # 12 Redux slices (auth, room, task, …)
│       ├── hooks/                 # useSocket, useCollaborationSocket, useEditorSocket
│       ├── pages/                 # Landing, About, Features, auth + dashboard pages
│       ├── services/              # API services with demo fallback
│       └── types/                 # Shared TypeScript interfaces
├── server/                        # Express backend
│   └── src/
│       ├── models/                # 16 Mongoose models
│       ├── controllers/           # 13 controllers
│       ├── routes/                # 13 route files
│       ├── services/              # Business logic
│       ├── repositories/          # Data access layer
│       ├── dto/                   # Data transfer objects
│       ├── socket/                # Socket.IO handlers
│       ├── middleware/            # auth, errorHandler, upload
│       └── utils/                 # tokens, logger, asyncHandler
├── docker/                        # Dockerfiles
├── docker-compose.yml             # MongoDB + server + client
└── docs/                          # Weekly reports, architecture, API reference
```

## Documentation

- [Project Showcase](PROJECT_SHOWCASE.md) — portfolio overview
- [Final Audit Report](FINAL_AUDIT_REPORT.md) — full-project consistency audit
- [Project Journey](docs/ProjectJourney.md) — idea to implementation
- [Week 1](docs/Week1.md) — foundation & authentication
- [Week 2](docs/Week2.md) — collaboration platform
- [Week 3](docs/Week3.md) — branding, redesign & hardening
- [Architecture](docs/Architecture.md) — system design
- [Feature Map](docs/FeatureMap.md) — every feature & its status
- [Data Models](docs/DataModels.md) — all 16 MongoDB models
- [Routes](docs/Routes.md) — frontend, backend & socket routes
- [Components](docs/Components.md) — component inventory
- [Future Roadmap](docs/FutureRoadmap.md) — what's next
- [API Reference](docs/API_REFERENCE.md) — full endpoint list
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) — production notes

## Future Scope

- **Video Meetings** — WebRTC rooms, screen sharing, recording
- **Workspace Templates** — one-click starter spaces
- **Team Analytics** — engagement and contribution insights
- **Notifications** — email digests + preferences
- **AI Assistant** — workspace-aware assistant (post-login only)
- **File Sharing** — cloud storage, share links, permissions
- **Workspace Permissions** — granular role-based matrices
- Conflict-free editing (OT / CRDT), real terminal execution, mobile apps

## Contributors

- **Manoj Kumar** — Design & full-stack development · [GitHub](https://github.com/Inevitable-1)

## Internship Timeline

| Week | Focus | Highlights |
| ---- | ----- | ---------- |
| **Week 1** | Foundation | Monorepo, auth (JWT + refresh), dashboard shell, MongoDB |
| **Week 2** | Collaboration | Whiteboard, code editor, chat, kanban, workspaces, presence |
| **Week 3** | Branding & hardening | White/Gold/Red identity, logo system, hero redesign, cleanup |

---

<div align="center">

**SyncSpace** — *One Workspace. Infinite Collaboration.*

Built with ♥ over 3 weeks.

</div>
