export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isEmailVerified: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isDemo: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export type MemberRole = 'owner' | 'admin' | 'member';
export type MemberStatus = 'active' | 'invited' | 'suspended';
export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type InviteRole = 'admin' | 'member';

export interface Workspace {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isPublic: boolean;
  inviteCode: string;
  owner: User | string;
  members: (User | string)[];
  memberCount?: number;
  roomCount?: number;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  _id: string;
  userId: User;
  workspaceId: string;
  role: MemberRole;
  status: MemberStatus;
  invitedBy?: User;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invite {
  _id: string;
  email: string;
  workspaceId: string;
  invitedBy: User;
  role: InviteRole;
  status: InviteStatus;
  token: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Room {
  _id: string;
  name: string;
  type: 'whiteboard' | 'code' | 'document';
  workspace: Workspace | string;
  owner: string;
  inviteCode: string;
  isActive: boolean;
  participants: string[];
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  _id: string;
  user: User | string;
  action: string;
  entityType: 'workspace' | 'room' | 'member' | 'invite' | 'auth' | 'task' | 'file';
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  trashWorkspaces: Workspace[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
}

export interface MemberState {
  members: Member[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
}

export interface InviteState {
  invites: Invite[];
  pendingInvites: Invite[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
}

export interface RoomState {
  rooms: Room[];
  currentRoom: Room | null;
  trashRooms: Room[];
  isLoading: boolean;
  error: string | null;
}

export interface ActivityState {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entityType?: 'workspace' | 'room' | 'member' | 'invite' | 'activity';
  entityId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

export interface Stats {
  totalWorkspaces: number;
  totalRooms: number;
  filesShared: number;
  onlineMembers: number;
  activeSessions: number;
  recentActivity: number;
  projectsCreated: number;
  growth: {
    workspaces: number;
    rooms: number;
    members: number;
    activity: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export type ToolType =
  'pointer' | 'hand' | 'pencil' | 'line' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'eraser';

export interface WhiteboardObject {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
  text?: string;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  closed?: boolean;
  radiusX?: number;
  radiusY?: number;
  tension?: number;
  lineCap?: string;
  lineJoin?: string;
  [key: string]: unknown;
}

export interface WhiteboardUser {
  socketId: string;
  userId: string;
  userName: string;
  color: string;
  x?: number;
  y?: number;
}

export interface WhiteboardState {
  objects: WhiteboardObject[];
  selectedIds: string[];
  tool: ToolType;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
}

export interface ChatMessage {
  _id: string;
  room: string;
  sender: User | string;
  content: string;
  type: 'text' | 'emoji' | 'system';
  replyTo?: ChatMessage | string;
  edited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  seenBy: (User | string)[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  typingUsers: TypingUser[];
}

export interface TypingUser {
  userId: string;
  userName: string;
  roomId: string;
}

export interface PresenceUser {
  socketId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  status: 'online' | 'idle' | 'typing';
  currentActivity: string;
  joinedAt: string;
}

export interface PresenceState {
  onlineUsers: PresenceUser[];
  memberCount: number;
}

export interface ActivityLog {
  user: User | string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  createdAt: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed';

export interface Task {
  _id: string;
  title: string;
  description: string;
  workspace: string;
  room?: string;
  creator: User | string;
  assignee?: User | string;
  status: TaskStatus;
  priority: TaskPriority;
  labels: string[];
  dueDate?: string;
  checklist: { text: string; done: boolean }[];
  order: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  _id: string;
  task: string;
  author: User | string;
  content: string;
  edited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}

export interface UploadedFile {
  _id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  workspace: string;
  room?: string;
  folder: string;
  uploader: User | string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FileState {
  files: UploadedFile[];
  folders: string[];
  isLoading: boolean;
  error: string | null;
}

export interface SearchResult {
  type: 'task' | 'file' | 'message' | 'member' | 'workspace';
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

export interface CodeDocument {
  _id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  room: string;
  workspace: string;
  createdBy: User | string;
  lastEditedBy?: User | string;
  parentPath?: string;
  isFolder: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  versionTimestamps: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CodeEditorUser {
  socketId: string;
  userId: string;
  userName: string;
  color: string;
  cursor: { line: number; column: number } | null;
  selection: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  } | null;
  fileName: string;
}

export interface EditorCursor {
  socketId: string;
  userId: string;
  userName: string;
  color: string;
  cursor: { line: number; column: number };
  fileName: string;
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

export interface EditorSelection {
  socketId: string;
  userId: string;
  userName: string;
  color: string;
  selection: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  fileName: string;
}

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  theme: 'vs-dark' | 'vs' | 'hc-black';
  wordWrap: 'on' | 'off';
  autoSave: boolean;
  minimap: boolean;
  lineNumbers: boolean;
}

export interface EditorState {
  documents: CodeDocument[];
  currentFile: CodeDocument | null;
  openFiles: string[];
  recentlyOpened: string[];
  settings: EditorSettings;
  isLoading: boolean;
  error: string | null;
}

export interface TerminalEntry {
  id: string;
  type: 'command' | 'output' | 'error' | 'info';
  content: string;
  timestamp: string;
}

export interface OutputTab {
  id: string;
  label: string;
  count?: number;
}
