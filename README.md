# SyncSpace

A real-time collaborative platform built with the MERN stack. Think Excalidraw meets VS Code Live Share — an enterprise-grade workspace where teams can collaborate on whiteboards, code, and documents simultaneously.

## Tech Stack

| Layer    | Technology                                                                               |
| -------- | ---------------------------------------------------------------------------------------- |
| Frontend | React 18, TypeScript, Vite 8, Tailwind CSS 3, Redux Toolkit, React Konva, React Router 6 |
| Backend  | Node.js, Express 5, TypeScript, Socket.io 4                                              |
| Database | MongoDB (Mongoose 9)                                                                     |
| Auth     | JWT (access + refresh tokens), bcryptjs, httpOnly cookies                                |
| Tooling  | npm workspaces, Prettier, Husky, lint-staged, concurrently                               |
| DevOps   | Docker, Docker Compose, MongoDB 7, Redis 7                                               |

## Project Structure

```
SyncSpace/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── common/      # Shared components (Modals, Skeleton, Toast, etc.)
│   │   │   ├── layout/      # Layout components (Sidebar, TopNav, DashboardLayout)
│   │   │   └── whiteboard/  # Whiteboard canvas components
│   │   ├── features/        # Redux slices (auth, workspace, room, notification)
│   │   ├── hooks/           # Custom hooks (useSocket)
│   │   ├── pages/           # Route-level page components
│   │   │   └── dashboard/   # Dashboard pages (Home, Workspaces, Rooms, Settings)
│   │   ├── services/        # API client and service layer
│   │   ├── store.ts         # Redux store configuration
│   │   └── types/           # Shared TypeScript types
│   ├── index.html
│   ├── vite.config.ts
│   └── tailwind.config.js
├── server/                  # Express backend
│   ├── src/
│   │   ├── configs/         # Database and service configuration
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, error handling
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic layer
│   │   ├── socket/          # Socket.io event handlers
│   │   ├── types/           # Shared TypeScript types
│   │   └── utils/           # Helpers (tokens, logger, async handler)
│   └── tsconfig.json
├── docker/                  # Dockerfiles for client and server
├── docs/                    # Documentation
├── scripts/                 # Build and utility scripts
├── docker-compose.yml       # Multi-service dev environment
└── package.json             # Root workspace config
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

Create environment files:

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

Start MongoDB first (via Docker or local install), then:

```bash
npm run dev
```

This starts both client (http://localhost:5173) and server (http://localhost:5000) concurrently.

## Available Scripts

| Command          | Description                                 |
| ---------------- | ------------------------------------------- |
| `npm run dev`    | Start client and server in development mode |
| `npm run build`  | Build both client and server for production |
| `npm run lint`   | Run Prettier checks across all workspaces   |
| `npm run format` | Auto-format code with Prettier              |

## API Endpoints

| Method | Endpoint                    | Description                      |
| ------ | --------------------------- | -------------------------------- |
| GET    | `/api/health`               | Health check                     |
| POST   | `/api/auth/register`        | Register new user                |
| POST   | `/api/auth/login`           | Login                            |
| POST   | `/api/auth/logout`          | Logout (clears refresh token)    |
| POST   | `/api/auth/refresh-token`   | Refresh access token             |
| POST   | `/api/auth/forgot-password` | Request password reset           |
| POST   | `/api/auth/reset-password`  | Reset password with token        |
| GET    | `/api/auth/me`              | Get current user (requires auth) |
| GET    | `/api/workspaces`           | List workspaces                  |
| POST   | `/api/workspaces`           | Create workspace                 |
| GET    | `/api/workspaces/:id`       | Get workspace by ID              |
| PUT    | `/api/workspaces/:id`       | Update workspace                 |
| DELETE | `/api/workspaces/:id`       | Soft-delete workspace            |
| GET    | `/api/rooms`                | List rooms                       |
| POST   | `/api/rooms`                | Create room                      |
| GET    | `/api/rooms/:id`            | Get room by ID                   |
| PUT    | `/api/rooms/:id`            | Update room                      |
| DELETE | `/api/rooms/:id`            | Soft-delete room                 |
| POST   | `/api/rooms/join/:code`     | Join room by invite code         |
| GET    | `/api/rooms/stats`          | Room statistics                  |
| GET    | `/api/whiteboard/:roomId`   | Get whiteboard data              |
| PUT    | `/api/whiteboard/:roomId`   | Save whiteboard data             |
| GET    | `/api/activities`           | Activity feed                    |

## Day 3 Progress

### Collaborative Whiteboard

- Full HTML5 Canvas drawing surface using React Konva
- Drawing tools: pen, line, rectangle, circle, arrow, text
- Color picker, stroke width, fill, opacity controls
- Undo/redo support with action history stack
- Pan, zoom, and canvas reset controls
- Object selection and deletion
- Real-time cursor overlay showing other users' positions
- Auto-save whiteboard state to MongoDB
- Socket.io broadcasting for real-time collaboration

### Improved Dashboard UI

- Redesigned DashboardHome with gradient welcome banner
- Workspace cards with color themes and member counts
- Recent rooms list with type badges and live status
- Quick action grid for fast workspace and room creation
- Workspace statistics sidebar panel
- Activity feed showing recent actions across all workspaces
- Floating action button (FAB) for quick creation from any dashboard view

### Workspace Management

- Dedicated WorkspacesPage with grid/list view toggle
- Workspace creation modal with name, description, color, and visibility options
- Workspace editing modal with inline name and description fields
- Workspace detail page with tabs for rooms, members, and settings
- Room creation within workspace context
- Room deletion with confirmation dialog
- Workspace deletion with danger zone and confirmation
- Search and filter workspaces by name

### Room Management

- Dedicated RoomsPage with search functionality
- Room type indicators (whiteboard, code, document) with color badges
- Room detail page with overview, whiteboard, code, and participants tabs
- Room statistics endpoint for dashboard metrics

### Real-time Collaboration Infrastructure

- Socket.io client hook (`useSocket`) with automatic connection management
- Room joining/leaving with user presence tracking
- Whiteboard event broadcasting (draw, update, delete, cursor move)
- Auto-reconnection on connection loss
- Connection status indicator in whiteboard status bar

### Authentication Improvements

- Demo login mode that works without database connection
- `isDemo` flag in auth state to prevent unnecessary API refresh attempts
- Proper Redux dispatch for demo login instead of raw localStorage manipulation
- Axios interceptor improvement: skips token refresh for demo tokens

### Bug Fixes

- Fixed auto-logout bug where demo login caused immediate redirect to login page
- Fixed axios interceptor attempting refresh with invalid demo tokens
- Removed dead ConfirmDialog with hardcoded `isOpen={false}` in WorkspaceDetailPage
- Fixed redundant FAB action branching in DashboardHome
- Removed duplicate `typeColors` objects from render loops
- Removed duplicate room count computation in WorkspacesPage
- Removed redundant errorHandler middleware from whiteboard routes
- Cleaned up unused server-side TypeScript interfaces
- Extracted duplicated localStorage token reading into helper functions in api.ts

### Responsive UI

- Collapsible sidebar with mobile hamburger menu
- Responsive grid layouts for workspace and room cards
- Mobile-friendly navigation with slide-out sidebar overlay
- Adaptive typography and spacing across breakpoints

## Roadmap

- [x] Project setup and authentication (Day 1)
- [x] Dashboard UI and workspace management (Day 2)
- [x] Collaborative whiteboard with real-time sync (Day 3)
- [ ] Real-time code editor (Monaco)
- [ ] Document collaboration
- [ ] User avatars and profiles
- [ ] Email verification
- [ ] Rate limiting and brute-force protection
- [ ] CI/CD pipeline
- [ ] End-to-end testing

## Progress

| Day   | Work Completed                                                                   | Status |
| ----- | -------------------------------------------------------------------------------- | ------ |
| Day 1 | Project setup, Authentication, Dashboard Foundation, Docker configuration        | ✅     |
| Day 2 | Dashboard UI, Workspace Layout, Room Management, Backend CRUD APIs               | ✅     |
| Day 3 | Collaborative Whiteboard, Dashboard Improvements, Auth Bug Fixes, Real-time Sync | ✅     |

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
