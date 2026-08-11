# SyncSpace

A real-time collaborative platform for teams. Think Excalidraw meets VS Code Live Share — an enterprise-grade workspace where teams collaborate on whiteboards, code editors, chat, and task boards simultaneously.

## Features

### Core Collaboration

- **Real-time Whiteboard** — Drawing tools, shapes, text, undo/redo, multi-user cursors via React Konva
- **Collaborative Code Editor** — Monaco Editor with live cursors, multi-file tabs, file explorer, themes
- **Real-time Chat** — Messages, replies, emoji, typing indicators, seen status
- **Kanban Task Board** — 4-column drag-and-drop with priorities, labels, due dates, checklists

### Workspace Management

- **Workspaces** — Create, edit, delete, archive, favorite, search, invite codes
- **Rooms** — Whiteboard, code, and document room types per workspace
- **Member Management** — Roles (owner/admin/member), suspend, promote, demote
- **Invite System** — Email-based invitations with token expiry

### Dashboard

- **Analytics** — Stat cards, bar charts, donut charts, weekly activity
- **Activity Timeline** — Filterable audit log of all actions
- **Notifications** — Real-time notification center with read/unread tracking
- **Global Search** — Cmd+K search across workspaces, rooms, members, tasks
- **Meetings** — Schedule, join, and host meetings with a dedicated meeting room
- **File Manager** — Upload/download, folders, rename, trash, and image previews
- **Trash & Shared With Me** — Restore deleted items; see what others shared with you
- **Insights** — Workspace activity and room distribution overview

### UI/UX

- **Dark & Light Mode** — Full theme support with CSS variables
- **Responsive Design** — Collapsible sidebar, mobile-friendly layouts
- **Animations** — Framer Motion transitions and micro-interactions
- **Loading States** — Skeleton loaders for all data views
- **Professional UI** — 16+ reusable components (Button, Card, Badge, Avatar, Modal, etc.)

## Tech Stack

| Layer     | Technology                                                                   |
| --------- | ---------------------------------------------------------------------------- |
| Frontend  | React 18, TypeScript 7, Vite 8, Tailwind CSS 3, Redux Toolkit, Framer Motion |
| Real-time | Socket.IO 4, React Konva, Monaco Editor                                      |
| Backend   | Node.js, Express 5, TypeScript 7, Mongoose 9                                 |
| Database  | MongoDB 7 (Docker)                                                           |
| Auth      | JWT (access + refresh tokens), bcryptjs, httpOnly cookies                    |
| Tooling   | npm workspaces, Prettier, Husky, lint-staged                                 |
| DevOps    | Docker Compose, Redis 7                                                      |

## Architecture

```
SyncSpace/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Reusable UI (EmptyState, Skeleton, Modal, Toast…)
│   │   │   ├── layout/              # Sidebar, TopNav, DashboardLayout
│   │   │   ├── whiteboard/          # Canvas, Toolbar, PropertiesPanel, Cursors
│   │   │   ├── editor/              # CodeIDE, MonacoEditor, FileExplorer, Terminal
│   │   │   ├── collaboration/       # RoomLayout, Chat, Presence, Members
│   │   │   ├── meeting/             # MeetingRoom
│   │   │   ├── tasks/               # KanbanBoard
│   │   │   ├── files/               # FileExplorer
│   │   │   └── intro/               # Animated landing scenes
│   │   ├── features/                # 12 Redux slices (auth, room, task, …)
│   │   ├── hooks/                   # useSocket, useCollaborationSocket, useEditorSocket
│   │   ├── pages/                   # Dashboard pages + auth pages
│   │   ├── services/                # 15 API service files
│   │   └── types/                   # Shared TypeScript interfaces
│   └── vite.config.ts
├── server/                          # Express backend
│   ├── src/
│   │   ├── models/                  # 17 Mongoose models
│   │   ├── controllers/             # 13 controllers
│   │   ├── routes/                  # 13 route files
│   │   ├── services/                # Business logic services
│   │   ├── repositories/            # Repository pattern files
│   │   ├── dto/                     # DTO files
│   │   ├── socket/                  # Socket.IO handlers (whiteboard + editor)
│   │   ├── middleware/              # auth, errorHandler
│   │   └── utils/                   # tokens, logger, asyncHandler
│   └── tsconfig.json
├── docker/                          # Dockerfiles
├── docker-compose.yml               # MongoDB + Redis + Server + Client
└── docs/                            # Development reports, API reference, changelog
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Docker & Docker Compose (optional)

### Installation

```bash
git clone https://github.com/Inevitable-1/SyncSpace.git
cd SyncSpace
npm install
```

### Environment Setup

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
```

### Run with Docker

```bash
docker compose up -d
```

### Run Locally

```bash
npm run dev
```

Starts both client (http://localhost:5173) and server (http://localhost:5000).

### Build for Production

```bash
npm run build
```

## Available Scripts

| Command          | Description                                 |
| ---------------- | ------------------------------------------- |
| `npm run dev`    | Start client and server in development mode |
| `npm run build`  | Build both client and server for production |
| `npm run lint`   | Run Prettier checks across all workspaces   |
| `npm run format` | Auto-format code with Prettier              |

## API Endpoints

### Authentication (7)

| Method | Endpoint                    | Description            |
| ------ | --------------------------- | ---------------------- |
| POST   | `/api/auth/register`        | Register new user      |
| POST   | `/api/auth/login`           | Login                  |
| POST   | `/api/auth/logout`          | Logout                 |
| POST   | `/api/auth/refresh-token`   | Refresh access token   |
| POST   | `/api/auth/forgot-password` | Request password reset |
| POST   | `/api/auth/reset-password`  | Reset password         |
| GET    | `/api/auth/me`              | Get current user       |

### Workspaces (16)

| Method | Endpoint                           | Description            |
| ------ | ---------------------------------- | ---------------------- |
| POST   | `/api/workspaces`                  | Create workspace       |
| GET    | `/api/workspaces`                  | List workspaces        |
| GET    | `/api/workspaces/search`           | Search workspaces      |
| GET    | `/api/workspaces/trash`            | Get trashed items      |
| GET    | `/api/workspaces/:id`              | Get workspace          |
| PUT    | `/api/workspaces/:id`              | Update workspace       |
| DELETE | `/api/workspaces/:id`              | Delete workspace       |
| POST   | `/api/workspaces/:id/restore`      | Restore workspace      |
| POST   | `/api/workspaces/:id/invite-code`  | Regenerate invite code |
| POST   | `/api/workspaces/join`             | Join by invite code    |
| POST   | `/api/workspaces/:id/favorite`     | Toggle favorite        |
| POST   | `/api/workspaces/:id/archive`      | Archive workspace      |
| POST   | `/api/workspaces/:id/unarchive`    | Unarchive workspace    |
| GET    | `/api/workspaces/:id/members`      | List members           |
| POST   | `/api/workspaces/:id/members`      | Add member             |
| DELETE | `/api/workspaces/:id/members/:mid` | Remove member          |

### Rooms (8)

| Method | Endpoint                 | Description     |
| ------ | ------------------------ | --------------- |
| POST   | `/api/rooms`             | Create room     |
| GET    | `/api/rooms`             | List rooms      |
| GET    | `/api/rooms/stats`       | Room statistics |
| GET    | `/api/rooms/:id`         | Get room        |
| PUT    | `/api/rooms/:id`         | Update room     |
| DELETE | `/api/rooms/:id`         | Delete room     |
| POST   | `/api/rooms/:id/restore` | Restore room    |
| POST   | `/api/rooms/join`        | Join room       |

### Members (7)

| Method | Endpoint                                      | Description       |
| ------ | --------------------------------------------- | ----------------- |
| GET    | `/api/workspaces/:id/members`                 | List members      |
| GET    | `/api/workspaces/:id/members/stats`           | Member stats      |
| POST   | `/api/workspaces/:id/members`                 | Add member        |
| PUT    | `/api/workspaces/:id/members/:mid/role`       | Update role       |
| PUT    | `/api/workspaces/:id/members/:mid/suspend`    | Suspend member    |
| PUT    | `/api/workspaces/:id/members/:mid/reactivate` | Reactivate member |
| DELETE | `/api/workspaces/:id/members/:mid`            | Remove member     |

### Invites (7)

| Method | Endpoint                            | Description         |
| ------ | ----------------------------------- | ------------------- |
| GET    | `/api/workspaces/:id/invites`       | List invites        |
| GET    | `/api/workspaces/:id/invites/stats` | Invite stats        |
| POST   | `/api/workspaces/:id/invites`       | Create invite       |
| DELETE | `/api/workspaces/:id/invites/:iid`  | Revoke invite       |
| GET    | `/api/invites/pending`              | Get pending invites |
| POST   | `/api/invites/:token/accept`        | Accept invite       |
| POST   | `/api/invites/:token/decline`       | Decline invite      |

### Chat (5)

| Method | Endpoint                 | Description    |
| ------ | ------------------------ | -------------- |
| GET    | `/api/chat/:roomId`      | Get messages   |
| POST   | `/api/chat/:roomId`      | Send message   |
| PUT    | `/api/chat/:messageId`   | Edit message   |
| DELETE | `/api/chat/:messageId`   | Delete message |
| POST   | `/api/chat/:roomId/seen` | Mark seen      |

### Tasks (7)

| Method | Endpoint                            | Description        |
| ------ | ----------------------------------- | ------------------ |
| GET    | `/api/tasks`                        | List tasks         |
| GET    | `/api/tasks/workspace/:workspaceId` | Tasks by workspace |
| POST   | `/api/tasks`                        | Create task        |
| PUT    | `/api/tasks/:id`                    | Update task        |
| DELETE | `/api/tasks/:id`                    | Delete task        |
| POST   | `/api/tasks/:id/comments`           | Add comment        |
| GET    | `/api/tasks/:id/comments`           | Get comments       |

### Files (5)

| Method | Endpoint                | Description  |
| ------ | ----------------------- | ------------ |
| GET    | `/api/files`            | List files   |
| GET    | `/api/files/folders`    | List folders |
| POST   | `/api/files`            | Upload file  |
| DELETE | `/api/files/:id`        | Delete file  |
| PUT    | `/api/files/:id/rename` | Rename file  |

### Documents (6)

| Method | Endpoint                      | Description       |
| ------ | ----------------------------- | ----------------- |
| GET    | `/api/documents/room/:roomId` | Documents by room |
| GET    | `/api/documents/:id`          | Get document      |
| POST   | `/api/documents`              | Create document   |
| PUT    | `/api/documents/:id`          | Update document   |
| PUT    | `/api/documents/:id/rename`   | Rename document   |
| DELETE | `/api/documents/:id`          | Delete document   |

### Whiteboard, Activities, Notifications

| Method | Endpoint                      | Description         |
| ------ | ----------------------------- | ------------------- |
| GET    | `/api/whiteboards/:roomId`    | Get whiteboard      |
| PUT    | `/api/whiteboards/:roomId`    | Save whiteboard     |
| GET    | `/api/activities`             | List activities     |
| DELETE | `/api/activities/:id`         | Delete activity     |
| DELETE | `/api/activities/clear`       | Clear all           |
| GET    | `/api/notifications`          | List notifications  |
| PUT    | `/api/notifications/read-all` | Mark all read       |
| PUT    | `/api/notifications/:id/read` | Mark as read        |
| DELETE | `/api/notifications/:id`      | Delete notification |
| DELETE | `/api/notifications/clear`    | Clear all           |

## Socket Events

### Whiteboard

`join-room`, `leave-room`, `draw`, `update-object`, `delete-object`, `cursor-move`, `undo`, `redo`, `clear-canvas`, `save-whiteboard`

### Code Editor

`editor-join`, `editor-leave`, `code-change`, `cursor-update`, `selection-update`, `save-document`, `sync-document`

### Chat & Presence

`send-message`, `edit-message`, `delete-message`, `typing-start`, `typing-stop`, `mark-seen`, `update-activity`

## MongoDB Collections

| Collection      | Description                             |
| --------------- | --------------------------------------- |
| `users`         | User accounts with hashed passwords     |
| `workspaces`    | Workspace configuration and membership  |
| `rooms`         | Collaboration rooms within workspaces   |
| `members`       | Role-based workspace membership         |
| `invites`       | Email-based invitation tracking         |
| `tasks`         | Kanban tasks with priorities and labels |
| `taskcomments`  | Comments on tasks                       |
| `chatmessages`  | In-room chat messages                   |
| `whiteboards`   | Konva.js whiteboard object storage      |
| `codedocuments` | Code files with version tracking        |
| `activities`    | Audit log of all actions                |
| `notifications` | User notifications                      |
| `roompresences` | Real-time presence tracking             |
| `refreshtokens` | JWT refresh token rotation              |
| `uploadedfiles` | File upload metadata                    |

## Latest Improvements

See [docs/CHANGELOG.md](docs/CHANGELOG.md) for the full changelog.

### Day 10 — Dashboard Redesign & Demo Experience

- Redesigned dashboard with a modern productivity workspace theme (new stat cards, activity charts, category insights)
- Added animated intro/landing scenes (brain, desk, notebook, mind-link) with canvas-based ambient effects
- Improved whiteboard engine with smooth 60fps drawing, better color picker, and object transformation handling
- Added demo workspace flow with pre-populated data and guided onboarding (`Try Demo` login)
- Enhanced file manager with upload/download progress and error recovery
- Streamlined meeting scheduling flow and fixed participant mapping
- Added Trash (restore) and Shared With Me pages for workspaces and rooms

### Day 9 — Code Quality & Docs Reorganization

- Reorganized docs into a dedicated `docs/` directory
- Added `PROJECT_ARCHITECTURE.md`, `PROJECT_PROGRESS.md`, and review guides
- Removed dead code, cleaned up formatting, and kept the build warning-free

### Day 8 — Code Cleanup & UI Polish

- Removed dynamic import warning in `InviteModal` by switching to static import
- Eliminated unused `roomId` prop from `InviteModal` interface
- Removed unused Redux subscription (`workspaces`) from `TopNav`
- Deleted dead files: `scripts/` directory, `docs/.gitkeep`
- **UI Polish**:
  - `Card`: Added subtle `hover:scale` lift effect for interactive cards
  - `Button`: Added `active:scale-[0.98]` press feedback across all variants
  - `Tooltip`: Replaced instant show/hide with smooth opacity transition
  - `Spinner`: Removed unnecessary wrapping flex container for better composability
  - `EmptyState`: Improved responsive padding with `sm:` breakpoint
- Build verified clean (no warnings)

## Future Scope

- [ ] Operational Transform / CRDT for conflict-free editing
- [ ] Real terminal execution (Docker-in-Docker)
- [ ] Document collaboration with rich text
- [ ] Email verification flow
- [ ] Rate limiting and brute-force protection
- [ ] CI/CD pipeline with GitHub Actions
- [ ] End-to-end testing with Vitest
- [ ] WebSocket reconnection resilience
- [ ] File upload to cloud storage (S3)
- [ ] Elasticsearch for full-text search

## License

MIT License. See [LICENSE](LICENSE) for details.
