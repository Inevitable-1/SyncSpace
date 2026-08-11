# Changelog

All notable changes to SyncSpace are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Code Quality

- Removed dead code in the Kanban task modal (unused "Add Comment" form with a no-op Post button).
- Removed the unused `workspaceId` prop from `ChatPanel`.
- Removed the non-functional "Share" button from the room layout header.
- Wired chat typing indicators end-to-end: `useCollaborationSocket` `startTyping`/`stopTyping` now reach `ChatInput` via `ChatPanel`, so teammates actually see "…is typing…".

### UX & Validation

- Added a skeleton loading state to the "Shared with Me" page instead of flashing an empty state while data loads.
- Improved button consistency by replacing inline gradient buttons with the shared `btn-primary`/`btn-danger` styles in the file explorer, room layout header, and room detail page.
- Added inline, per-field validation with contextual error messages and error styling to the register, reset-password, login, and forgot-password forms.
- Server now returns a human-readable message for validation failures; the client surfaces the first field error instead of a generic "Validation failed".

## [1.0.0] — 2026-08-10

### Features

- **Real-time whiteboard**: drawing tools, shapes, text, undo/redo, live multi-user cursors via React Konva, with smooth 60fps rendering.
- **Collaborative code editor**: Monaco Editor with live cursors, multi-file tabs, file explorer, themes, and terminal/output panels.
- **Real-time chat**: messages, replies, emoji picker, typing indicators, seen status.
- **Kanban task board**: 4-column drag-and-drop with priorities, labels, due dates, and checklists.
- **Workspaces & rooms**: create, edit, delete, archive, favorite, search, and invite codes.
- **Member management**: roles (owner/admin/member), suspend, promote, demote.
- **Invite system**: email-based invitations with token expiry.
- **File manager**: upload/download, folders, rename, trash, and image previews.
- **Meetings**: schedule, join, and host meetings with a dedicated meeting room.
- **Dashboard**: stat cards, weekly activity charts, category insights, and workspace/room distribution.
- **Activity timeline**: filterable audit log of all actions.
- **Notifications**: real-time center with read/unread tracking.
- **Global search**: Cmd+K search across workspaces, rooms, members, and tasks.
- **Trash & Shared with Me**: restore deleted items and view items shared by others.
- **Auth flows**: register, login, JWT refresh-token rotation, forgot/reset password.
- **Demo mode**: fully offline demo experience with pre-populated data and guided onboarding.
- **Animated landing**: canvas-based intro scenes (brain, desk, notebook, mind-link).

### UI/UX

- Redesigned theme with light/dark mode via CSS variables.
- Responsive layouts with collapsible sidebar and mobile-friendly pages.
- Framer Motion transitions and micro-interactions.
- Skeleton loaders for all data views.

### Refactors & Cleanup

- Centralized demo data in `client/src/data/demoWorkspaces.ts`.
- Reorganized documentation into `docs/`.
- Removed dead files and unused code across the codebase.
- Added Prettier formatting, `lint`, `build`, and `typecheck` scripts for all workspaces.

## [0.9.0] — 2026-08-08

### Added

- Day 9 code-quality pass: UI consistency improvements, dedicated docs folder.
- Project architecture, progress, and review guide documents.

## [0.8.0] — 2026-08-07

### Added

- Day 8 cleanup and UI polish:
  - Removed dynamic import warning in `InviteModal`.
  - Removed unused props and Redux subscriptions.
  - Deleted dead files and directories.
  - Button press feedback, tooltip transitions, spinner and empty-state polish.
