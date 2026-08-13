# Components

Complete inventory of every component in the SyncSpace client, grouped by folder. Each entry lists the component name, location, purpose, and the consumers that use it.

Audit note: a scripted scan confirms **no orphan components** — every component is imported by at least one page, layout, or other component.

---

## Layout & Shell

| Component | Location | Purpose | Used by |
|---|---|---|---|
| DashboardLayout | `components/layout/DashboardLayout.tsx` | App shell for `/dashboard/*` (Sidebar + TopNav + outlet + AI sidebar) | App |
| Sidebar | `components/layout/Sidebar.tsx` | Primary navigation (main + bottom nav, profile dropdown, collapse) | DashboardLayout, RoomDetailPage |
| TopNav | `components/layout/TopNav.tsx` | Top bar with search, notifications, user menu | DashboardLayout |
| AuthLayout | `components/AuthLayout.tsx` | Centered branded shell for auth pages | RegisterPage, LoginPage, ResetPasswordPage, ForgotPasswordPage |
| ProtectedRoute | `components/ProtectedRoute.tsx` | Redirects unauthenticated users to `/login` | App |
| CommandPalette | `components/CommandPalette.tsx` | Global ⌘K command/search palette | App |
| AISidebar | `components/AISidebar.tsx` | AI assistant chat drawer (Ctrl+Shift+A) | DashboardLayout |

## Branding / Logo

| Component | Location | Purpose | Used by |
|---|---|---|---|
| LogoMark | `components/logo/LogoMark.tsx` | Static geometric "S" brand mark | LandingPage, AboutPage, FeaturesPage, LoadingScreen, AnimatedLogo, WorkspaceOnboarding, Sidebar, App |
| AnimatedLogo | `components/logo/AnimatedLogo.tsx` | Draw-on animation of the logo | LandingPage, AboutPage, LoadingScreen |
| LoadingScreen | `components/logo/LoadingScreen.tsx` | Full-screen intro/loading overlay on first visit | App |

## Common UI Primitives

| Component | Location | Purpose | Used by |
|---|---|---|---|
| Modal | `components/common/Modal.tsx` | Reusable modal dialog wrapper | RoomsPage, DashboardHome, RoomDetailPage, WorkspaceDetailPage, MeetingsPage, InviteModal, ConfirmDialog, CreateRoomModal |
| ConfirmDialog | `components/common/ConfirmDialog.tsx` | Confirmation dialog with danger styling | RoomsPage, RoomDetailPage, WorkspacesPage, WorkspaceDetailPage, FileExplorer |
| CreateRoomModal | `components/common/CreateRoomModal.tsx` | Create whiteboard/code/document room | RoomsPage, DashboardHome, WorkspaceDetailPage |
| Spinner | `components/common/Spinner.tsx` | Loading spinner (sm/md/lg) | RegisterPage, RoomsPage, DashboardHome, WorkspacesPage, MeetingsPage, LoginPage, ResetPasswordPage, ForgotPasswordPage, ProtectedRoute, ConfirmDialog, CreateRoomModal |
| Skeleton | `components/common/Skeleton.tsx` | Card skeleton placeholders | RoomsPage, DashboardHome, SharedWithMePage, WorkspacesPage, WorkspaceDetailPage, MeetingsPage |
| EmptyState | `components/common/EmptyState.tsx` | Empty list placeholder with icon/action | TrashPage, RoomsPage, SharedWithMePage, WorkspacesPage, MeetingsPage |
| ErrorMessage | `components/common/ErrorMessage.tsx` | Form/inline error message | RegisterPage, LoginPage, ResetPasswordPage, ForgotPasswordPage |
| ErrorBoundary | `components/common/ErrorBoundary.tsx` | React error boundary fallback | App |
| Toast | `components/common/Toast.tsx` | Toast notifications + `useToast` hook/provider | ActivityPage, TrashPage, RoomsPage, DashboardHome, RoomDetailPage, ProfilePage, NotificationsPage, WorkspacesPage, SettingsPage, FileManagerPage, WorkspaceDetailPage, MeetingsPage, WhiteboardPage, MeetingRoom, InviteModal, FileExplorer, TopNav, CodeIDE, MonacoEditor, App |
| Avatar | `components/common/Avatar.tsx` | User avatar (initials/image) | KanbanBoard, WorkspaceMembers, PresenceSidebar |
| Dropdown | `components/common/Dropdown.tsx` | Generic dropdown menu | FileExplorer |
| Toggle | `components/common/Toggle.tsx` | Switch control | WorkspaceDetailPage |

## Collaboration

| Component | Location | Purpose | Used by |
|---|---|---|---|
| RoomLayout | `components/collaboration/RoomLayout.tsx` | Room header + tabbed layout (chat/whiteboard/code/files/members/activity/tasks/settings) | RoomDetailPage |
| PresenceSidebar | `components/collaboration/PresenceSidebar.tsx` | Online users list with activity status | RoomDetailPage |
| ActivityFeed | `components/collaboration/ActivityFeed.tsx` | Compact live activity stream | RoomDetailPage |
| ActivityTimeline | `components/collaboration/ActivityTimeline.tsx` | Full activity timeline for a room | RoomDetailPage |
| GlobalSearch | `components/collaboration/GlobalSearch.tsx` | Search across workspace entities (⌘K) | RoomDetailPage |
| InviteModal | `components/collaboration/InviteModal.tsx` | Share invite code / invite members | DashboardHome, RoomDetailPage |
| WorkspaceMembers | `components/collaboration/WorkspaceMembers.tsx` | Member list with role/status management | RoomDetailPage |

## Chat

| Component | Location | Purpose | Used by |
|---|---|---|---|
| ChatPanel | `components/chat/ChatPanel.tsx` | Full chat UI (history, typing, seen) | RoomDetailPage |
| ChatInput | `components/chat/ChatInput.tsx` | Message composer (emoji, reply) | ChatPanel |
| ChatMessageItem | `components/chat/ChatMessageItem.tsx` | Single message bubble with actions | ChatPanel |

## Whiteboard

| Component | Location | Purpose | Used by |
|---|---|---|---|
| WhiteboardCanvas | `components/whiteboard/WhiteboardCanvas.tsx` | Canvas rendering + interaction layer | WhiteboardPage |
| Toolbar | `components/whiteboard/Toolbar.tsx` | Tool selection (pointer/pencil/shapes/text/eraser) | WhiteboardPage |
| PropertiesPanel | `components/whiteboard/PropertiesPanel.tsx` | Stroke/fill/width/opacity/font controls | WhiteboardPage |
| CursorsOverlay | `components/whiteboard/CursorsOverlay.tsx` | Remote cursor rendering | WhiteboardPage |
| StatusBar | `components/whiteboard/StatusBar.tsx` | Connection, zoom, selection status | WhiteboardPage |

## Editor (Live Coding)

| Component | Location | Purpose | Used by |
|---|---|---|---|
| CodeIDE | `components/editor/CodeIDE.tsx` | Full collaborative IDE (explorer + editor + output + terminal + cursors) | RoomDetailPage |
| CodeFileExplorer | `components/editor/CodeFileExplorer.tsx` | Code file/folder tree with CRUD | CodeIDE |
| MonacoEditor | `components/editor/MonacoEditor.tsx` | Monaco wrapper with theme/settings | CodeIDE |
| LiveCursors | `components/editor/LiveCursors.tsx` | Remote cursors & selections overlay | CodeIDE |
| OutputPanel | `components/editor/OutputPanel.tsx` | Compile/run output tabs | CodeIDE |
| TerminalPanel | `components/editor/TerminalPanel.tsx` | Simulated terminal | CodeIDE |
| CodeSettings | `components/editor/CodeSettings.tsx` | Editor preferences panel | CodeIDE |

## Files

| Component | Location | Purpose | Used by |
|---|---|---|---|
| FileExplorer | `components/files/FileExplorer.tsx` | Workspace file browser (folders, upload, rename, delete) | RoomDetailPage, CodeIDE |

## Tasks

| Component | Location | Purpose | Used by |
|---|---|---|---|
| KanbanBoard | `components/tasks/KanbanBoard.tsx` | Drag-and-drop board with priorities/labels/checklists | RoomDetailPage |

## Meetings

| Component | Location | Purpose | Used by |
|---|---|---|---|
| MeetingRoom | `components/meeting/MeetingRoom.tsx` | Meeting room UI (simulated mic/cam/chat/notes) | MeetingsPage |

## Workspace

| Component | Location | Purpose | Used by |
|---|---|---|---|
| WorkspaceCard | `components/workspace/WorkspaceCard.tsx` | Workspace summary card | WorkspacesPage |
| WorkspaceOnboarding | `components/workspace/WorkspaceOnboarding.tsx` | Create-workspace wizard (branded) | DashboardHome, WorkspacesPage |

## Shared / Utility

| Component | Location | Purpose | Used by |
|---|---|---|---|
| Icons | `components/Icons.tsx` | Central SVG icon set (no external icon lib) | ActivityPage, TrashPage, RoomsPage, DashboardHome, SharedWithMePage, ProfilePage, NotificationsPage, WorkspacesPage, SettingsPage, WorkspaceDetailPage, MeetingsPage, KanbanBoard, MeetingRoom, FileExplorer, CreateRoomModal, Modal, Toast, WorkspaceCard, Sidebar, TopNav |

---

## Summary

- **Total components**: 48
- **Orphan components**: 0
- **Pages that consume components**: all 15 dashboard/marketing/auth pages wired via App routes
- **Icon strategy**: single internal `Icons.tsx` (no third-party icon dependency)
- **Realtime consumers**: RoomDetailPage (collab hub), WhiteboardPage, MeetingsPage via socket hooks
