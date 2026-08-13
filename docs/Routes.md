# Routes

Complete route map for SyncSpace — frontend (React Router), backend (Express), and realtime (Socket.IO).

- Frontend base URL: `http://localhost:5173`
- Backend API base URL: `http://localhost:5000/api`
- Socket URL: `http://localhost:5000` (from `VITE_SOCKET_URL`)
- Auth mechanism: `Authorization: Bearer <accessToken>` on all protected endpoints.

---

## Frontend Routes

### Public Routes

| Path | Page | File |
|---|---|---|
| `/` | Landing page | `client/src/pages/LandingPage.tsx` |
| `/features` | Features overview | `client/src/pages/FeaturesPage.tsx` |
| `/about` | About page | `client/src/pages/AboutPage.tsx` |
| `/login` | Login | `client/src/pages/LoginPage.tsx` |
| `/register` | Register | `client/src/pages/RegisterPage.tsx` |
| `/forgot-password` | Forgot password | `client/src/pages/ForgotPasswordPage.tsx` |
| `/reset-password` | Reset password | `client/src/pages/ResetPasswordPage.tsx` |
| `*` | 404 (branded) | inline in `client/src/App.tsx` |

### Protected Routes (wrapped in `ProtectedRoute`)

**Dashboard layout** — `client/src/components/layout/DashboardLayout.tsx`

| Path | Page | File |
|---|---|---|
| `/dashboard` | Home (stats, today's work, quick actions) | `pages/dashboard/DashboardHome.tsx` |
| `/dashboard/workspaces` | Workspaces list | `pages/dashboard/WorkspacesPage.tsx` |
| `/dashboard/workspaces/:id` | Workspace detail | `pages/dashboard/WorkspaceDetailPage.tsx` |
| `/dashboard/rooms` | Rooms list | `pages/dashboard/RoomsPage.tsx` |
| `/dashboard/rooms/:id` | Room detail (collaboration hub) | `pages/dashboard/RoomDetailPage.tsx` |
| `/dashboard/meetings` | Meetings | `pages/dashboard/MeetingsPage.tsx` |
| `/dashboard/shared` | Shared with me | `pages/dashboard/SharedWithMePage.tsx` |
| `/dashboard/activity` | Activity log | `pages/dashboard/ActivityPage.tsx` |
| `/dashboard/trash` | Trash | `pages/dashboard/TrashPage.tsx` |
| `/dashboard/notifications` | Notifications | `pages/dashboard/NotificationsPage.tsx` |
| `/dashboard/settings` | Settings | `pages/dashboard/SettingsPage.tsx` |
| `/dashboard/profile` | Profile | `pages/dashboard/ProfilePage.tsx` |
| `/dashboard/insights` | Insights | `pages/dashboard/InsightsPage.tsx` |
| `/dashboard/files` | File manager | `pages/dashboard/FileManagerPage.tsx` |

**Standalone**

| Path | Page | File |
|---|---|---|
| `/whiteboard/:roomId` | Collaborative whiteboard | `client/src/pages/WhiteboardPage.tsx` |

### Route Protection Summary

- **Public**: `/`, `/features`, `/about`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `*`
- **Protected (require authentication)**: everything under `/dashboard/**` and `/whiteboard/:roomId`
- **Redirects**: unauthenticated users → `/login` with `state.from` (return-to after login)

### Navigation Coverage

| Dashboard page | Sidebar link | Other entry points |
|---|---|---|
| Dashboard | Dashboard | logo, profile card |
| Workspaces | Workspaces | home widgets, quick actions |
| Rooms | Rooms | home widgets, room cards |
| Meetings | Meetings | home "Upcoming Meetings", quick action |
| Files | Files | home "Recent Files", quick action |
| Shared | Shared | pending invites |
| Insights | Insights | — |
| Activity | Activity | home "Recent Activity" |
| Notifications | Notifications (bottom) | home widgets, TopNav bell |
| Trash | Trash (bottom) | — |
| Settings | Settings (bottom) | profile dropdown |
| Profile | profile dropdown | — |
| Whiteboard | via room cards / "Open Whiteboard" | `/whiteboard/:roomId` |

✅ **No dashboard page is unreachable from the UI.**

---

## Backend Routes

All routes below are mounted in `server/src/app.ts`.

### Public Endpoints (no auth)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | health check |
| POST | `/api/auth/register` | register (passwordless) |
| POST | `/api/auth/login` | login |
| POST | `/api/auth/demo` | demo login |
| POST | `/api/auth/refresh-token` | refresh access token |
| POST | `/api/auth/logout` | logout (revoke refresh token) |
| POST | `/api/auth/forgot-password` | send reset email/token |
| POST | `/api/auth/reset-password` | reset password |

### Protected Endpoints (`authenticate` middleware)

**Auth**
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/auth/me` | current user profile |

**Workspaces** (`/api/workspaces`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/` | list my workspaces |
| POST | `/` | create workspace |
| GET | `/search` | search workspaces |
| GET | `/trash` | soft-deleted workspaces |
| GET | `/:id` | workspace detail |
| PUT | `/:id` | update workspace |
| DELETE | `/:id` | soft delete workspace |
| POST | `/:id/restore` | restore workspace |
| POST | `/:id/invite-code` | regenerate invite code |
| POST | `/:id/favorite` | toggle favorite |
| POST | `/:id/archive` | archive workspace |
| POST | `/:id/unarchive` | unarchive workspace |
| POST | `/join` | join by invite code |

**Workspace members** (`/api/workspaces/:id/members`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/` | list members |
| GET | `/stats` | member stats |
| POST | `/` | add member |
| PUT | `/:memberId/role` | change role |
| PUT | `/:memberId/suspend` | suspend member |
| PUT | `/:memberId/reactivate` | reactivate member |
| DELETE | `/:memberId` | remove member |

**Invites** (`/api/invites` and `/api/workspaces/:id/invites`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/` | list invites |
| GET | `/pending` | pending invites |
| GET | `/stats` | invite stats |
| POST | `/` (under `:id/invites`) | create invite |
| POST | `/:token/accept` | accept invite |
| POST | `/:token/decline` | decline invite |
| DELETE | `/:inviteId` | revoke invite |

> Note: the invite router is intentionally mounted twice (`/api/invites` and `/api/workspaces/:id/invites`) so that scoped creation and user-scoped listing share one handler set.

**Rooms** (`/api/rooms`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/` | list rooms |
| POST | `/` | create room |
| GET | `/stats` | room stats |
| GET | `/:id` | room detail |
| PUT | `/:id` | update room |
| DELETE | `/:id` | soft delete room |
| POST | `/:id/restore` | restore room |
| GET | `/:id/invite-link` | get invite link |
| POST | `/join` | join by code |

**Chat** (`/api/chat`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/:roomId` | message history |
| POST | `/:roomId` | send message |
| PUT | `/:messageId` | edit message |
| DELETE | `/:messageId` | delete message |
| POST | `/:roomId/seen` | mark seen |

**Whiteboards** (`/api/whiteboards`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/:roomId` | get (auto-create) whiteboard |
| PUT | `/:roomId` | save whiteboard objects |

**Code documents** (`/api/documents`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/room/:roomId` | documents for room |
| GET | `/:id` | document detail |
| POST | `/` | create document/folder |
| PUT | `/:id` | update content |
| PUT | `/:id/rename` | rename |
| DELETE | `/:id` | delete |

**Tasks** (`/api/tasks`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/` | list tasks |
| GET | `/workspace/:workspaceId` | tasks by workspace |
| POST | `/` | create task |
| PUT | `/:id` | update task |
| DELETE | `/:id` | delete task |
| GET | `/:id/comments` | task comments |
| POST | `/:id/comments` | add comment |

**Files** (`/api/files`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/` | list files |
| GET | `/folders` | folder list |
| POST | `/` | upload (multipart) |
| GET | `/:id/download` | download |
| PUT | `/:id/rename` | rename |
| DELETE | `/:id` | delete |

**Meetings** (`/api/meetings`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/` | list meetings |
| GET | `/stats` | meeting stats |
| GET | `/:id` | meeting detail |
| POST | `/` | create meeting |
| PUT | `/:id` | update meeting |
| DELETE | `/:id` | delete meeting |
| POST | `/:id/start` | start meeting |
| POST | `/:id/end` | end meeting |
| POST | `/:id/join` | join meeting |

**Notifications** (`/api/notifications`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/` | list notifications |
| PUT | `/read-all` | mark all read |
| PUT | `/:id/read` | mark one read |
| DELETE | `/clear` | clear all |
| DELETE | `/:id` | delete one |

**Activities** (`/api/activities`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/` | list activities |
| DELETE | `/:id` | delete one |
| DELETE | `/clear` | clear all |

### Backend Route Coverage Summary

- ✅ 17 routers mounted in `server/src/app.ts`
- ✅ Every protected router applies `authenticate` via `router.use(...)`
- ✅ No mounted-but-unreachable router (each is registered in `app.ts`)
- ✅ No duplicate conflicting paths (invite double-mount is intentional and scoped)
- 🟡 Demo-backed frontend services (workspace/room/meeting/file/member/activity) don't currently call these REST endpoints; the endpoints are implemented, validated, and documented in `docs/API_REFERENCE.md`.

---

## Realtime (Socket.IO) Events

Registered in `server/src/socket/whiteboardHandler.ts` and `editorHandler.ts`. Clients connect via hooks in `client/src/hooks/`.

### Whiteboard / Room / Chat / Presence (`whiteboardHandler.ts`)

| Event | Direction | Purpose |
|---|---|---|
| `join-room` | client→server | join room, returns presence + state |
| `leave-room` | client→server | leave room |
| `draw` | client→server / broadcast | add whiteboard object |
| `update-object` | client→server / broadcast | update whiteboard object |
| `delete-object` | client→server / broadcast | delete whiteboard object |
| `cursor-move` | client→server / broadcast | whiteboard cursor |
| `undo` / `redo` | client→server / broadcast | whiteboard history |
| `clear-canvas` | client→server / broadcast | clear whiteboard |
| `save-whiteboard` | client→server | persist to DB |
| `send-message` | client→server / broadcast | chat message |
| `edit-message` / `delete-message` | client→server / broadcast | chat edit/delete |
| `typing-start` / `typing-stop` | client→server / broadcast | typing indicators |
| `mark-seen` | client→server | read receipts |
| `update-activity` | client→server / broadcast | presence activity |
| `user-joined` / `user-left` / `presence-updated` | server→client | presence updates |
| `receive-message` / `message-edited` / `message-deleted` | server→client | chat delivery |
| `room-joined` | server→client | presence snapshot |
| `notification` | server→client | realtime notifications |
| `activity` | server→client | realtime activity feed |

### Code Editor (`editorHandler.ts`)

| Event | Direction | Purpose |
|---|---|---|
| `editor-join` / `editor-leave` | client→server | join/leave editor room |
| `editor-user-joined` / `editor-user-left` | server→client | editor presence |
| `code-change` | client→server / broadcast | live document content sync |
| `cursor-update` | client→server / broadcast | editor cursor/selection |
| `sync-document` | client→server | force document sync |
| `save-document` | client→server / broadcast | persist + broadcast |

Client hooks: `useSocket.ts` (whiteboard), `useCollaborationSocket.ts` (room/chat/presence), `useEditorSocket.ts` (editor).
