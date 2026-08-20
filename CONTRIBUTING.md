# Contributing to SyncSpace

Thank you for your interest in contributing to SyncSpace! This guide covers the development workflow, coding standards, and architecture patterns used in this project.

---

## Prerequisites

- **Node.js** 20+
- **npm** 9+ (uses npm workspaces)
- **Docker & Docker Compose** (for MongoDB and Redis)
- **Git**

## Getting Started

```bash
# Clone the repository
git clone https://github.com/Inevitable-1/SyncSpace.git
cd SyncSpace

# Install all dependencies (client + server)
npm install

# Start MongoDB and Redis
docker compose up -d mongo redis

# Seed the demo database
npx tsx server/src/scripts/seed.ts

# Start development servers (client + server concurrently)
npm run dev
```

The client runs at `http://localhost:5173` and the server at `http://localhost:5000`.

## Project Structure

```
SyncSpace/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── chat/          # ChatPanel, ChatInput, ChatMessageItem
│   │   │   ├── common/        # Avatar, Modal, Spinner, Toast, etc.
│   │   │   ├── layout/        # DashboardLayout, Sidebar, TopNav
│   │   │   ├── whiteboard/    # WhiteboardCanvas, Toolbar, ShapeEditorPanel
│   │   │   └── logo/          # AnimatedLogo, LogoMark, LoadingScreen
│   │   ├── features/          # Redux slices (auth, room, chat, etc.)
│   │   ├── hooks/             # useCollaborationSocket, useCodeSocket
│   │   ├── pages/             # Route-level page components
│   │   │   ├── dashboard/     # DashboardHome, WorkspacesPage, etc.
│   │   │   └── rooms/         # RoomRouter, WhiteboardRoom, CodeEditorRoom
│   │   ├── services/          # API client functions (authService, roomService, etc.)
│   │   ├── types/             # Shared TypeScript interfaces
│   │   └── utils/             # Utility functions
│   └── package.json
├── server/                    # Express backend
│   └── src/
│       ├── controllers/       # Request handlers (17 controllers)
│       ├── models/            # Mongoose schemas (16 models)
│       ├── routes/            # Express route definitions (17 routes)
│       ├── socket/            # Socket.IO event handlers
│       ├── middleware/        # auth, errorHandler, rateLimit, upload
│       ├── services/          # Business logic
│       ├── repositories/      # Data access layer
│       ├── dto/               # Data transfer objects
│       ├── utils/             # tokens, logger, asyncHandler
│       └── scripts/           # Database seed script
├── docs/                      # Project documentation
├── docker/                    # Dockerfiles
└── docker-compose.yml         # Infrastructure
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation changes
- `refactor/description` — Code refactoring
- `chore/description` — Maintenance tasks

### 2. Make Your Changes

Follow the coding standards below. Run checks before committing:

```bash
# Type checking
npm run typecheck

# Code formatting
npm run format

# Both checks
npm run typecheck && npm run format
```

### 3. Commit

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]
```

Examples:
```
feat(chat): add message search functionality
fix(whiteboard): correct cursor position mapping
docs(api): update endpoint documentation
refactor(auth): simplify token refresh logic
chore(deps): update dependency versions
```

Scopes: `auth`, `chat`, `whiteboard`, `code-editor`, `rooms`, `workspaces`, `dashboard`, `api`, `socket`, `ui`

### 4. Push and Create a PR

```bash
git push origin feature/your-feature-name
```

Open a pull request against `main`. Include:
- Description of changes
- Screenshots (for UI changes)
- Testing steps

## Coding Standards

### TypeScript

- **Strict mode** enabled in both `tsconfig.json` files
- Avoid `any` types — use proper type annotations
- Use `interface` for object shapes, `type` for unions/intersections
- Export types alongside components

```typescript
// Good
interface ChatPanelProps {
  roomId: string;
  onTypingStart?: () => void;
}

// Avoid
const ChatPanel = (props: any) => { ... }
```

### React Components

- Use **function components** with TypeScript
- One component per file, filename matches component name
- Use `React.memo()` for expensive renders
- Extract reusable logic into custom hooks

```typescript
// Component file structure
import { useState, useCallback } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';

interface MyComponentProps {
  title: string;
}

export default function MyComponent({ title }: MyComponentProps) {
  const dispatch = useAppDispatch();
  // ...
}
```

### CSS / Styling

- Use **Tailwind CSS** utility classes
- Use CSS variables for theme colors: `var(--bg-primary)`, `var(--text-secondary)`, etc.
- Avoid inline styles except for dynamic values
- Follow the dark theme palette:
  - Backgrounds: `#0F172A`, `#111827`, `#1E293B`
  - Primary: `#06B6D4` (cyan)
  - Success: `#22C55E` (green)
  - Error: `#EF4444` (red)

### State Management

- Use **Redux Toolkit** for global state
- Create slices in `client/src/features/<domain>/`
- Use `createAsyncThunk` for API calls
- Keep local state in components when possible

### API Design

- REST endpoints under `/api/`
- Use `express-validator` for input validation
- Return consistent response format:
  ```json
  { "success": true, "data": { ... } }
  { "success": false, "message": "Error description" }
  ```
- Use `asyncHandler` wrapper for async route handlers

### Socket.IO Events

- Use **room-based** event routing: `room:${roomId}`, `chat:${roomId}`, `code:${roomId}`
- Authenticate socket connections with JWT
- Event naming: `entity:action` (e.g., `code:update`, `code:cursor`)
- Always broadcast to specific rooms, not globally

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `ChatPanel.tsx` |
| Pages | PascalCase | `DashboardHome.tsx` |
| Hooks | camelCase, `use` prefix | `useCollaborationSocket.ts` |
| Services | camelCase, `Service` suffix | `authService.ts` |
| Models | PascalCase | `ChatMessage.ts` |
| Routes | camelCase | `chat.ts` |
| Utils | camelCase | `asyncHandler.ts` |
| Styles | camelCase | `index.css` |

## Testing

### Type Checking

```bash
# Check client types
cd client && npx tsc --noEmit

# Check server types
cd server && npx tsc --noEmit

# Check both
npm run typecheck
```

### Manual Testing

1. Start the dev environment: `docker compose up -d mongo && npm run dev`
2. Seed demo data: `npx tsx server/src/scripts/seed.ts`
3. Open `http://localhost:5173`
4. Log in with demo credentials: `demo@syncspace.dev` / `demo123`
5. Test the feature across different room types

## Common Patterns

### Adding a New Feature

1. **Backend:**
   - Create model in `server/src/models/`
   - Create controller in `server/src/controllers/`
   - Create route in `server/src/routes/`
   - Register route in `server/src/app.ts`
   - Add validation with `express-validator`

2. **Frontend:**
   - Create service in `client/src/services/`
   - Create Redux slice in `client/src/features/`
   - Create page component in `client/src/pages/`
   - Add route in `client/src/App.tsx`
   - Add navigation item in `client/src/components/layout/Sidebar.tsx`

### Adding a Socket.IO Event

1. **Server handler** in `server/src/socket/whiteboardHandler.ts` or `editorHandler.ts`
2. **Client hook** in `client/src/hooks/useCollaborationSocket.ts` or `useCodeSocket.ts`
3. **Redux action** in the relevant slice for state updates

### Adding a New Room Type

1. Create page component in `client/src/pages/rooms/YourRoom.tsx`
2. Add case to `RoomRouter.tsx` switch statement
3. Add type value to `Room` interface in `client/src/types/index.ts`
4. Add room type option to create room modal

## Environment Variables

### Server (`server/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/syncspace` |
| `CLIENT_URL` | Client origin for CORS | `http://localhost:5173` |
| `JWT_SECRET` | Secret for JWT signing | **Required** |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |

### Client (`client/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000` |
| `VITE_SOCKET_URL` | Socket.IO server URL | `http://localhost:5000` |

## Getting Help

- Check existing documentation in `docs/`
- Review the API reference at `/api/docs` when server is running
- Look at existing code patterns before implementing new features
- Open an issue for bugs or feature requests

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
