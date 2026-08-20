# SyncSpace Backend Architecture Report

> Generated: 2026-08-20 | Version: 1.0.0

## Overview

SyncSpace is a real-time collaborative workspace platform built with Express.js, MongoDB (Mongoose), and Socket.IO. The backend serves a React SPA via REST API and WebSocket connections.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js + ESM | - |
| Framework | Express.js | 5.2.1 |
| Language | TypeScript | 7.0.2 |
| Database | MongoDB + Mongoose | 9.7.4 |
| Realtime | Socket.IO | 4.8.3 |
| Auth | JWT (access + refresh tokens) | - |
| Validation | express-validator | - |
| Logging | Winston | - |
| File Upload | Multer (50MB limit) | - |

## Directory Structure

```
server/src/
├── app.ts                    # Express app, route registration, Socket.IO, Swagger UI
├── server.ts                 # Bootstrap: dotenv, DB connect, HTTP listen
├── configs/
│   ├── db.ts                 # MongoDB connection with retry logic
│   └── openapi.json          # OpenAPI 3.0.3 specification (~2500 lines)
├── middleware/
│   ├── auth.ts               # JWT Bearer token verification
│   ├── errorHandler.ts       # AppError class + global error handler
│   ├── rateLimit.ts          # In-memory rate limiter (auth: 20/15min, API: 200/15min)
│   └── upload.ts             # Multer disk storage, 50MB max, executable blocking
├── controllers/              # 17 controller files (route handlers)
│   ├── auth.ts               # 409 lines - Registration flow, login, token refresh
│   ├── workspace.ts          # 216 lines - CRUD, trash, search, favorites, archive
│   ├── room.ts               # 426 lines - CRUD, stats, invite links, join
│   ├── task.ts               # 269 lines - CRUD, comments, workspace filtering
│   ├── meeting.ts            # 312 lines - CRUD, start/end/join lifecycle
│   ├── chat.ts               # 160 lines - Messages with cursor pagination
│   ├── file.ts               # 252 lines - Upload, download, folders, avatar/cover
│   ├── whiteboard.ts         # 97 lines  - Get/save state, image upload
│   ├── codeDocument.ts       # 272 lines - File tree CRUD, path management
│   ├── codeRun.ts            # 270 lines - Sandboxed code execution
│   ├── member.ts             # 64 lines  - Delegates to memberService
│   ├── invite.ts             # 58 lines  - Delegates to inviteService
│   ├── notification.ts       # 122 lines - CRUD, read tracking
│   ├── activity.ts           # 86 lines  - Activity feed with filtering
│   ├── profile.ts            # 267 lines - CRUD, contributions, heatmap, calendar
│   ├── dashboard.ts          # 85 lines  - Aggregated counts + recent data
│   └── shared.ts             # 54 lines  - Shared workspaces/rooms/files
├── routes/                   # 17 route files (Express Router)
│   ├── auth.ts               # 11 endpoints
│   ├── workspace.ts          # 16 endpoints
│   ├── room.ts               # 9 endpoints
│   ├── task.ts               # 8 endpoints
│   ├── meeting.ts            # 9 endpoints
│   ├── chat.ts               # 5 endpoints
│   ├── file.ts               # 8 endpoints
│   ├── whiteboard.ts         # 3 endpoints
│   ├── codeDocument.ts       # 6 endpoints
│   ├── codeRun.ts            # 1 endpoint
│   ├── member.ts             # 7 endpoints
│   ├── invite.ts             # 7 endpoints
│   ├── notification.ts       # 5 endpoints
│   ├── activity.ts           # 3 endpoints
│   ├── profile.ts            # 7 endpoints
│   ├── dashboard.ts          # 1 endpoint
│   └── shared.ts             # 3 endpoints
├── models/                   # 16 Mongoose models
│   ├── User.ts               # name, email, password (select:false), avatar, bio, verification tokens
│   ├── Workspace.ts          # name, description, color, icon, isPublic, inviteCode, members[]
│   ├── Room.ts               # name, type (whiteboard|code|document), inviteCode, participants[]
│   ├── Task.ts               # title, status, priority, labels[], checklist[], order
│   ├── TaskComment.ts        # task, author, content
│   ├── Meeting.ts            # name, host, participants[], scheduledAt, status, meetingCode
│   ├── ChatMessage.ts        # room, sender, content, type, replyTo, seenBy[]
│   ├── Whiteboard.ts         # roomId (unique), objects[] (flexible schema)
│   ├── CodeDocument.ts       # name, path (unique per room), content, language, isFolder
│   ├── UploadedFile.ts       # name, mimeType, size, path, workspace, folder
│   ├── Member.ts             # userId, workspaceId, role, status (unique compound index)
│   ├── Invite.ts             # email, workspaceId, token (unique), expiresAt (TTL index)
│   ├── Notification.ts       # user, title, message, type, entityType, isRead
│   ├── Activity.ts           # user, action, entityType, entityId, metadata
│   ├── RefreshToken.ts       # user, token (hashed), expiresAt (TTL index)
│   └── RoomPresence.ts       # room, user, socketId, status, currentActivity
├── services/                 # 4 service files (business logic layer)
│   ├── workspaceService.ts   # 266 lines - Workspace CRUD with member management
│   ├── memberService.ts      # 221 lines - Member CRUD with role-based access
│   ├── inviteService.ts      # 206 lines - Invite lifecycle with email validation
│   └── mailService.ts        # 27 lines  - Email sending (dev stub)
├── socket/                   # 2 Socket.IO handler files
│   ├── whiteboardHandler.ts  # 649 lines - Whiteboard + chat + presence events
│   └── editorHandler.ts      # 464 lines - Code editor real-time events
├── dto/                      # 4 DTO files
│   ├── common.dto.ts         # PaginationDto, PaginatedResponse<T>
│   ├── workspace.dto.ts      # CreateWorkspaceDto, UpdateWorkspaceDto, WorkspaceQueryDto
│   ├── member.dto.ts         # MemberQueryDto
│   └── invite.dto.ts         # InviteQueryDto
└── utils/                    # 3 utility files
    ├── logger.ts             # Winston logger with configurable level
    ├── asyncHandler.ts       # Promise wrapper for Express async routes
    └── tokens.ts             # JWT access/refresh token generation and verification
```

## Architecture Patterns

### 1. Layered Architecture
```
Routes → Controllers → Services → Models
  ↓         ↓            ↓
Middleware  DTOs        Utils
```

- **Routes**: Define HTTP methods, URL paths, validation rules, and middleware
- **Controllers**: Handle request/response, call services, return JSON
- **Services**: Business logic, data access, activity/notification logging
- **Models**: Mongoose schemas with indexes, hooks, and instance methods

### 2. Authentication Flow
```
Client → POST /api/auth/login → Controller validates credentials
       → generateTokenPair() → Access token (15min JWT) + Refresh token (7-day random hex)
       → Refresh token hashed (SHA-256) and stored in DB
       → Refresh token set as httpOnly cookie
       → Access token returned in response body

Client → Protected request → Authorization: Bearer <accessToken>
       → authenticate middleware → verifyAccessToken() → req.user = { userId, email }

Client → Token expired (401) → POST /api/auth/refresh-token
       → Read refresh token from cookie → Hash → Validate against DB
       → Rotate: delete old, create new → Issue new access token
```

### 3. Soft Delete Pattern
Most models support soft deletion:
- `isDeleted: Boolean` (default: false)
- `deletedAt: Date` (set on delete)
- Queries filter by `isDeleted: { $ne: true }` by default
- Restore endpoints set `isDeleted: false` and clear `deletedAt`

### 4. Activity Logging
Centralized `logActivity()` function called after significant actions:
- Parameters: `{ user, action, entityType, entityId, entityName, metadata? }`
- 47 possible action types covering all entity operations
- Used for audit trail and gamification scoring

### 5. Rate Limiting
In-memory rate limiter (no Redis dependency):
- Auth endpoints: 20 requests per 15 minutes per IP
- API endpoints: 200 requests per 15 minutes per IP
- Auto-cleanup every 60 seconds

### 6. Real-time Collaboration
Two Socket.IO namespaces:

**Whiteboard + Chat** (`whiteboardHandler.ts`):
- JWT authentication via handshake auth token
- In-memory state per room (objects, users, undo/redo stacks)
- Events: join-room, leave-room, draw, update-object, delete-object, cursor-move, undo, redo, clear-canvas, save-whiteboard
- Chat events: send-message, edit-message, delete-message, typing-start/stop, mark-seen
- Presence tracking via RoomPresence model

**Code Editor** (`editorHandler.ts`):
- Two protocol versions: legacy "editor" namespace and new "code" namespace
- In-memory state per room (code, language, users, cursors)
- Events: code:join, code:leave, code:update, code:cursor, code:language, code:save
- 15 cursor colors assigned round-robin

## API Endpoint Summary

| Module | Endpoints | Auth Required | Rate Limited |
|--------|-----------|---------------|--------------|
| Health | 2 | No | No |
| Auth | 11 | Partial | Yes (20/15min) |
| Profile | 7 | Yes | Yes (200/15min) |
| Workspaces | 16 | Yes | Yes |
| Rooms | 9 | Yes | Yes |
| Tasks | 8 | Yes | Yes |
| Files | 8 | Yes | Yes |
| Meetings | 9 | Yes | Yes |
| Chat | 5 | Yes | Yes |
| Whiteboards | 3 | Yes | Yes |
| Documents | 6 | Yes | Yes |
| Code Runner | 1 | Yes | Yes |
| Members | 7 | Yes | Yes |
| Invites | 7 | Yes | Yes |
| Notifications | 5 | Yes | Yes |
| Activities | 3 | Yes | Yes |
| Dashboard | 1 | Yes | Yes |
| Shared | 3 | Yes | Yes |
| **Total** | **111** | | |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 5000 | HTTP server port |
| `MONGODB_URI` | No | mongodb://localhost:27017/syncspace | MongoDB connection string |
| `JWT_SECRET` | **Yes** | - | JWT signing secret |
| `JWT_EXPIRES_IN` | No | 15m | Access token TTL |
| `CORS_ORIGIN` | No | http://localhost:5173 | Allowed CORS origin |
| `CLIENT_URL` | No | http://localhost:5173 | Client URL for email links |
| `LOG_LEVEL` | No | info | Winston log level |

## Key Design Decisions

1. **No Redis dependency**: Rate limiting and Socket.IO state are in-memory. Suitable for single-instance deployment.
2. **Dual token strategy**: Short-lived JWT access tokens + long-lived refresh tokens with rotation.
3. **Service layer pattern**: Complex operations (workspace, member, invite) use service classes; simpler ones use direct controller logic.
4. **Flexible whiteboard schema**: Whiteboard objects use `strict: false` Mongoose schema to allow arbitrary properties.
5. **Soft delete everywhere**: Nearly all entities support soft deletion with restore capability.
6. **Email verification flow**: 3-step registration: register → verify email → set password (not immediate login).
