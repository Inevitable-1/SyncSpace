# Data Models

This document is the authoritative reference for every MongoDB model used by the SyncSpace server. It covers the purpose, field structure, relationships, and API usage of each model.

All models live in `server/src/models/` and are defined with Mongoose. The MongoDB connection is configured in `server/src/configs/db.ts`.

---

## Model Index

| Model | File | Category | Relationships |
|---|---|---|---|
| User | `User.ts` | Identity | owns workspaces, rooms, memberships, messages, etc. |
| RefreshToken | `RefreshToken.ts` | Session | → User |
| Workspace | `Workspace.ts` | Organization | → User (owner), members, rooms |
| Member | `Member.ts` | Membership | → User + Workspace |
| Invite | `Invite.ts` | Membership | → Workspace + User |
| Room | `Room.ts` | Collaboration | → Workspace + User |
| RoomPresence | `RoomPresence.ts` | Realtime | → Room + User |
| ChatMessage | `ChatMessage.ts` | Communication | → Room + User |
| Whiteboard | `Whiteboard.ts` | Collaboration | → Room + User |
| CodeDocument | `CodeDocument.ts` | Collaboration | → Room + Workspace + User |
| Task | `Task.ts` | Project mgmt | → Workspace + Room + User |
| TaskComment | `TaskComment.ts` | Project mgmt | → Task + User |
| UploadedFile | `UploadedFile.ts` | Storage | → Workspace + Room + User |
| Meeting | `Meeting.ts` | Communication | → Workspace + User |
| Notification | `Notification.ts` | System | → User |
| Activity | `Activity.ts` | Audit log | → User |

---

## 1. User

**Purpose**: Authentication identity — stores profile and credential information.

**File**: `server/src/models/User.ts`

| Field | Type | Notes |
|---|---|---|
| name | String | required |
| email | String | required, unique |
| password | String | hashed; **optional** (passwordless sign-in assigns a random hash) |
| avatar | String | default `''` |
| isEmailVerified | Boolean | default `false` |
| emailVerifiedAt | Date | |

**Relationships**:
- **owns** many `Workspace`s (via `owner`)
- **is member of** many `Workspace`s (via `Member`)
- **owns/sends** `Room`, `ChatMessage`, `Whiteboard`, `CodeDocument`, `Task`, `UploadedFile`, `Meeting`, `Activity`, `Notification`, `RefreshToken`, `Invite`, `RoomPresence`

**API usage**:
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/demo`
- `POST /api/auth/refresh-token`, `POST /api/auth/logout`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- `GET /api/auth/me`

---

## 2. RefreshToken

**Purpose**: Persists refresh tokens (hashed) for session renewal and revocation.

**File**: `server/src/models/RefreshToken.ts`

| Field | Type | Notes |
|---|---|---|
| user | ObjectId → User | required |
| tokenHash | String | required |
| userAgent | String | default `''` |
| ip | String | default `''` |
| expiresAt | Date | required |

**Relationships**: belongs to one `User`.

**API usage**: `POST /api/auth/refresh-token`, `POST /api/auth/logout`.

---

## 3. Workspace

**Purpose**: The top-level organizational unit that contains rooms, files, tasks, members, and meetings.

**File**: `server/src/models/Workspace.ts`

| Field | Type | Notes |
|---|---|---|
| name | String | required |
| description | String | default `''` |
| color | String | default `#6366f1` (brand accent) |
| icon | String | default `''` |
| isPublic | Boolean | default `false` |
| inviteCode | String | unique, auto-generated |
| owner | ObjectId → User | required |
| members | ObjectId[] → User | array |
| isFavorite | Boolean | default `false` |
| isArchived | Boolean | default `false` |
| isDeleted | Boolean | default `false` (soft delete) |
| deletedAt | Date | |

**Relationships**:
- **owner**: one `User`
- **members**: many `User` (mirrored by `Member` documents)
- **has** many `Room`, `Task`, `UploadedFile`, `Meeting`, `Invite`, `Member`

**API usage**:
- `POST /api/workspaces`, `GET /api/workspaces`, `GET /api/workspaces/search`, `GET /api/workspaces/trash`
- `GET /api/workspaces/:id`, `PUT /api/workspaces/:id`, `DELETE /api/workspaces/:id`
- `POST /api/workspaces/:id/restore`, `/favorite`, `/archive`, `/unarchive`, `/invite-code`
- `POST /api/workspaces/join`

---

## 4. Member

**Purpose**: Role-based membership link between a user and a workspace.

**File**: `server/src/models/Member.ts`

| Field | Type | Notes |
|---|---|---|
| userId | ObjectId → User | required |
| workspaceId | ObjectId → Workspace | required |
| role | String | `owner` \| `admin` \| `member` |
| status | String | `active` \| `invited` \| `suspended` |
| invitedBy | ObjectId → User | |
| joinedAt | Date | default now |

Unique index on `(userId, workspaceId)`.

**Relationships**: belongs to one `User` and one `Workspace`.

**API usage** (mounted under `/api/workspaces/:id/members`):
- `GET /`, `GET /stats`, `POST /`
- `PUT /:memberId/role`, `PUT /:memberId/suspend`, `PUT /:memberId/reactivate`, `DELETE /:memberId`

---

## 5. Invite

**Purpose**: Email-based invitation with a tokenized accept/decline flow.

**File**: `server/src/models/Invite.ts`

| Field | Type | Notes |
|---|---|---|
| email | String | required |
| workspaceId | ObjectId → Workspace | required |
| invitedBy | ObjectId → User | required |
| role | String | `admin` \| `member` |
| status | String | `pending` \| `accepted` \| `declined` \| `expired` |
| token | String | unique, crypto-random |
| expiresAt | Date | 7 days default |

**Relationships**: belongs to one `Workspace`, created by one `User`.

**API usage**:
- `POST /api/workspaces/:id/invites`
- `GET /api/invites`, `GET /api/invites/pending`, `GET /api/invites/stats`
- `POST /api/invites/:token/accept`, `POST /api/invites/:token/decline`
- `DELETE /api/invites/:inviteId`

---

## 6. Room

**Purpose**: A collaboration session container for whiteboards, code editors, or documents.

**File**: `server/src/models/Room.ts`

| Field | Type | Notes |
|---|---|---|
| name | String | required |
| description | String | default `''` |
| type | String | `whiteboard` \| `code` \| `document` |
| workspace | ObjectId → Workspace | required |
| owner | ObjectId → User | required |
| inviteCode | String | unique |
| isActive | Boolean | default `false` |
| participants | ObjectId[] → User | |
| isDeleted | Boolean | default `false` (soft delete) |
| deletedAt | Date | |

**Relationships**: belongs to one `Workspace`; **contains** `ChatMessage`, `Whiteboard`, `CodeDocument`, `RoomPresence`, and optional `Task` references.

**API usage**:
- `POST /api/rooms`, `GET /api/rooms`, `GET /api/rooms/stats`, `POST /api/rooms/join`
- `GET /api/rooms/:id`, `PUT /api/rooms/:id`, `DELETE /api/rooms/:id`
- `POST /api/rooms/:id/restore`, `GET /api/rooms/:id/invite-link`

---

## 7. RoomPresence

**Purpose**: Realtime presence tracking (online/idle/typing + current activity) inside a room.

**File**: `server/src/models/RoomPresence.ts`

| Field | Type | Notes |
|---|---|---|
| room | ObjectId → Room | required |
| user | ObjectId → User | required |
| socketId | String | required |
| status | String | `online` \| `idle` \| `typing` |
| currentActivity | String | default `Viewing room` |
| joinedAt | Date | |
| lastSeenAt | Date | |

Unique index on `(room, user)`.

**Relationships**: belongs to one `Room` and one `User`.

**API usage**: used by the socket layer (`server/src/socket/whiteboardHandler.ts`) for presence join/leave/update events. No direct REST endpoint.

---

## 8. ChatMessage

**Purpose**: Team chat messages inside a room (text, emoji, system events) with edit/delete/read tracking.

**File**: `server/src/models/ChatMessage.ts`

| Field | Type | Notes |
|---|---|---|
| room | ObjectId → Room | required |
| sender | ObjectId → User | required |
| content | String | required |
| type | String | `text` \| `emoji` \| `system` |
| replyTo | ObjectId → ChatMessage | |
| edited | Boolean | default `false` |
| editedAt | Date | |
| isDeleted | Boolean | default `false` |
| deletedAt | Date | |
| seenBy | ObjectId[] → User | |

**Relationships**: belongs to one `Room`; sender is one `User`; may reply to another `ChatMessage`.

**API usage**:
- `GET /api/chat/:roomId`, `POST /api/chat/:roomId`
- `PUT /api/chat/:messageId`, `DELETE /api/chat/:messageId`
- `POST /api/chat/:roomId/seen`

---

## 9. Whiteboard

**Purpose**: Persists the full whiteboard object graph for a room (one whiteboard per room).

**File**: `server/src/models/Whiteboard.ts`

| Field | Type | Notes |
|---|---|---|
| room | ObjectId → Room | required, **unique** |
| owner | ObjectId → User | required |
| objects | [WhiteboardObject] | shapes with `id`, `type`, `x`, `y`, `width`, `height`, `points`, `text`, `stroke`, `fill`, `strokeWidth`, `opacity`, `fontSize`, `fontFamily`, `rotation`, `scaleX`, `scaleY`, `closed` |
| version | Number | increment on save |

**Relationships**: exactly one per `Room`, created by one `User`.

**API usage**:
- `GET /api/whiteboards/:roomId` (auto-creates if missing), `PUT /api/whiteboards/:roomId`
- Socket events `draw`, `update-object`, `delete-object`, `undo`, `redo`, `clear-canvas`, `save-whiteboard`

---

## 10. CodeDocument

**Purpose**: A file/node in the collaborative code editor tree, keyed uniquely by `(room, path)`.

**File**: `server/src/models/CodeDocument.ts`

| Field | Type | Notes |
|---|---|---|
| name | String | required |
| path | String | required |
| content | String | default `''` |
| language | String | default `plaintext` |
| room | ObjectId → Room | required |
| workspace | ObjectId → Workspace | required |
| createdBy | ObjectId → User | required |
| lastEditedBy | ObjectId → User | |
| parentPath | String | default `/` |
| isFolder | Boolean | default `false` |
| isDeleted | Boolean | default `false` |
| deletedAt | Date | |
| versionTimestamps | Date[] | |

Unique index on `(room, path)`.

**Relationships**: belongs to one `Room` and one `Workspace`; created/edited by `User`s.

**API usage**:
- `GET /api/documents/room/:roomId`, `GET /api/documents/:id`
- `POST /api/documents`, `PUT /api/documents/:id`, `PUT /api/documents/:id/rename`, `DELETE /api/documents/:id`
- Socket events `editor-join`, `code-change`, `cursor-update`, `sync-document`, `save-document`

---

## 11. Task

**Purpose**: Work items in a workspace or room, displayed on the Kanban board.

**File**: `server/src/models/Task.ts`

| Field | Type | Notes |
|---|---|---|
| title | String | required |
| description | String | default `''` |
| workspace | ObjectId → Workspace | required |
| room | ObjectId → Room | optional |
| creator | ObjectId → User | required |
| assignee | ObjectId → User | optional |
| status | String | `todo` \| `in-progress` \| `review` \| `completed` |
| priority | String | `low` \| `medium` \| `high` \| `urgent` |
| labels | String[] | |
| dueDate | Date | |
| checklist | [{ text, done }] | |
| order | Number | default `0` |
| isDeleted | Boolean | default `false` |
| deletedAt | Date | |

**Relationships**: belongs to one `Workspace`; optionally one `Room`; creator and assignee are `User`s; **has** many `TaskComment`.

**API usage**:
- `GET /api/tasks`, `GET /api/tasks/workspace/:workspaceId`
- `POST /api/tasks`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`
- `GET /api/tasks/:id/comments`, `POST /api/tasks/:id/comments`

---

## 12. TaskComment

**Purpose**: Comment threads on tasks.

**File**: `server/src/models/TaskComment.ts`

| Field | Type | Notes |
|---|---|---|
| task | ObjectId → Task | required |
| author | ObjectId → User | required |
| content | String | required |
| isDeleted | Boolean | default `false` |
| createdAt | Date | |
| updatedAt | Boolean (timestamp) | |

**Relationships**: belongs to one `Task`, authored by one `User`.

**API usage**: `GET/POST /api/tasks/:id/comments`.

---

## 13. UploadedFile

**Purpose**: File metadata for uploads inside a workspace (physical file stored on disk).

**File**: `server/src/models/UploadedFile.ts`

| Field | Type | Notes |
|---|---|---|
| name | String | required (stored name) |
| originalName | String | required |
| mimeType | String | required |
| size | Number | required |
| path | String | required (disk path) |
| workspace | ObjectId → Workspace | required |
| room | ObjectId → Room | optional |
| folder | String | default `/` |
| uploader | ObjectId → User | required |
| isDeleted | Boolean | default `false` |
| createdAt | Date | |

Text index on `(workspace, name)`.

**Relationships**: belongs to one `Workspace`; optionally one `Room`; uploaded by one `User`.

**API usage**:
- `GET /api/files`, `GET /api/files/folders`, `POST /api/files` (multipart)
- `GET /api/files/:id/download`, `PUT /api/files/:id/rename`, `DELETE /api/files/:id`

---

## 14. Meeting

**Purpose**: Scheduled video meetings with status lifecycle (scheduled → ongoing → completed).

**File**: `server/src/models/Meeting.ts`

| Field | Type | Notes |
|---|---|---|
| name | String | required |
| description | String | default `''` |
| workspace | ObjectId → Workspace | required |
| host | ObjectId → User | required |
| participants | ObjectId[] → User | |
| scheduledAt | Date | required |
| duration | Number | default `30`, min `5` |
| status | String | `scheduled` \| `ongoing` \| `completed` \| `cancelled` |
| agenda | String | default `''` |
| notes | String | default `''` |
| meetingCode | String | unique |
| endedAt | Date | |
| isDeleted | Boolean | default `false` |

**Relationships**: belongs to one `Workspace`; host + participants are `User`s.

**API usage**:
- `GET /api/meetings`, `GET /api/meetings/stats`, `GET /api/meetings/:id`
- `POST /api/meetings`, `PUT /api/meetings/:id`, `DELETE /api/meetings/:id`
- `POST /api/meetings/:id/start`, `/end`, `/join`

---

## 15. Notification

**Purpose**: Per-user system notifications (real-time via socket + REST).

**File**: `server/src/models/Notification.ts`

| Field | Type | Notes |
|---|---|---|
| user | ObjectId → User | required |
| title | String | required |
| message | String | required |
| type | String | `info` \| `success` \| `warning` \| `error` |
| entityType | String | `workspace` \| `room` \| `member` \| `invite` \| `activity` \| `meeting` \| `file` |
| entityId | String | |
| workspace | ObjectId → Workspace | |
| isRead | Boolean | default `false` |

**Relationships**: belongs to one `User`; may reference one `Workspace`.

**API usage**:
- `GET /api/notifications`
- `PUT /api/notifications/read-all`, `PUT /api/notifications/:id/read`
- `DELETE /api/notifications/clear`, `DELETE /api/notifications/:id`
- Real-time delivery via socket event `notification`

---

## 16. Activity

**Purpose**: Audit log of user actions across the platform.

**File**: `server/src/models/Activity.ts`

| Field | Type | Notes |
|---|---|---|
| user | ObjectId → User | required |
| action | String | required |
| entityType | String | enum (workspace, room, member, invite, auth, task, file, meeting, whiteboard) |
| entityId | ObjectId or String | |
| entityName | String | default `''` |
| metadata | Mixed | |

**Relationships**: created by one `User`.

**API usage**:
- `GET /api/activities`, `DELETE /api/activities/:id`, `DELETE /api/activities/clear`
- Created across controllers via `logActivity(...)` helper.

---

## Model Audit Checklist

- ✅ All 16 models are imported and used by at least one controller, repository, or socket handler.
- ✅ No unused / orphan models.
- ✅ No frontend type is defined without a backing server model.
- ✅ Soft-delete convention (isDeleted / deletedAt) is consistent across Workspace, Room, Task, UploadedFile.
- ✅ Unique constraints enforced where identity matters (User.email, Workspace.inviteCode, Member (user,workspace), RoomPresence (room,user), CodeDocument (room,path), Whiteboard.room, Invite.token, Meeting.meetingCode).
