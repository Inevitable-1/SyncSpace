# SyncSpace API Endpoint Inventory

> Generated: 2026-08-20 | Base URL: `http://localhost:5000/api`

## Legend

- **Auth**: JWT Bearer token required
- **Public**: No authentication required
- **Rate Limited**: Subject to rate limiting (auth: 20/15min, API: 200/15min)
- **Validated**: express-validator middleware applied

---

## 1. Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Public | API root - returns status and version |
| `GET` | `/api/health` | Public | Health check - returns status and timestamp |

---

## 2. Auth (`/api/auth`)

| Method | Endpoint | Auth | Validated | Description |
|--------|----------|------|-----------|-------------|
| `POST` | `/auth/register` | Public | Yes | Register - collect name+email, send verification |
| `GET` | `/auth/verify-email/:token` | Public | No | Verify email token (returns user details) |
| `POST` | `/auth/set-password` | Public | Yes | Set password after email verification |
| `POST` | `/auth/resend-verification` | Public | Yes | Resend verification email |
| `POST` | `/auth/login` | Public | Yes | Login with email+password, returns JWT |
| `POST` | `/auth/demo` | Public | No | Demo login with pre-built account |
| `POST` | `/auth/refresh-token` | Public | No | Rotate refresh token, issue new access token |
| `POST` | `/auth/logout` | Public | No | Delete refresh token, clear cookie |
| `POST` | `/auth/forgot-password` | Public | Yes | Send password reset email |
| `POST` | `/auth/reset-password` | Public | Yes | Reset password with token |
| `GET` | `/auth/me` | Auth | No | Get current authenticated user |

---

## 3. Profile (`/api/profile`)

| Method | Endpoint | Auth | Validated | Description |
|--------|----------|------|-----------|-------------|
| `GET` | `/profile` | Auth | No | Get current user profile |
| `PUT` | `/profile` | Auth | Yes | Update profile (name, avatar, bio, coverImage) |
| `DELETE` | `/profile` | Auth | No | Delete account and all memberships |
| `PUT` | `/profile/password` | Auth | Yes | Change password (requires current password) |
| `GET` | `/profile/contributions` | Auth | No | Get gamification score and badges |
| `GET` | `/profile/heatmap` | Auth | No | Get 12-month activity heatmap data |
| `GET` | `/profile/calendar` | Auth | No | Get monthly calendar with activity breakdown |

---

## 4. Workspaces (`/api/workspaces`)

| Method | Endpoint | Auth | Validated | Description |
|--------|----------|------|-----------|-------------|
| `POST` | `/workspaces` | Auth | Yes | Create workspace |
| `GET` | `/workspaces` | Auth | No | List user's workspaces |
| `GET` | `/workspaces/search` | Auth | No | Search workspaces by name |
| `GET` | `/workspaces/trash` | Auth | No | Get soft-deleted workspaces and rooms |
| `GET` | `/workspaces/:id` | Auth | No | Get workspace by ID with room count |
| `PUT` | `/workspaces/:id` | Auth | Yes | Update workspace (owner only) |
| `DELETE` | `/workspaces/:id` | Auth | No | Soft-delete workspace (owner only) |
| `POST` | `/workspaces/:id/restore` | Auth | No | Restore deleted workspace (owner only) |
| `POST` | `/workspaces/:id/favorite` | Auth | No | Toggle workspace favorite |
| `POST` | `/workspaces/:id/archive` | Auth | No | Archive workspace (owner only) |
| `POST` | `/workspaces/:id/unarchive` | Auth | No | Unarchive workspace (owner only) |
| `POST` | `/workspaces/:id/invite-code` | Auth | No | Regenerate invite code (owner only) |
| `POST` | `/workspaces/:id/invite` | Auth | Yes | Invite user by email |
| `POST` | `/workspaces/join` | Auth | No | Join workspace by invite code |
| `GET` | `/workspaces/:id/rooms` | Auth | No | List rooms in workspace |
| `GET` | `/workspaces/:id/meetings` | Auth | No | List meetings in workspace |

---

## 5. Rooms (`/api/rooms`)

| Method | Endpoint | Auth | Validated | Description |
|--------|----------|------|-----------|-------------|
| `GET` | `/rooms/stats` | Auth | No | Get room statistics with 30-day growth |
| `POST` | `/rooms` | Auth | Yes | Create room (whiteboard/code/document) |
| `GET` | `/rooms` | Auth | No | List rooms (optional workspace filter) |
| `GET` | `/rooms/:id` | Auth | No | Get room by ID |
| `PUT` | `/rooms/:id` | Auth | Yes | Update room (owner only) |
| `DELETE` | `/rooms/:id` | Auth | No | Soft-delete room (owner only) |
| `POST` | `/rooms/:id/restore` | Auth | No | Restore deleted room (owner only) |
| `GET` | `/rooms/:id/invite-link` | Auth | No | Get room invite code |
| `POST` | `/rooms/join` | Auth | No | Join room by invite code |

---

## 6. Tasks (`/api/tasks`)

| Method | Endpoint | Auth | Validated | Description |
|--------|----------|------|-----------|-------------|
| `GET` | `/tasks/workspace/:workspaceId` | Auth | No | List tasks by workspace (path param) |
| `GET` | `/tasks` | Auth | No | List tasks (query: workspaceId, status) |
| `GET` | `/tasks/:id` | Auth | No | Get task by ID |
| `POST` | `/tasks` | Auth | Yes | Create task (title + workspace required) |
| `PUT` | `/tasks/:id` | Auth | No | Update task |
| `DELETE` | `/tasks/:id` | Auth | No | Soft-delete task |
| `POST` | `/tasks/:id/comments` | Auth | Yes | Add comment to task |
| `GET` | `/tasks/:id/comments` | Auth | No | List task comments |

---

## 7. Files (`/api/files`)

| Method | Endpoint | Auth | Validated | Description |
|--------|----------|------|-----------|-------------|
| `GET` | `/files/folders` | Auth | No | List distinct folder paths for workspace |
| `GET` | `/files` | Auth | No | List files (query: workspaceId, folder, search) |
| `POST` | `/files` | Auth | No | Upload file (multipart/form-data, 50MB max) |
| `POST` | `/files/avatar` | Auth | No | Upload user avatar image |
| `POST` | `/files/cover` | Auth | No | Upload user cover image |
| `GET` | `/files/:id/download` | Auth | No | Download file as attachment |
| `PUT` | `/files/:id/rename` | Auth | Yes | Rename file |
| `DELETE` | `/files/:id` | Auth | No | Soft-delete file |

---

## 8. Meetings (`/api/meetings`)

| Method | Endpoint | Auth | Validated | Description |
|--------|----------|------|-----------|-------------|
| `GET` | `/meetings/stats` | Auth | No | Get meeting statistics (total/upcoming/ongoing/completed) |
| `GET` | `/meetings` | Auth | No | List meetings (optional workspace filter) |
| `GET` | `/meetings/:id` | Auth | No | Get meeting by ID |
| `POST` | `/meetings` | Auth | No | Create meeting with participants |
| `PUT` | `/meetings/:id` | Auth | No | Update meeting (host only) |
| `DELETE` | `/meetings/:id` | Auth | No | Soft-delete meeting (host only) |
| `POST` | `/meetings/:id/start` | Auth | No | Start meeting (host only) |
| `POST` | `/meetings/:id/end` | Auth | No | End meeting (host only) |
| `POST` | `/meetings/:id/join` | Auth | No | Join meeting as participant |

---

## 9. Chat (`/api/chat`)

| Method | Endpoint | Auth | Validated | Description |
|--------|----------|------|-----------|-------------|
| `GET` | `/chat/:roomId` | Auth | No | Get messages (cursor pagination, max 100) |
| `POST` | `/chat/:roomId` | Auth | Yes | Send message (text/emoji/system) |
| `PUT` | `/chat/:messageId` | Auth | Yes | Edit message (sender only) |
| `DELETE` | `/chat/:messageId` | Auth | No | Soft-delete message (sender only) |
| `POST` | `/chat/:roomId/seen` | Auth | No | Mark messages as seen |

---

## 10. Whiteboards (`/api/whiteboards`)

| Method | Endpoint | Auth | Validated | Description |
|--------|----------|------|-----------|-------------|
| `GET` | `/whiteboards/:roomId` | Auth | No | Get whiteboard state (auto-creates if missing) |
| `PUT` | `/whiteboards/:roomId` | Auth | No | Save whiteboard objects |
| `POST` | `/whiteboards/:roomId/image` | Auth | No | Upload image for whiteboard (multipart) |

---

## 11. Documents (`/api/documents`)

| Method | Endpoint | Auth | Validated | Description |
|--------|----------|------|-----------|-------------|
| `GET` | `/documents/room/:roomId` | Auth | No | List documents in room (sorted by path) |
| `GET` | `/documents/:id` | Auth | No | Get document by ID |
| `POST` | `/documents` | Auth | Yes | Create document or folder |
| `PUT` | `/documents/:id` | Auth | Yes | Update document content/name/language |
| `PUT` | `/documents/:id/rename` | Auth | Yes | Rename document/folder (updates children) |
| `DELETE` | `/documents/:id` | Auth | No | Soft-delete (recursive for folders) |

---

## 12. Code Runner (`/api/code/run`)

| Method | Endpoint | Auth | Validated | Description |
|--------|----------|------|-----------|-------------|
| `POST` | `/code/run` | Auth | Yes | Execute code (Java/Python/C/C++, 10s timeout) |

---

## 13. Members (`/api/workspaces/:id/members`)

| Method | Endpoint | Auth | Validated | Description |
|--------|----------|------|-----------|-------------|
| `GET` | `/workspaces/:id/members` | Auth | Yes | List members (paginated, filterable) |
| `GET` | `/workspaces/:id/members/stats` | Auth | No | Get member statistics |
| `POST` | `/workspaces/:id/members` | Auth | Yes | Add member to workspace |
| `PUT` | `/workspaces/:id/members/:memberId/role` | Auth | Yes | Update member role |
| `PUT` | `/workspaces/:id/members/:memberId/suspend` | Auth | No | Suspend member |
| `PUT` | `/workspaces/:id/members/:memberId/reactivate` | Auth | No | Reactivate suspended member |
| `DELETE` | `/workspaces/:id/members/:memberId` | Auth | No | Remove member from workspace |

---

## 14. Invites

### Workspace-scoped (`/api/workspaces/:id/invites`)

| Method | Endpoint | Auth | Validated | Description |
|--------|----------|------|-----------|-------------|
| `GET` | `/workspaces/:id/invites` | Auth | Yes | List invites (paginated, filterable) |
| `GET` | `/workspaces/:id/invites/stats` | Auth | No | Get invite statistics |
| `GET` | `/workspaces/:id/invites/pending` | Auth | No | List pending invites for current user |
| `POST` | `/workspaces/:id/invites` | Auth | Yes | Create invite by email |
| `POST` | `/workspaces/:id/invites/:token/accept` | Auth | No | Accept invite by token |
| `POST` | `/workspaces/:id/invites/:token/decline` | Auth | No | Decline invite by token |
| `DELETE` | `/workspaces/:id/invites/:inviteId` | Auth | No | Revoke invite (owner only) |

### Global (`/api/invites`)

| Method | Endpoint | Auth | Validated | Description |
|--------|----------|------|-----------|-------------|
| `GET` | `/invites` | Auth | No | List all pending invites for current user |
| `POST` | `/invites/:token/accept` | Auth | No | Accept invite by token (global) |
| `POST` | `/invites/:token/decline` | Auth | No | Decline invite by token (global) |

---

## 15. Notifications (`/api/notifications`)

| Method | Endpoint | Auth | Validated | Description |
|--------|----------|------|-----------|-------------|
| `GET` | `/notifications` | Auth | No | List notifications with unread count |
| `PUT` | `/notifications/read-all` | Auth | No | Mark all notifications as read |
| `DELETE` | `/notifications/clear` | Auth | No | Clear all notifications |
| `PUT` | `/notifications/:id/read` | Auth | No | Mark notification as read |
| `DELETE` | `/notifications/:id` | Auth | No | Delete notification |

---

## 16. Activities (`/api/activities`)

| Method | Endpoint | Auth | Validated | Description |
|--------|----------|------|-----------|-------------|
| `GET` | `/activities` | Auth | No | List activities (filterable, max 100) |
| `DELETE` | `/activities/clear` | Auth | No | Clear all activities |
| `DELETE` | `/activities/:id` | Auth | No | Delete single activity |

---

## 17. Dashboard (`/api/dashboard`)

| Method | Endpoint | Auth | Validated | Description |
|--------|----------|------|-----------|-------------|
| `GET` | `/dashboard` | Auth | No | Aggregated dashboard data |

---

## 18. Shared (`/api/shared`)

| Method | Endpoint | Auth | Validated | Description |
|--------|----------|------|-----------|-------------|
| `GET` | `/shared/workspaces` | Auth | No | Workspaces where user is member but not owner |
| `GET` | `/shared/rooms` | Auth | No | Rooms where user is participant but not owner |
| `GET` | `/shared/files` | Auth | No | Files uploaded by other users (max 50) |

---

## Total: 111 Endpoints

| Category | Count |
|----------|-------|
| Public (no auth) | 14 |
| Authenticated | 97 |
| With validation | 22 |
| File uploads (multipart) | 4 |
| Soft-delete capable | 15 |
| Paginated | 5 |

---

## WebSocket Events

### Whiteboard + Chat Namespace

| Event | Direction | Payload |
|-------|-----------|---------|
| `join-room` | Client→Server | `{ roomId, userName }` |
| `leave-room` | Client→Server | `{ roomId }` |
| `draw` | Client→Server | `{ roomId, object }` |
| `update-object` | Client→Server | `{ roomId, object }` |
| `delete-object` | Client→Server | `{ roomId, objectId }` |
| `cursor-move` | Client→Server | `{ roomId, x, y }` |
| `undo` | Client→Server | `{ roomId }` |
| `redo` | Client→Server | `{ roomId }` |
| `clear-canvas` | Client→Server | `{ roomId }` |
| `save-whiteboard` | Client→Server | `{ roomId }` |
| `send-message` | Client→Server | `{ roomId, content, type?, replyTo? }` |
| `edit-message` | Client→Server | `{ messageId, content, roomId }` |
| `delete-message` | Client→Server | `{ messageId, roomId }` |
| `typing-start` | Client→Server | `{ roomId }` |
| `typing-stop` | Client→Server | `{ roomId }` |
| `mark-seen` | Client→Server | `{ roomId }` |
| `update-activity` | Client→Server | `{ roomId, activity }` |
| `room-joined` | Server→Client | `{ presence: PresenceUser[] }` |
| `user-joined` | Server→Client | `{ presence: PresenceUser }` |
| `user-left` | Server→Client | `{ userId, userName }` |
| `receive-message` | Server→Client | `ChatMessage` |
| `message-edited` | Server→Client | `{ _id, content, edited, editedAt }` |
| `message-deleted` | Server→Client | `{ messageId }` |
| `user-typing` | Server→Client | `{ userId, userName, roomId }` |
| `user-stopped-typing` | Server→Client | `{ userId }` |
| `presence-updated` | Server→Client | `{ userId, currentActivity }` |
| `notification` | Server→Client | `Notification` |
| `activity` | Server→Client | `ActivityLog` |

### Code Editor Namespace

| Event | Direction | Payload |
|-------|-----------|---------|
| `code:join` | Client→Server | `{ roomId, userName, userId }` |
| `code:leave` | Client→Server | `{ roomId }` |
| `code:update` | Client→Server | `{ roomId, code, cursor? }` |
| `code:cursor` | Client→Server | `{ roomId, line, column }` |
| `code:language` | Client→Server | `{ roomId, language }` |
| `code:save` | Client→Server | `{ roomId, code, language }` |
| `code:joined` | Server→Client | `{ code, language, users: CodeUser[] }` |
| `code:user-joined` | Server→Client | `CodeUser` |
| `code:user-left` | Server→Client | `{ socketId }` |
| `code:update` | Server→Client | `{ socketId, code, cursor?, userName?, color? }` |
| `code:cursor` | Server→Client | `{ socketId, userName, color, line, column }` |
| `code:language` | Server→Client | `{ language }` |
| `code:saved` | Server→Client | `{ savedBy, timestamp }` |

---

## Missing Endpoint Recommendations

### High Priority (Frontend expects these)

| Issue | Endpoint | Status |
|-------|----------|--------|
| Response envelope inconsistency | Some controllers return `{ success, data }` others return flat objects | Should standardize |
| `GET /tasks` requires `workspaceId` query param | Frontend `taskService.getTasksByWorkspace` uses path param version | Both exist |
| `DELETE /rooms/:id` missing from OpenAPI | Controller exists, route exists, spec incomplete | Add to spec |

### Medium Priority (Nice to have)

| Recommendation | Description |
|----------------|-------------|
| `GET /rooms/:id/participants` | List current room participants (currently only via WebSocket) |
| `POST /rooms/:id/leave` | Leave a room (currently no HTTP endpoint) |
| `GET /workspaces/:id/invites/stats` | Missing from some routes |
| `GET /meetings/:id/participants` | List meeting participants |

### Low Priority (Future)

| Recommendation | Description |
|----------------|-------------|
| Bulk operations | Bulk task status update, bulk member add |
| Webhooks | Outbound webhooks for activity events |
| API versioning | `/api/v2/` prefix for breaking changes |
| API key auth | For external integrations |
