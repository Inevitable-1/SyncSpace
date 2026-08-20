# SyncSpace Architecture

> Technical architecture documentation for the SyncSpace collaborative workspace platform.

---

## System Overview

SyncSpace is a full-stack collaborative workspace platform built as a monorepo with React (client) and Express (server). It provides real-time whiteboards, code editing, document collaboration, and team chat.

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client (React)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  Auth    │ │Dashboard │ │  Rooms   │ │ Landing  │          │
│  │  Pages   │ │  Pages   │ │  Pages   │ │  Pages   │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────┘          │
│       │             │            │                              │
│  ┌────▼─────────────▼────────────▼──────────────────────────┐  │
│  │                   Redux Store                            │  │
│  │  auth │ workspace │ room │ chat │ presence │ notification│  │
│  └────┬─────────────┬────────────┬──────────────────────────┘  │
│       │             │            │                              │
│  ┌────▼─────────────▼────────────▼──────────────────────────┐  │
│  │              Services (API) + Hooks (Socket)             │  │
│  └─────────────────────┬────────────────────────────────────┘  │
└────────────────────────┼───────────────────────────────────────┘
                         │ HTTP + WebSocket
┌────────────────────────┼───────────────────────────────────────┐
│                    Server (Express)                            │
│  ┌─────────────────────▼────────────────────────────────────┐  │
│  │                   HTTP Layer                             │  │
│  │  ┌──────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │  │
│  │  │ Auth │ │Workspace │ │   Room   │ │   Chat   │       │  │
│  │  │Routes│ │  Routes  │ │  Routes  │ │  Routes  │       │  │
│  │  └──┬───┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │  │
│  └─────┼──────────┼────────────┼────────────┼──────────────┘  │
│        │          │            │            │                  │
│  ┌─────▼──────────▼────────────▼────────────▼──────────────┐  │
│  │              Middleware + Controllers                    │  │
│  │  authenticate │ errorHandler │ rateLimit │ upload        │  │
│  └─────────────────────┬────────────────────────────────────┘  │
│                        │                                       │
│  ┌─────────────────────▼────────────────────────────────────┐  │
│  │               Socket.IO Layer                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐             │  │
│  │  │ whiteboardHandler│  │   editorHandler  │             │  │
│  │  │ (canvas, chat,   │  │ (code, cursor,   │             │  │
│  │  │  presence)       │  │  language, save)  │             │  │
│  │  └────────┬─────────┘  └────────┬─────────┘             │  │
│  └───────────┼──────────────────────┼───────────────────────┘  │
│              │                      │                          │
│  ┌───────────▼──────────────────────▼───────────────────────┐  │
│  │                   Data Layer                             │  │
│  │  Mongoose Models → MongoDB 7                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

### Token Model

SyncSpace uses a dual-token JWT system:

- **Access Token:** Short-lived (15 minutes), signed JWT containing `{ userId, email }`. Sent in `Authorization: Bearer <token>` header.
- **Refresh Token:** Long-lived (7 days), random 40-byte hex string. Stored hashed (SHA-256) in `RefreshToken` collection. Sent as httpOnly cookie.

### Registration Flow

```
Step 1: Email + Password
  POST /api/auth/register
  → Validates email uniqueness
  → Hashes password with bcrypt
  → Creates User document
  → Sends verification email (if configured)

Step 2: Email Verification
  POST /api/auth/verify-email
  → Validates verification token
  → Marks user as verified

Step 3: Password Setup (for invited users)
  POST /api/auth/setup-password
  → Sets password for accounts created via invitation
```

### Login Flow

```
POST /api/auth/login
  ↓
bcrypt.compare(password, user.passwordHash)
  ↓
generateTokenPair(user)
  ↓
┌─────────────────────────────────────────┐
│ Response:                               │
│   accessToken: jwt.sign({userId, email})│
│   refreshToken: random hex string       │
│   Set-Cookie: refreshToken (httpOnly)   │
└─────────────────────────────────────────┘
```

### Token Refresh Flow

```
POST /api/auth/refresh-token
  ↓
Read refreshToken from cookie
  ↓
hashToken(refreshToken) → SHA-256
  ↓
Find RefreshToken where hashedToken matches AND expiresAt > now
  ↓
Generate new token pair
  ↓
Delete old RefreshToken, save new one
  ↓
Return new accessToken + set new refreshToken cookie
```

### Socket Authentication

```
Client connects to Socket.IO:
  io(SOCKET_URL, { auth: { token: accessToken } })

Server middleware (whiteboardHandler.ts):
  1. Extract token from socket.handshake.auth.token
  2. verifyAccessToken(token) → payload
  3. socket.data.userId = payload.userId
  4. next() or next(new Error('Invalid token'))
```

**Key files:**
- `server/src/utils/tokens.ts` — Token generation and verification
- `server/src/middleware/auth.ts` — HTTP route authentication
- `server/src/socket/whiteboardHandler.ts` — Socket connection authentication
- `server/src/models/RefreshToken.ts` — Refresh token persistence

---

## Workspace System

### Data Model

```
Workspace
├── _id: ObjectId
├── name: string
├── description: string
├── owner: User (ref)
├── members: Member[]
│   └── Member
│       ├── user: User (ref)
│       ├── role: 'owner' | 'admin' | 'member'
│       └── joinedAt: Date
├── isDeleted: boolean
├── createdAt: Date
└── updatedAt: Date
```

### Permission Model

| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| Edit workspace | ✅ | ✅ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ |
| Manage members | ✅ | ✅ | ❌ |
| Invite members | ✅ | ✅ | ❌ |
| Create rooms | ✅ | ✅ | ✅ |
| View workspace | ✅ | ✅ | ✅ |

### Invitation Flow

```
Admin/Owner
  ↓
POST /api/workspaces/:id/invites
  { email: 'user@example.com', role: 'member' }
  ↓
Create Invite document with expiring token
  ↓
Send invitation email (if configured)
  ↓
Invitee clicks link → /verify-email?token=xxx
  ↓
POST /api/auth/accept-invite
  → Creates Member record
  → Adds user to workspace
```

**Key files:**
- `server/src/models/Workspace.ts`
- `server/src/models/Member.ts`
- `server/src/models/Invite.ts`
- `server/src/routes/workspace.ts`
- `server/src/routes/invite.ts`

---

## Room Architecture

### Room Types

Each room type has a dedicated layout and feature set:

| Type | Feature Component | Socket Handler | Description |
|------|------------------|----------------|-------------|
| `whiteboard` | WhiteboardCanvas (Konva.js) | whiteboardHandler | Infinite canvas drawing |
| `code` | Monaco Editor | editorHandler | Collaborative code editing |
| `document` | Textarea editor | None (HTTP only) | Document collaboration |

### Routing

```
/dashboard/rooms/:id
  ↓
RoomRouter.tsx
  ├── Fetches room by ID from Redux store
  ├── Dispatches fetchRooms() if not cached
  ├── Renders based on room.type:
  │   ├── 'whiteboard' → WhiteboardRoom
  │   ├── 'code' → CodeEditorRoom
  │   └── 'document' → DocumentRoom
```

### Room Layout

All room pages follow the same layout pattern:

```
┌──────────────────────────────────────────────────┐
│ ┌──────────┐ ┌──────────────────────────────────┐│
│ │ Back btn │ │ Room name + connection status    ││
│ │ Room name│ ├──────────────────────────────────┤│
│ ├──────────┤ │                                  ││
│ │          │ │         Feature Panel            ││
│ │  Chat    │ │    (Whiteboard / Editor / Doc)   ││
│ │  Panel   │ │                                  ││
│ │ (320px)  │ │                                  ││
│ │          │ │                                  ││
│ └──────────┘ └──────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

### DashboardLayout Detection

`DashboardLayout` detects room routes and adjusts rendering:

```typescript
const isRoomRoute = /^\/dashboard\/rooms\/[^/]+$/.test(pathname);

// When on a room route:
// - No TopNav (room has its own header)
// - No padding (full-width content)
// - No max-width constraint
// - h-screen flex flex-col overflow-hidden
```

**Key files:**
- `client/src/pages/rooms/RoomRouter.tsx` — Route dispatcher
- `client/src/pages/rooms/WhiteboardRoom.tsx` — Whiteboard layout
- `client/src/pages/rooms/CodeEditorRoom.tsx` — Code editor layout
- `client/src/pages/rooms/DocumentRoom.tsx` — Document editor layout
- `client/src/components/layout/DashboardLayout.tsx` — Layout wrapper

---

## Whiteboard System

### Canvas Rendering

The whiteboard uses **Konva.js** (HTML5 Canvas library) with **react-konva** for React integration.

```
WhiteboardCanvas
├── Stage (Konva.Stage)
│   ├── Layer (Konva.Layer)
│   │   ├── Rect, Circle, Line, Text, etc.
│   │   ├── Custom shapes (Star, Pentagon, etc.)
│   │   └── Connector lines
│   └── Transformer (selection handles)
```

### Coordinate System

Screen coordinates (mouse events) are converted to canvas coordinates:

```typescript
function screenToCanvas(
  screenX: number,
  screenY: number,
  stageRef: RefObject<Stage>,
  stagePos: { x: number; y: number },
  zoom: number
): { x: number; y: number } {
  const stage = stageRef.current;
  const rect = stage?.container().getBoundingClientRect();
  if (!rect) return { x: 0, y: 0 };

  return {
    x: (screenX - rect.left - stagePos.x) / zoom,
    y: (screenY - rect.top - stagePos.y) / zoom,
  };
}
```

### Object Model

```typescript
interface WhiteboardObject {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'text' | 'pencil' | 'arrow' | 'image' | 'star' | 'pentagon' | 'hexagon' | 'callout' | 'cloud' | 'heart' | 'diamond' | 'parallelogram' | 'trapezoid' | 'cross' | 'octagon';
  x: number;
  y: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rotation?: number;
  opacity?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  points?: number[];      // For pencil/line
  src?: string;           // For images
}
```

### Real-time Sync

```
User draws shape
  ↓
handleDraw(obj) → pushUndo([objects, obj])
  ↓
Socket emit: 'draw' { roomId, object }
  ↓
whiteboardHandler: room.objects.push(object)
  ↓
Socket broadcast: 'object-added' { object }
  ↓
Other clients: setObjects(prev => [...prev, object])
```

### Undo/Redo

```
undoStack: WhiteboardObject[][]  // Previous states
redoStack: WhiteboardObject[][]  // Undone states

handleDraw(newObj):
  undoStack.push(currentObjects)
  redoStack = []
  objects = [...objects, newObj]

handleUndo():
  prev = undoStack.pop()
  redoStack.push(objects)
  objects = prev

handleRedo():
  next = redoStack.pop()
  undoStack.push(objects)
  objects = next
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| V | Pointer (select) |
| H | Hand (pan) |
| P | Pencil (free draw) |
| L | Line |
| R | Rectangle |
| C | Circle |
| A | Arrow |
| T | Text |
| E | Eraser |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z / Ctrl+Y | Redo |
| Ctrl+A | Select all |
| Delete/Backspace | Delete selected |

**Key files:**
- `client/src/components/whiteboard/WhiteboardCanvas.tsx`
- `client/src/components/whiteboard/Toolbar.tsx`
- `client/src/components/whiteboard/ShapeEditorPanel.tsx`
- `server/src/socket/whiteboardHandler.ts`

---

## Code Editor System

### Editor Stack

- **Monaco Editor** (`@monaco-editor/react`) — VS Code's editor engine
- **Syntax highlighting** for Java, Python, C, C++
- **Features:** Autocomplete, bracket matching, minimap, find/replace, multi-cursor

### Collaborative Editing Protocol

The code editor uses Socket.IO for real-time synchronization:

```
Events (client → server):
  code:join      { roomId, userName, userId }
  code:update    { roomId, code, cursor }
  code:cursor    { roomId, line, column }
  code:language  { roomId, language }
  code:save      { roomId, code, language }
  code:leave     { roomId }

Events (server → client):
  code:joined        { code, language, users }
  code:update        { socketId, code, cursor, userName, color }
  code:cursor        { socketId, userName, color, line, column }
  code:language      { language }
  code:saved         { savedBy, timestamp }
  code:user-joined   { socketId, userId, userName, color }
  code:user-left     { socketId, userId }
```

### Cursor Sharing

Each user gets a unique color from a predefined palette:

```typescript
const CURSOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];
```

Cursors are rendered as colored lines with user name labels.

### Code Execution

```
POST /api/code/run
  { language: 'java', code: 'public class Main { ... }' }

Server:
  1. Create temp directory: /tmp/syncspace-run-{hex}
  2. Write code to file (Main.java, main.py, main.c, main.cpp)
  3. Compile (javac / gcc / g++) if needed
  4. Execute with 10-second timeout
  5. Capture stdout + stderr
  6. Clean up temp directory
  7. Return { output, error, exitCode, timedOut }
```

### Auto-save

```
useCodeSocket:
  - Every 5 seconds: emitSave(code, language)
  - On beforeunload: emitSave(code, language)
  - Server handler: CodeDocument.findOneAndUpdate(...) or create(...)
```

**Key files:**
- `client/src/hooks/useCodeSocket.ts`
- `server/src/socket/editorHandler.ts`
- `server/src/controllers/codeRun.ts`
- `server/src/routes/codeRun.ts`

---

## Chat System

### Message Model

```typescript
interface ChatMessage {
  _id: ObjectId;
  room: ObjectId;           // Room reference
  sender: {
    _id: ObjectId;
    name: string;
    email: string;
    avatar: string;
  };
  content: string;
  type: 'text' | 'emoji' | 'system';
  replyTo?: ObjectId;       // Reference to parent message
  edited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  seenBy: ObjectId[];       // Users who have seen this message
  createdAt: Date;
  updatedAt: Date;
}
```

### Delivery Mechanism

Chat uses a **hybrid approach**:

1. **Primary (Socket.IO):**
   - `useCollaborationSocket.sendMessage()` → `socket.emit('send-message', data)`
   - Server saves to DB + broadcasts to `chat:${roomId}`
   - All clients in room receive `receive-message` event

2. **Fallback (HTTP):**
   - `chatService.sendMessage()` → `POST /api/chat/:roomId`
   - Server saves to DB (no broadcast)
   - Used for reliability when socket is disconnected

### Typing Indicators

```
User starts typing:
  → socket.emit('typing-start', { roomId })
  → Server updates RoomPresence.status = 'typing'
  → Server broadcasts 'user-typing' to room:${roomId}

User stops typing (2s debounce):
  → socket.emit('typing-stop', { roomId })
  → Server updates RoomPresence.status = 'online'
  → Server broadcasts 'user-stopped-typing' to room:${roomId}
```

### Read Receipts

```
ChatPanel mounts:
  → socket.emit('mark-seen', { roomId })
  → Server: ChatMessage.updateMany({ seenBy: { $ne: userId } }, { $addToSet: { seenBy: userId } })
  → Server broadcasts 'messages-seen' to chat:${roomId}
```

**Key files:**
- `client/src/components/chat/ChatPanel.tsx`
- `client/src/components/chat/ChatInput.tsx`
- `client/src/components/chat/ChatMessageItem.tsx`
- `client/src/hooks/useCollaborationSocket.ts`
- `server/src/socket/whiteboardHandler.ts` (chat events section)
- `server/src/controllers/chat.ts`

---

## Socket.IO Architecture

### Connection Flow

```
Client:
  const socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    transports: ['websocket', 'polling'],
  });

Server middleware:
  1. Extract token from handshake.auth.token
  2. verifyAccessToken(token)
  3. Set socket.data.userId and socket.data.email
  4. Call next() to proceed
```

### Room Structure

Each room type uses different Socket.IO rooms:

| Room Pattern | Purpose | Events |
|-------------|---------|--------|
| `room:${roomId}` | Whiteboard/canvas events | draw, update-object, cursor-move, undo/redo |
| `chat:${roomId}` | Chat messaging | send-message, receive-message, typing, seen |
| `code:${roomId}` | Code editor events | code:update, code:cursor, code:language |
| `editor:${roomId}` | Legacy editor events | code-change, cursor-update (deprecated) |
| `user:${userId}` | Personal notifications | notification |

### Event Handlers

Two main handler files:

1. **`whiteboardHandler.ts`:**
   - Whiteboard drawing events (draw, update-object, delete-object, cursor-move)
   - Chat events (send-message, edit-message, delete-message, typing-start/stop)
   - Presence events (join-room, leave-room, update-activity)
   - Notification events (send-notification)
   - Disconnect cleanup

2. **`editorHandler.ts`:**
   - Code editor events (code:join, code:update, code:cursor, code:language, code:save)
   - Legacy editor events (editor-join, code-change, cursor-update)
   - Document persistence

### State Management

Socket rooms maintain in-memory state:

```typescript
// Whiteboard rooms
const rooms = new Map<string, {
  objects: WhiteboardObject[];
  users: Map<socketId, { userId, userName, color }>;
  undoStack: WhiteboardObject[][];
  redoStack: WhiteboardObject[][];
}>();

// Code editor rooms
const editorRooms = new Map<string, {
  documents: Map<fileName, content>;
  users: Map<socketId, EditorUser>;
  code: string;
  language: string;
}>();
```

### Presence System

```typescript
// RoomPresence model
{
  room: ObjectId,
  user: ObjectId,
  socketId: string,
  status: 'online' | 'typing' | 'away',
  currentActivity: string,
  lastActiveAt: Date,
  joinedAt: Date,
}
```

**Key files:**
- `server/src/socket/whiteboardHandler.ts`
- `server/src/socket/editorHandler.ts`
- `client/src/hooks/useCollaborationSocket.ts`
- `client/src/hooks/useCodeSocket.ts`

---

## Data Flow Summary

### HTTP Request Lifecycle

```
Client Request
  ↓
Express Router (routes/*.ts)
  ↓
Validation Middleware (express-validator)
  ↓
Auth Middleware (authenticate) → JWT verification
  ↓
Controller (controllers/*.ts)
  ↓
Service (services/*.ts) — Business logic
  ↓
Repository (repositories/*.ts) — Data access
  ↓
Mongoose Model → MongoDB
  ↓
Response: { success: true, data: {...} }
```

### Socket Event Lifecycle

```
Client emit
  ↓
Socket.IO Server
  ↓
JWT Auth Middleware (whiteboardHandler.ts)
  ↓
Event Handler (socket.on('event-name'))
  ↓
In-Memory State Update
  ↓
MongoDB Persistence (if needed)
  ↓
Broadcast to Socket.IO Room
  ↓
Other Clients receive event
  ↓
Redux Dispatch → UI Update
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Socket.IO over raw WebSocket** | Automatic reconnection, room support, fallback to polling |
| **Hybrid chat (REST + Socket)** | HTTP for reliability, Socket for real-time broadcast |
| **Type-based room routing** | Each room type has unique layout and features |
| **In-memory socket state** | Fast reads for cursor/position data, persisted to DB periodically |
| **Dual token auth** | Access token for API, refresh token for session persistence |
| **Monaco over CodeMirror** | VS Code familiarity, better multi-language support |
| **Konva.js over Fabric.js** | Better React integration, good performance for large canvases |
| **Redux Toolkit** | Predictable state, good DevTools, async thunk support |
