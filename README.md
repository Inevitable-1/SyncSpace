<div align="center">

# SyncSpace

**One workspace for every team — real-time whiteboards, code, chat and project boards.**

Real-time collaboration · Full-stack TypeScript · Enterprise-grade architecture

[Features](#features) ·
[Tech Stack](#tech-stack) ·
[Installation](#installation) ·
[Architecture](ARCHITECTURE.md) ·
[Contributing](CONTRIBUTING.md)

</div>

---

## Project Overview

SyncSpace is a real-time collaborative workspace for teams. Think **Excalidraw meets VS Code Live Share** — a single platform where teams brainstorm on an infinite whiteboard, write code side by side, chat, and track work, all simultaneously.

> **Mission:** Making collaboration simple, organized and accessible.
> **Vision:** One workspace for every team.

## Features

### Core Collaboration

| Module | Highlights |
| ------ | ---------- |
| **Real-time Whiteboard** | 12 advanced shapes, connector tool, templates, layer ops, PNG/JPG/JSON export (React Konva) |
| **Collaborative Code Editor** | Monaco Editor, live cursors, multi-language (Java/Python/C/C++), code execution |
| **Team Chat** | Real-time via Socket.IO, replies, emoji, typing indicators, read receipts |
| **Document Editor** | Auto-save, multiple documents per room, create/rename/delete |

### Workspace Management

- Create, edit, archive, trash/restore, favorite and search workspaces
- Rooms for whiteboard, code and document collaboration
- Roles (owner / admin / member), suspend / promote / demote
- Email-based invitations with expiring tokens

### Platform

- **Dashboard** — analytics, activity timeline, notifications, global search (Ctrl+K)
- **Meetings** — schedule, join and host meetings with real-time status
- **File Manager** — upload / download, folders, rename, trash, image previews
- **Insights** — workspace activity heatmap and room distribution charts
- **JWT Authentication** — multi-step registration with email verification, refresh token rotation

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · Redux Toolkit · Framer Motion |
| Real-time | Socket.IO · React Konva · Monaco Editor |
| Backend | Node.js · Express 5 · TypeScript · Mongoose |
| Database | MongoDB 7 |
| Auth | JWT (access + rotating refresh) · bcrypt · httpOnly cookies |
| Tooling | npm workspaces · Prettier · Docker Compose |

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
docker compose up -d mongo

# 4. Seed demo account and test data
npx tsx server/src/scripts/seed.ts

# 5. Build and start
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
│   └── src/
│       ├── components/            # 40 reusable components
│       ├── features/              # 13 Redux slices
│       ├── hooks/                 # useCollaborationSocket, useCodeSocket
│       ├── pages/                 # 25 page components
│       ├── services/              # 18 API services
│       └── types/                 # Shared TypeScript interfaces
├── server/                        # Express backend
│   └── src/
│       ├── models/                # 16 Mongoose models
│       ├── controllers/           # 17 controllers
│       ├── routes/                # 17 route files
│       ├── socket/                # Socket.IO handlers (whiteboard, editor)
│       ├── middleware/            # auth, errorHandler, rateLimit, upload
│       └── utils/                 # tokens, logger, asyncHandler
├── docs/                          # Architecture, API reference, feature guide
└── docker-compose.yml             # MongoDB + Redis + server + client
```

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](ARCHITECTURE.md) | System design, auth flow, socket architecture, data models |
| [Contributing](CONTRIBUTING.md) | Development setup, coding standards, common patterns |
| [Work Log](WORK_LOG.md) | Daily activity log with commit references |
| [Project Timeline](PROJECT_TIMELINE.md) | Milestone-based timeline with architecture evolution |
| [API Reference](docs/API_REFERENCE.md) | Full endpoint documentation |
| [Feature Guide](docs/FEATURE_GUIDE.md) | Feature walkthrough |

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**SyncSpace** — *One Workspace. Infinite Collaboration.*

</div>
