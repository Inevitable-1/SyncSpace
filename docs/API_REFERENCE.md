# API Reference

Base URL: `http://localhost:5000/api`

All authenticated endpoints require: `Authorization: Bearer <accessToken>`

## Authentication

### POST /auth/register

Register a new user.

**Body:**

```json
{ "name": "string", "email": "string", "password": "string" }
```

**Response (201):**

```json
{ "success": true, "data": { "user": { "id", "name", "email" }, "accessToken": "string" } }
```

### POST /auth/login

Login with email and password.

**Body:**

```json
{ "email": "string", "password": "string" }
```

**Response (200):**

```json
{ "success": true, "data": { "user": { "id", "name", "email" }, "accessToken": "string" } }
```

### POST /auth/logout

Clear refresh token cookie.

### POST /auth/refresh-token

Refresh access token using httpOnly cookie.

### POST /auth/forgot-password

**Body:** `{ "email": "string" }`

### POST /auth/reset-password

**Body:** `{ "token": "string", "password": "string" }`

### GET /auth/me

Get authenticated user profile.

---

## Workspaces

### POST /workspaces

Create a new workspace.

**Body:**

```json
{
  "name": "string (2-100 chars)",
  "description": "string (max 500)",
  "color": "string (hex color)",
  "icon": "string (emoji)",
  "isPublic": "boolean"
}
```

### GET /workspaces

List all workspaces for the authenticated user.

### GET /workspaces/search?q=query

Search workspaces by name.

### GET /workspaces/trash

Get soft-deleted workspaces.

### GET /workspaces/:id

Get workspace details with room count.

### PUT /workspaces/:id

Update workspace (owner only).

### DELETE /workspaces/:id

Soft-delete workspace (owner only).

### POST /workspaces/:id/restore

Restore deleted workspace.

### POST /workspaces/:id/invite-code

Regenerate invite code (owner only).

### POST /workspaces/join

**Body:** `{ "inviteCode": "string" }`

### POST /workspaces/:id/favorite

Toggle workspace favorite status.

### POST /workspaces/:id/archive

Archive workspace.

### POST /workspaces/:id/unarchive

Unarchive workspace.

---

## Members

### GET /workspaces/:id/members?page=1&limit=20&role=admin&status=active

Paginated member list with optional filters.

### GET /workspaces/:id/members/stats

Member statistics (total, by role, by status).

### POST /workspaces/:id/members

**Body:** `{ "userId": "string" }`

### PUT /workspaces/:id/members/:memberId/role

**Body:** `{ "role": "admin" | "member" }`

### PUT /workspaces/:id/members/:memberId/suspend

Suspend a member.

### PUT /workspaces/:id/members/:memberId/reactivate

Reactivate a suspended member.

### DELETE /workspaces/:id/members/:memberId

Remove member from workspace.

---

## Invites

### GET /workspaces/:id/invites?page=1&limit=20&status=pending

Paginated invite list.

### GET /workspaces/:id/invites/stats

Invite statistics.

### POST /workspaces/:id/invites

**Body:** `{ "email": "string", "role": "admin" | "member" }`

### DELETE /workspaces/:id/invites/:inviteId

Revoke an invite.

### GET /invites/pending

Get pending invites for current user.

### POST /invites/:token/accept

Accept an invite by token.

### POST /invites/:token/decline

Decline an invite by token.

---

## Rooms

### POST /rooms

**Body:** `{ "name": "string", "type": "whiteboard" | "code" | "document", "workspaceId": "string" }`

### GET /rooms

List rooms for authenticated user.

### GET /rooms/stats

Dashboard statistics (workspace count, room count, files shared, etc.).

### GET /rooms/:id

Get room details.

### PUT /rooms/:id

Update room (owner only).

### DELETE /rooms/:id

Soft-delete room (owner only).

### POST /rooms/:id/restore

Restore deleted room.

### POST /rooms/join

**Body:** `{ "inviteCode": "string" }`

---

## Chat

### GET /chat/:roomId?before=messageId&limit=50

Get paginated messages with cursor-based pagination.

### POST /chat/:roomId

**Body:** `{ "content": "string", "type": "text" | "emoji", "replyTo": "messageId?" }`

### PUT /chat/:messageId

Edit a message (owner only).

### DELETE /chat/:messageId

Delete a message (owner only).

### POST /chat/:roomId/seen

Mark all unseen messages as seen.

---

## Tasks

### GET /tasks?workspaceId=string&status=todo

List tasks with optional filters.

### GET /tasks/workspace/:workspaceId

List tasks by workspace.

### POST /tasks

**Body:**

```json
{
  "title": "string (required)",
  "description": "string",
  "workspace": "string (required)",
  "room": "string",
  "assignee": "userId",
  "status": "todo | in-progress | review | completed",
  "priority": "low | medium | high | urgent",
  "labels": ["string"],
  "dueDate": "ISO date"
}
```

### PUT /tasks/:id

Update task (partial update supported).

### DELETE /tasks/:id

Soft-delete task.

### POST /tasks/:id/comments

**Body:** `{ "content": "string" }`

### GET /tasks/:id/comments

List comments for a task.

---

## Files

### GET /files?workspaceId=string&folder=/docs

List files with optional folder filter.

### GET /files/folders?workspaceId=string

List distinct folder paths.

### POST /files

**Body:** `{ "name": "string", "mimeType": "string", "workspace": "string", "size": "number", "folder": "string" }`

### DELETE /files/:id

Soft-delete file.

### PUT /files/:id/rename

**Body:** `{ "name": "string" }`

---

## Documents (Code Editor)

### GET /documents/room/:roomId

List all documents for a room.

### GET /documents/:id

Get single document.

### POST /documents

**Body:** `{ "name": "string", "roomId": "string", "workspaceId": "string", "content": "string", "isFolder": "boolean" }`

### PUT /documents/:id

Update document content.

### PUT /documents/:id/rename

Rename document/folder (cascades to children for folders).

### DELETE /documents/:id

Soft-delete (cascades for folders).

---

## Whiteboard

### GET /whiteboards/:roomId

Get or auto-create whiteboard for a room.

### PUT /whiteboards/:roomId

**Body:** `{ "objects": [{ "id", "type", "x", "y", ... }] }`

---

## Activities

### GET /activities?entityType=workspace&limit=50

List activities for authenticated user.

### DELETE /activities/:id

Delete single activity.

### DELETE /activities/clear

Clear all activities for authenticated user.

---

## Notifications

### GET /notifications?limit=50

List notifications with unread count.

### PUT /notifications/read-all

Mark all notifications as read.

### PUT /notifications/:id/read

Mark single notification as read.

### DELETE /notifications/:id

Delete single notification.

### DELETE /notifications/clear

Clear all notifications.

---

## Socket.IO Events

### Whiteboard Events

| Event           | Direction       | Payload                        |
| --------------- | --------------- | ------------------------------ |
| `join-room`     | Client → Server | `{ roomId, userId, userName }` |
| `leave-room`    | Client → Server | `{ roomId }`                   |
| `draw`          | Bidirectional   | `{ roomId, object }`           |
| `update-object` | Bidirectional   | `{ roomId, object }`           |
| `delete-object` | Bidirectional   | `{ roomId, objectId }`         |
| `cursor-move`   | Bidirectional   | `{ roomId, userId, x, y }`     |
| `undo`          | Client → Server | `{ roomId }`                   |
| `redo`          | Client → Server | `{ roomId }`                   |

### Editor Events

| Event           | Direction       | Payload                                 |
| --------------- | --------------- | --------------------------------------- |
| `editor-join`   | Client → Server | `{ roomId, userId, userName }`          |
| `code-change`   | Bidirectional   | `{ roomId, fileName, content, cursor }` |
| `cursor-update` | Bidirectional   | `{ roomId, userId, cursor, fileName }`  |
| `save-document` | Client → Server | `{ roomId, fileName, content }`         |

### Chat Events

| Event          | Direction       | Payload                              |
| -------------- | --------------- | ------------------------------------ |
| `send-message` | Client → Server | `{ roomId, content, type, replyTo }` |
| `typing-start` | Client → Server | `{ roomId, userId, userName }`       |
| `typing-stop`  | Client → Server | `{ roomId, userId }`                 |
| `mark-seen`    | Client → Server | `{ roomId, userId }`                 |

## Error Response Format

```json
{
  "success": false,
  "message": "Error description"
}
```

## Success Response Format

```json
{
  "success": true,
  "message": "Optional message",
  "data": { ... }
}
```
