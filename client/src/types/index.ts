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
  entityType: 'workspace' | 'room' | 'member' | 'auth';
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
  entityType?: 'workspace' | 'room' | 'member' | 'activity';
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
