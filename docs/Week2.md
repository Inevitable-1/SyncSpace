# Week 2 — Collaboration Platform

> **Focus:** Turning the foundation into a real-time collaboration product.

## Goals

- Build the core collaboration modules: whiteboard, live code editor, chat and task boards.
- Introduce workspaces, rooms and role-based membership.
- Add real-time presence, notifications and activity tracking.
- Polish the UI into a coherent product experience.

## What was built

### Landing page

- A marketing landing page with hero, feature highlights and FAQ.
- Clear sign-in / sign-up flow with a one-click **demo experience** that falls back to offline demo data when the API is unavailable.

### Collaboration modules

- **Real-time Whiteboard** — React Konva canvas with drawing tools, shapes, text, undo/redo and multi-user cursors over Socket.IO.
- **Collaborative Code Editor** — Monaco Editor with live cursors, multi-file tabs, a file explorer and themes, synced via `code-change` socket events.
- **Team Chat** — message threads with replies, emoji, typing indicators and seen status.
- **Kanban Task Board** — 4-column drag-and-drop with priorities, labels, due dates and checklists.

### Workspace concepts

- **Workspaces** — create, edit, archive, trash/restore, favorite and search.
- **Rooms** — whiteboard, code and document room types scoped to a workspace.
- **Members & roles** — owner / admin / member with suspend, promote and demote flows.
- **Invites** — email-based invitations with expiring tokens and accept/decline actions.

### UI improvements

- Redux Toolkit slices for every domain (room, task, chat, editor, presence, notification, file, meeting, workspace).
- Skeleton loaders, empty states, toasts and a command palette (Ctrl/Cmd+K).
- Light/dark theme via CSS variables with a `ThemeContext`.

### Branding

- Early brand pass moving away from a generic app toward a SaaS product tone.
- Consistent spacing, color tokens and component behavior across pages.

## Deliverables

- 4 real-time collaboration modules.
- Complete workspace/room/member/invite management.
- Real-time presence, notifications and activity timeline.
- Global search across workspaces, rooms, members and tasks.

## Key decisions

- **Socket.IO for real-time** — room-scoped event channels for whiteboard, editor, chat and presence.
- **Demo-mode fallback layer** — every API service wraps a live call with a demo data fallback so the app is always explorable.
- **Redux for shared state** — a single source of truth across collaborative UI.
