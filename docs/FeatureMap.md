# Feature Map

Complete map of every SyncSpace feature, its status, and where it lives. Status legend:

- ✅ **Complete** — implemented end-to-end (frontend + backend + realtime where applicable)
- 🟡 **Simulated** — fully functional UI with simulated backend (no real service integration)
- 🔜 **Future** — roadmap item (see `docs/FutureRoadmap.md`)

---

## Authentication

```
Authentication
├── ✅ Register        — passwordless (name + email) — client/src/pages/RegisterPage.tsx, POST /api/auth/register
├── ✅ Login           — email + password — client/src/pages/LoginPage.tsx, POST /api/auth/login
├── ✅ Demo Login      — one-click demo account — POST /api/auth/demo
├── ✅ Session Management
│   ├── ✅ JWT access token (client store) — client/src/features/auth/authSlice.ts
│   ├── ✅ Refresh token rotation (httpOnly cookie) — POST /api/auth/refresh-token, RefreshToken model
│   ├── ✅ Logout (revokes refresh token) — POST /api/auth/logout
│   └── ✅ /me profile restore on app boot
├── ✅ Password Recovery
│   ├── ✅ Forgot password — client/src/pages/ForgotPasswordPage.tsx, POST /api/auth/forgot-password
│   └── ✅ Reset password  — client/src/pages/ResetPasswordPage.tsx, POST /api/auth/reset-password
├── ✅ Route Protection — client/src/components/ProtectedRoute.tsx (redirects to /login)
└── ✅ Email verification — multi-step registration with verification token
```

## Workspace Management

```
Workspace
├── ✅ Workspaces list        — client/src/pages/dashboard/WorkspacesPage.tsx
├── ✅ Workspace detail       — client/src/pages/dashboard/WorkspaceDetailPage.tsx
├── ✅ Create (wizard)        — client/src/components/workspace/WorkspaceOnboarding.tsx
├── ✅ Update / soft delete   — workspaceSlice → workspaceService
├── ✅ Restore from trash     — /dashboard/trash
├── ✅ Favorite / Archive     — POST /api/workspaces/:id/favorite|archive|unarchive
├── ✅ Invite code join       — POST /api/workspaces/join
├── ✅ Member management      — /api/workspaces/:id/members (roles, suspend, reactivate)
├── ✅ Invite system          — /api/invites (create, pending, accept, decline, revoke)
├── ✅ Data layer             — workspace/member/invite/activity services call real REST APIs
└── 🔜 Public workspaces & discovery
```

## Rooms

```
Room
├── ✅ Create room            — client/src/components/common/CreateRoomModal.tsx (whiteboard / code / document)
├── ✅ Room list              — client/src/pages/dashboard/RoomsPage.tsx
├── ✅ Room detail hub        — client/src/pages/dashboard/RoomDetailPage.tsx
├── ✅ Join by invite code    — POST /api/rooms/join
├── ✅ Edit / delete / restore
├── ✅ Invite link + copy code
└── ✅ Room settings tab
```

## Collaboration (real-time)

```
Collaboration
├── ✅ Realtime Updates       — Socket.IO (whiteboardHandler + editorHandler), hooks in client/src/hooks/
├── ✅ Presence               — RoomPresence model; presence side panel; online/idle/typing states
├── ✅ Shared Editing (code)  — Monaco via CodeIDE; live cursors, selections, sync, undo
├── ✅ Live Cursors (whiteboard) — CursorsOverlay
├── ✅ Typing indicators      — chat typing events
├── ✅ Activity feed          — live activity stream in room
├── ✅ Activity timeline      — full audit trail per room
├── ✅ Global search (⌘K)     — client/src/components/collaboration/GlobalSearch.tsx + CommandPalette
└── 🟡 AI Assistant (Ctrl+Shift+A) — client/src/components/AISidebar.tsx (simulated responses, no LLM backend)
```

## Whiteboard

```
Whiteboard
├── ✅ Canvas rendering       — client/src/components/whiteboard/WhiteboardCanvas.tsx
├── ✅ Tools                  — Toolbar.tsx (pointer, hand, pencil, line, rectangle, circle, arrow, text, eraser)
├── ✅ Properties panel       — PropertiesPanel.tsx (color, width, opacity, font, fill)
├── ✅ Realtime sync          — useSocket hook + whiteboardHandler (draw/update/delete/undo/redo/clear)
├── ✅ Undo / Redo            — per-room history on server + client stacks
├── ✅ Autosave               — PUT /api/whiteboards/:roomId + socket save-whiteboard
├── ✅ Cursors overlay        — CursorsOverlay.tsx
└── ✅ Status bar             — StatusBar.tsx (connection, zoom, selection)
```

## Live Coding (Code Editor)

```
Live Coding
├── ✅ Monaco editor          — client/src/components/editor/MonacoEditor.tsx
├── ✅ File explorer          — CodeFileExplorer.tsx (create/rename/delete folders & files)
├── ✅ Live cursors/selections — LiveCursors.tsx via editor socket
├── ✅ Output & terminal panels — OutputPanel.tsx, TerminalPanel.tsx
├── ✅ Editor settings        — CodeSettings.tsx (font, theme, tab size, wrap, minimap)
├── ✅ Document CRUD          — documentService → /api/documents
└── ✅ Realtime sync          — useEditorSocket + editorHandler (code-change, sync-document)
```

## Team Chat

```
Team Chat
├── ✅ Message list           — client/src/components/chat/ChatPanel.tsx
├── ✅ Composer               — ChatInput.tsx (text, emoji, replies)
├── ✅ Edit / delete          — socket events + chatSlice
├── ✅ Typing indicators      — typing-start / typing-stop
├── ✅ Read receipts (seen)   — POST /api/chat/:roomId/seen
├── ✅ System messages        — join/leave events
└── ✅ Message history        — GET /api/chat/:roomId (paginated)
```

## Project Boards & Tasks

```
Project Board
├── ✅ Kanban board           — client/src/components/tasks/KanbanBoard.tsx (todo / in-progress / review / completed)
├── ✅ Drag-and-drop status   — updates task.status + order
├── ✅ Priorities             — low / medium / high / urgent
├── ✅ Labels & checklists
├── ✅ Assignees & due dates
└── ✅ Task comments          — /api/tasks/:id/comments (TaskComment model)
```

## Meetings

```
Meetings
├── ✅ Schedule meeting       — /dashboard/meetings + DashboardHome quick action
├── ✅ Meeting lifecycle      — start / join / end (status: scheduled → ongoing → completed)
├── ✅ Meeting stats          — GET /api/meetings/stats
├── ✅ Demo meeting room UI   — client/src/components/meeting/MeetingRoom.tsx (mic/cam/chat/notes controls)
└── 🟡 Real audio/video       — currently a simulated room (no WebRTC transmission)
```

## Files

```
Files
├── ✅ File manager page      — client/src/pages/dashboard/FileManagerPage.tsx
├── ✅ File explorer in room  — client/src/components/files/FileExplorer.tsx
├── ✅ Upload / rename / delete / download
├── ✅ Folder grouping        — GET /api/files/folders
└── 🟡 Storage backend        — files stored on server disk via multer, metadata in MongoDB
```

## Notifications

```
Notifications
├── ✅ Notification center    — client/src/pages/dashboard/NotificationsPage.tsx
├── ✅ Mark read / all read   — notificationSlice → /api/notifications
├── ✅ Clear all / delete
├── ✅ Unread badge           — TopNav + Sidebar counts
└── ✅ Realtime delivery      — socket `notification` event
```

## Activity & Insights

```
Activity & Insights
├── ✅ Activity page          — client/src/pages/dashboard/ActivityPage.tsx
├── ✅ Activity feed / timeline in rooms
├── ✅ Insights dashboard     — client/src/pages/dashboard/InsightsPage.tsx
├── ✅ Room & member & invite stats — /api/rooms/stats, members/stats, invites/stats
└── ✅ Dashboard home stats   — animated counters, growth trends
```

## Marketing Pages

```
Marketing
├── ✅ Landing page           — client/src/pages/LandingPage.tsx (hero, features, how-it-works, FAQ, CTA)
├── ✅ Features page          — client/src/pages/FeaturesPage.tsx (/features)
├── ✅ About page             — client/src/pages/AboutPage.tsx (/about)
├── ✅ FAQ section            — anchor #faq on the landing page
└── ✅ 404 page               — branded NotFound in App.tsx
```

## Settings & Profile

```
Settings & Profile
├── ✅ Settings page          — client/src/pages/dashboard/SettingsPage.tsx (account, appearance, notifications, sessions)
├── ✅ Profile page           — client/src/pages/dashboard/ProfilePage.tsx
├── ✅ Contribution score     — GET /api/profile/contributions (real score from user actions)
├── ✅ Badges & levels        — earned from creating workspaces, rooms, tasks, meetings, files
└── ✅ Theme context          — client/src/context/ThemeContext.tsx (dark theme system-wide)
```

## Trash & Shared

```
Trash & Shared
├── ✅ Trash page             — client/src/pages/dashboard/TrashPage.tsx (soft-deleted workspaces & rooms, restore)
├── ✅ Shared with me         — client/src/pages/dashboard/SharedWithMePage.tsx
└── ✅ Pending invites        — accept/decline from shared page
```

---

## Summary

| Area | Status |
|---|---|
| Authentication | ✅ Complete |
| Workspaces & membership | ✅ Complete |
| Rooms | ✅ Complete |
| Real-time collaboration | ✅ Complete |
| Whiteboard | ✅ Complete |
| Live coding | ✅ Complete |
| Team chat | ✅ Complete |
| Tasks / Kanban | ✅ Complete |
| Meetings | ✅ Scheduling complete, room UI simulated |
| Files | ✅ Complete |
| Notifications | ✅ Complete |
| Activity & Insights | ✅ Complete |
| Marketing pages | ✅ Complete |
| Settings & Profile | ✅ Complete |
| AI Assistant | 🟡 Simulated (no LLM backend) |
