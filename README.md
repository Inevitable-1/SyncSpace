<div align="center">

# SyncSpace

**One workspace for every team — real-time whiteboards, code, chat and project boards.**

Real-time collaboration · Full-stack TypeScript · Enterprise-grade architecture

[Features](#features) ·
[Tech Stack](#tech-stack) ·
[Installation](#installation) ·
[API Reference](docs/API_REFERENCE.md)

</div>

---

## Project Overview

SyncSpace is a real-time collaborative workspace for teams. Think **Excalidraw meets VS Code Live Share** — a single platform where teams brainstorm on an infinite whiteboard, write code side by side, chat, and track work on kanban boards, all simultaneously.

> **Mission:** Making collaboration simple, organized and accessible.
> **Vision:** One workspace for every team.

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
- **Meetings** — schedule, join and host meetings with real-time status
- **File Manager** — upload / download, folders, rename, trash, image previews
- **Insights** — workspace activity and room distribution
- **JWT Authentication** — multi-step registration with email verification, password hashing (bcrypt), refresh token rotation

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · Redux Toolkit · Framer Motion |
| Real-time | Socket.IO · React Konva · Monaco Editor |
| Backend | Node.js · Express 5 · TypeScript · Mongoose |
| Database | MongoDB 7 |
| Auth | JWT (access + rotating refresh) · bcrypt · httpOnly cookies |
| Tooling | npm workspaces · Prettier · Docker Compose |

## Screenshots

> Screenshots coming soon — the app runs at `http://localhost:5173` after setup.

| Landing & Hero | Whiteboard | Code Editor |
| --- | --- | --- |
| Animated logo, brand identity | Infinite canvas + cursors | Monaco with live cursors |

| Kanban Board | Team Chat | Dashboard |
| --- | --- | --- |
| Drag-and-drop tasks | Threads + typing indicators | Analytics & activity feed |

## Installation

### Prerequisites

- Node.js 20+
- npm 9+
- Docker & Docker Compose (for MongoDB)

### Quick Start

```bash
# 1. Clone
git clone https://github.com/Inevitable-1/SyncSpace.git
cd SyncSpace

# 2. Install dependencies
npm install

# 3. Start MongoDB
docker start syncspace-mongo
# or: docker compose up -d mongo

# 4. Seed demo account and test data
npx tsx server/src/scripts/seed.ts

# 5. Build and start
npm run build -w server
npm run dev
```

### Demo Account

After seeding, use these credentials:

- **Email:** `demo@syncspace.dev`
- **Password:** `demo123`

Or click **"Try Demo"** on the login page for instant access.

### Environment

**server/.env** (pre-configured for local development)

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/syncspace
CLIENT_URL=http://localhost:5173
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

**client/.env** (pre-configured)

```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### Run

**Option A — Docker (MongoDB only) + local dev**

```bash
docker compose up -d mongo
npm run dev
```

**Option B — Everything via Docker**

```bash
docker compose up -d
```

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
│       ├── features/              # 12 Redux slices (auth, room, task, ...)
│       ├── hooks/                 # useSocket, useCollaborationSocket, useEditorSocket
│       ├── pages/                 # Landing, About, Features, auth + dashboard pages
│       ├── services/              # API services (auth, workspace, room, meeting, ...)
│       └── types/                 # Shared TypeScript interfaces
├── server/                        # Express backend
│   └── src/
│       ├── models/                # 16 Mongoose models
│       ├── controllers/           # 15 controllers
│       ├── routes/                # 15 route files
│       ├── services/              # Business logic
│       ├── repositories/          # Data access layer
│       ├── dto/                   # Data transfer objects
│       ├── socket/                # Socket.IO handlers (whiteboard, editor)
│       ├── middleware/            # auth, errorHandler, upload
│       ├── scripts/               # Database seeder
│       └── utils/                 # tokens, logger, asyncHandler
├── docker/                        # Dockerfiles
├── docker-compose.yml             # MongoDB + server + client
├── docs/                          # Architecture, API reference, feature guide
├── start.sh                       # One-command startup script
└── package.json                   # npm workspaces root
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (name + email) |
| POST | `/api/auth/login` | Login with email + password |
| POST | `/api/auth/demo` | Instant demo login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/profile` | Get profile |
| PUT | `/api/profile` | Update profile |
| POST | `/api/workspaces` | Create workspace |
| GET | `/api/workspaces` | List workspaces |
| GET | `/api/workspaces/:id` | Get workspace detail |
| DELETE | `/api/workspaces/:id` | Delete workspace |
| POST | `/api/rooms` | Create room |
| GET | `/api/workspaces/:id/rooms` | List workspace rooms |
| POST | `/api/meetings` | Schedule meeting |
| GET | `/api/meetings` | List meetings |
| GET | `/api/dashboard` | Dashboard stats |
| GET | `/api/activities` | Activity feed |
| GET | `/api/notifications` | Notifications |

Full API reference: [docs/API_REFERENCE.md](docs/API_REFERENCE.md)

## Documentation

- [Architecture](docs/Architecture.md) — system design
- [Feature Map](docs/FeatureMap.md) — every feature and its status
- [Data Models](docs/DataModels.md) — all 16 MongoDB models
- [Routes](docs/Routes.md) — frontend, backend and socket routes
- [Components](docs/Components.md) — component inventory
- [API Reference](docs/API_REFERENCE.md) — full endpoint list
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) — production notes
- [Feature Guide](docs/FEATURE_GUIDE.md) — feature walkthrough
- [Future Roadmap](docs/FutureRoadmap.md) — what's next

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**SyncSpace** — *One Workspace. Infinite Collaboration.*

</div>
