import type {
  User,
  Workspace,
  Room,
  Meeting,
  Member,
  UploadedFile,
  Activity,
  MeetingStats,
} from '../types';

const now = Date.now();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const hoursAgo = (h: number) => new Date(now - h * HOUR).toISOString();
const hoursFromNow = (h: number) => new Date(now + h * HOUR).toISOString();
const daysAgo = (d: number) => new Date(now - d * DAY).toISOString();
const daysFromNow = (d: number) => new Date(now + d * DAY).toISOString();

export const demoUser: User = {
  id: 'demo-user',
  name: 'Manoj Kumar',
  email: 'mr.manojmanu05@gmail.com',
  avatar: 'M',
  isEmailVerified: true,
};

export const demoUsers: User[] = [
  demoUser,
  {
    id: 'u-priya',
    name: 'Priya Sharma',
    email: 'priya@syncspace.dev',
    avatar: 'PS',
    isEmailVerified: true,
  },
  {
    id: 'u-ravi',
    name: 'Ravi Patel',
    email: 'ravi@syncspace.dev',
    avatar: 'RP',
    isEmailVerified: true,
  },
  {
    id: 'u-alex',
    name: 'Alex Johnson',
    email: 'alex@syncspace.dev',
    avatar: 'AJ',
    isEmailVerified: true,
  },
  {
    id: 'u-sarah',
    name: 'Sarah Chen',
    email: 'sarah@syncspace.dev',
    avatar: 'SC',
    isEmailVerified: true,
  },
  {
    id: 'u-mike',
    name: 'Mike Wilson',
    email: 'mike@syncspace.dev',
    avatar: 'MW',
    isEmailVerified: true,
  },
];

export function findUser(id: string): User {
  return demoUsers.find((u) => u.id === id) || demoUser;
}

/**
 * A demo workspace is the single source of truth for every workspace-level
 * entity (rooms, files, members, meetings, activity). Pages and services all
 * read from this one shared data source.
 */
export interface DemoWorkspace {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt?: string;
  icon?: string;
  isPublic?: boolean;
  isFavorite?: boolean;
  inviteCode?: string;
  owner?: string;
  isDeleted?: boolean;
  members: Member[];
  files: UploadedFile[];
  rooms: Room[];
  meetings: Meeting[];
  activity: Activity[];
}

type DemoRole = 'owner' | 'admin' | 'member';
type DemoStatus = 'active' | 'invited' | 'suspended';

function makeMember(
  workspaceId: string,
  userId: string,
  role: DemoRole,
  status: DemoStatus,
  index: number,
): Member {
  const joinedAt = daysAgo(20 - index);
  return {
    _id: `mem-${workspaceId}-${index}`,
    userId: findUser(userId),
    workspaceId,
    role,
    status,
    invitedBy: status === 'invited' ? findUser('u-priya') : undefined,
    joinedAt,
    createdAt: joinedAt,
    updatedAt: joinedAt,
  };
}

export const demoWorkspaces: DemoWorkspace[] = [
  {
    id: 'ws-1',
    name: 'SyncSpace Development',
    description: 'Main product development workspace for the SyncSpace collaboration suite.',
    color: '#6366f1',
    icon: '🚀',
    isPublic: false,
    isFavorite: true,
    inviteCode: 'WS-DEV-2024',
    owner: 'demo-user',
    createdAt: daysAgo(120),
    updatedAt: hoursAgo(1),
    members: [
      makeMember('ws-1', 'demo-user', 'owner', 'active', 0),
      makeMember('ws-1', 'u-priya', 'admin', 'active', 1),
      makeMember('ws-1', 'u-alex', 'member', 'active', 2),
      makeMember('ws-1', 'u-ravi', 'member', 'active', 3),
      makeMember('ws-1', 'u-sarah', 'member', 'invited', 4),
    ],
    files: [
      {
        _id: 'file-1',
        name: 'README.md',
        originalName: 'README.md',
        mimeType: 'text/markdown',
        size: 2456,
        path: '/Documentation/README.md',
        workspace: 'ws-1',
        folder: 'Documentation',
        uploader: findUser('u-priya'),
        isDeleted: false,
        createdAt: daysAgo(30),
        updatedAt: daysAgo(6),
      },
      {
        _id: 'file-5',
        name: 'MeetingNotes.docx',
        originalName: 'MeetingNotes.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 345678,
        path: '/Documentation/MeetingNotes.docx',
        workspace: 'ws-1',
        folder: 'Documentation',
        uploader: findUser('demo-user'),
        isDeleted: false,
        createdAt: daysAgo(5),
        updatedAt: hoursAgo(9),
      },
    ],
    rooms: [
      {
        _id: 'room-1',
        name: 'Daily Standup',
        type: 'whiteboard',
        workspace: 'ws-1',
        owner: 'demo-user',
        inviteCode: 'ROOM-STANDUP',
        isActive: true,
        participants: ['demo-user', 'u-priya', 'u-alex', 'u-ravi'],
        isDeleted: false,
        createdAt: daysAgo(40),
        updatedAt: hoursAgo(2),
      },
      {
        _id: 'room-3',
        name: 'Frontend Discussion',
        type: 'document',
        workspace: 'ws-1',
        owner: 'demo-user',
        inviteCode: 'ROOM-FE-DISC',
        isActive: false,
        participants: ['demo-user', 'u-alex', 'u-ravi'],
        isDeleted: false,
        createdAt: daysAgo(25),
        updatedAt: daysAgo(1),
      },
    ],
    meetings: [
      {
        _id: 'meet-1',
        name: "Today's Meeting",
        description: 'Quick sync on sprint goals and blockers.',
        workspace: 'ws-1',
        host: findUser('demo-user'),
        participants: [findUser('demo-user'), findUser('u-priya'), findUser('u-alex')],
        scheduledAt: hoursFromNow(2),
        duration: 30,
        status: 'scheduled',
        agenda: 'Sprint goals, blockers, next steps',
        meetingCode: 'MEET-TODAY-01',
        isDeleted: false,
        createdAt: daysAgo(2),
        updatedAt: hoursAgo(1),
      },
      {
        _id: 'meet-2',
        name: 'Sprint Review',
        description: 'Review completed work and demo features.',
        workspace: 'ws-1',
        host: findUser('u-sarah'),
        participants: [
          findUser('demo-user'),
          findUser('u-sarah'),
          findUser('u-alex'),
          findUser('u-ravi'),
        ],
        scheduledAt: daysFromNow(1),
        duration: 60,
        status: 'scheduled',
        agenda: 'Demo features, retro, planning',
        meetingCode: 'MEET-SPRINT-02',
        isDeleted: false,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1),
      },
    ],
    activity: [
      {
        _id: 'act-1',
        user: findUser('u-priya'),
        action: 'created a new task',
        entityType: 'task',
        entityId: 'task-3',
        entityName: 'Fix login token refresh bug',
        createdAt: hoursAgo(4),
      },
      {
        _id: 'act-2',
        user: findUser('demo-user'),
        action: 'created',
        entityType: 'workspace',
        entityId: 'ws-1',
        entityName: 'SyncSpace Development',
        createdAt: daysAgo(120),
      },
      {
        _id: 'act-3',
        user: findUser('u-alex'),
        action: 'invited',
        entityType: 'invite',
        entityName: 'sarah@syncspace.dev',
        createdAt: daysAgo(1),
      },
      {
        _id: 'act-8',
        user: findUser('demo-user'),
        action: 'renamed',
        entityType: 'file',
        entityId: 'file-5',
        entityName: 'MeetingNotes.docx',
        createdAt: hoursAgo(9),
      },
    ],
  },
  {
    id: 'ws-2',
    name: 'Axlero Internship',
    description: 'Internship projects, reports and weekly deliverables.',
    color: '#8b5cf6',
    icon: '🎓',
    isPublic: false,
    isFavorite: false,
    inviteCode: 'WS-INTERN-24',
    owner: 'demo-user',
    createdAt: daysAgo(90),
    updatedAt: daysAgo(2),
    members: [
      makeMember('ws-2', 'demo-user', 'owner', 'active', 0),
      makeMember('ws-2', 'u-sarah', 'member', 'active', 1),
      makeMember('ws-2', 'u-alex', 'member', 'active', 2),
    ],
    files: [
      {
        _id: 'file-2',
        name: 'ProjectReport.pdf',
        originalName: 'ProjectReport.pdf',
        mimeType: 'application/pdf',
        size: 4521984,
        path: '/Reports/ProjectReport.pdf',
        workspace: 'ws-2',
        folder: 'Reports',
        uploader: findUser('demo-user'),
        isDeleted: false,
        createdAt: daysAgo(9),
        updatedAt: daysAgo(9),
      },
      {
        _id: 'file-4',
        name: 'Presentation.pptx',
        originalName: 'Presentation.pptx',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        size: 12034000,
        path: '/Presentations/Presentation.pptx',
        workspace: 'ws-2',
        folder: 'Presentations',
        uploader: findUser('u-sarah'),
        isDeleted: false,
        createdAt: daysAgo(7),
        updatedAt: daysAgo(7),
      },
    ],
    rooms: [
      {
        _id: 'room-2',
        name: 'Project Review',
        type: 'code',
        workspace: 'ws-2',
        owner: 'demo-user',
        inviteCode: 'ROOM-REVIEW',
        isActive: true,
        participants: ['demo-user', 'u-sarah', 'u-alex'],
        isDeleted: false,
        createdAt: daysAgo(35),
        updatedAt: hoursAgo(5),
      },
    ],
    meetings: [
      {
        _id: 'meet-3',
        name: 'Client Demo',
        description: 'Live demo of the dashboard for stakeholders.',
        workspace: 'ws-2',
        host: findUser('demo-user'),
        participants: [findUser('demo-user'), findUser('u-sarah')],
        scheduledAt: hoursAgo(2),
        duration: 45,
        status: 'ongoing',
        agenda: 'Feature walkthrough, Q&A',
        meetingCode: 'MEET-CLIENT-03',
        isDeleted: false,
        createdAt: daysAgo(4),
        updatedAt: hoursAgo(2),
      },
    ],
    activity: [
      {
        _id: 'act-7',
        user: findUser('u-sarah'),
        action: 'started',
        entityType: 'room',
        entityId: 'room-2',
        entityName: 'Project Review',
        createdAt: hoursAgo(5),
      },
    ],
  },
  {
    id: 'ws-3',
    name: 'Final Year Project',
    description: 'Capstone project planning, research and implementation.',
    color: '#10b981',
    icon: '📚',
    isPublic: false,
    isFavorite: false,
    inviteCode: 'WS-FYP-2024',
    owner: 'demo-user',
    createdAt: daysAgo(200),
    updatedAt: daysAgo(5),
    members: [
      makeMember('ws-3', 'demo-user', 'owner', 'active', 0),
      makeMember('ws-3', 'u-priya', 'member', 'active', 1),
      makeMember('ws-3', 'u-mike', 'member', 'active', 2),
    ],
    files: [
      {
        _id: 'file-6',
        name: 'DatabaseSchema.sql',
        originalName: 'DatabaseSchema.sql',
        mimeType: 'text/plain',
        size: 8450,
        path: '/Database/DatabaseSchema.sql',
        workspace: 'ws-3',
        folder: 'Database',
        uploader: findUser('u-mike'),
        isDeleted: false,
        createdAt: daysAgo(11),
        updatedAt: daysAgo(11),
      },
    ],
    rooms: [],
    meetings: [],
    activity: [
      {
        _id: 'act-6',
        user: findUser('u-mike'),
        action: 'completed',
        entityType: 'task',
        entityId: 'task-8',
        entityName: 'Migrate database to MongoDB',
        createdAt: daysAgo(4),
      },
    ],
  },
  {
    id: 'ws-4',
    name: 'Hackathon Team',
    description: '48-hour hackathon project: AI-powered code reviewer.',
    color: '#f59e0b',
    icon: '⚡',
    isPublic: false,
    isFavorite: false,
    inviteCode: 'WS-HACK-2024',
    owner: 'u-alex',
    createdAt: daysAgo(30),
    updatedAt: daysAgo(3),
    members: [
      makeMember('ws-4', 'u-alex', 'owner', 'active', 0),
      makeMember('ws-4', 'demo-user', 'member', 'active', 1),
      makeMember('ws-4', 'u-priya', 'member', 'active', 2),
      makeMember('ws-4', 'u-mike', 'member', 'active', 3),
    ],
    files: [],
    rooms: [
      {
        _id: 'room-4',
        name: 'Backend Planning',
        type: 'code',
        workspace: 'ws-4',
        owner: 'u-alex',
        inviteCode: 'ROOM-BE-PLAN',
        isActive: true,
        participants: ['u-alex', 'demo-user', 'u-priya', 'u-mike'],
        isDeleted: false,
        createdAt: daysAgo(20),
        updatedAt: hoursAgo(3),
      },
    ],
    meetings: [
      {
        _id: 'meet-4',
        name: 'Architecture Discussion',
        description: 'Agree on the service architecture for the next milestone.',
        workspace: 'ws-4',
        host: findUser('u-alex'),
        participants: [
          findUser('u-alex'),
          findUser('demo-user'),
          findUser('u-priya'),
          findUser('u-mike'),
        ],
        scheduledAt: daysAgo(3),
        duration: 90,
        status: 'completed',
        agenda: 'Monorepo layout, API contracts, deployment',
        meetingCode: 'MEET-ARCH-04',
        endedAt: daysAgo(3),
        isDeleted: false,
        createdAt: daysAgo(6),
        updatedAt: daysAgo(3),
      },
    ],
    activity: [
      {
        _id: 'act-5',
        user: findUser('demo-user'),
        action: 'joined',
        entityType: 'room',
        entityId: 'room-4',
        entityName: 'Backend Planning',
        createdAt: daysAgo(3),
      },
    ],
  },
  {
    id: 'ws-5',
    name: 'AI Research',
    description: 'Exploring vector databases and retrieval-augmented generation.',
    color: '#ec4899',
    icon: '🤖',
    isPublic: false,
    isFavorite: false,
    inviteCode: 'WS-AI-RND',
    owner: 'u-priya',
    createdAt: daysAgo(45),
    updatedAt: daysAgo(1),
    members: [
      makeMember('ws-5', 'u-priya', 'owner', 'active', 0),
      makeMember('ws-5', 'demo-user', 'member', 'active', 1),
      makeMember('ws-5', 'u-sarah', 'member', 'active', 2),
    ],
    files: [],
    rooms: [
      {
        _id: 'room-5',
        name: 'System Design',
        type: 'whiteboard',
        workspace: 'ws-5',
        owner: 'u-priya',
        inviteCode: 'ROOM-SYS-DES',
        isActive: false,
        participants: ['u-priya', 'demo-user', 'u-sarah'],
        isDeleted: false,
        createdAt: daysAgo(15),
        updatedAt: daysAgo(2),
      },
    ],
    meetings: [],
    activity: [],
  },
  {
    id: 'ws-6',
    name: 'UI Design',
    description: 'Design system, mockups and user flows.',
    color: '#06b6d4',
    icon: '🎨',
    isPublic: false,
    isFavorite: false,
    inviteCode: 'WS-UI-DESIGN',
    owner: 'u-ravi',
    createdAt: daysAgo(60),
    updatedAt: daysAgo(4),
    members: [
      makeMember('ws-6', 'u-ravi', 'owner', 'active', 0),
      makeMember('ws-6', 'demo-user', 'member', 'active', 1),
    ],
    files: [
      {
        _id: 'file-3',
        name: 'UI.fig',
        originalName: 'UI.fig',
        mimeType: 'application/octet-stream',
        size: 8912230,
        path: '/Design/UI.fig',
        workspace: 'ws-6',
        folder: 'Design',
        uploader: findUser('u-ravi'),
        isDeleted: false,
        createdAt: daysAgo(12),
        updatedAt: daysAgo(4),
      },
    ],
    rooms: [],
    meetings: [],
    activity: [
      {
        _id: 'act-4',
        user: findUser('u-ravi'),
        action: 'uploaded',
        entityType: 'file',
        entityId: 'file-3',
        entityName: 'UI.fig',
        createdAt: daysAgo(4),
      },
    ],
  },
];

const STORAGE_KEY = 'syncspace-demo-user-workspaces';

function loadUserWorkspaces(): DemoWorkspace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as DemoWorkspace[];
    }
  } catch {
    // ignore corrupt storage
  }
  return [];
}

function persistUserWorkspaces(list: DemoWorkspace[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage full / unavailable — keep in-memory only
  }
}

let userWorkspaceCache: DemoWorkspace[] | null = null;

function getUserWorkspaces(): DemoWorkspace[] {
  if (userWorkspaceCache === null) {
    userWorkspaceCache = loadUserWorkspaces();
  }
  return userWorkspaceCache;
}

function persist(): void {
  persistUserWorkspaces(getUserWorkspaces());
}

export function getAllDemoWorkspaces(): DemoWorkspace[] {
  return [...demoWorkspaces, ...getUserWorkspaces()];
}

export function getDemoWorkspace(id: string): DemoWorkspace | undefined {
  return getAllDemoWorkspaces().find((ws) => ws.id === id);
}

export function createDemoWorkspace(input: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic?: boolean;
  owner?: string;
}): DemoWorkspace {
  const nowIso = new Date().toISOString();
  const ws: DemoWorkspace = {
    id: `ws-demo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: input.name,
    description: input.description || '',
    color: input.color || '#6366f1',
    icon: input.icon || '📁',
    isPublic: input.isPublic ?? false,
    isFavorite: false,
    inviteCode: `WS-DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    owner: input.owner || demoUser.id,
    createdAt: nowIso,
    updatedAt: nowIso,
    members: [
      {
        _id: `mem-${nowIso}-owner`,
        userId: findUser(input.owner || demoUser.id),
        workspaceId: '',
        role: 'owner',
        status: 'active',
        joinedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ],
    files: [],
    rooms: [],
    meetings: [],
    activity: [],
  };
  ws.members[0].workspaceId = ws.id;
  getUserWorkspaces().unshift(ws);
  persist();
  return ws;
}

export function updateDemoWorkspace(
  id: string,
  patch: Partial<
    Pick<
      DemoWorkspace,
      'name' | 'description' | 'color' | 'icon' | 'isPublic' | 'isFavorite' | 'inviteCode'
    >
  >,
): DemoWorkspace | undefined {
  const userWs = getUserWorkspaces().find((ws) => ws.id === id);
  if (userWs) {
    Object.assign(userWs, patch, { updatedAt: new Date().toISOString() });
    persist();
    return userWs;
  }
  const defaultWs = demoWorkspaces.find((ws) => ws.id === id);
  if (defaultWs) {
    Object.assign(defaultWs, patch, { updatedAt: new Date().toISOString() });
    return defaultWs;
  }
  return undefined;
}

export function removeDemoWorkspace(id: string): void {
  const userWs = getUserWorkspaces().find((ws) => ws.id === id);
  if (userWs) {
    userWs.isDeleted = true;
    persist();
    return;
  }
  const defaultWs = demoWorkspaces.find((ws) => ws.id === id);
  if (defaultWs) {
    defaultWs.isDeleted = true;
  }
}

export function restoreDemoWorkspace(id: string): DemoWorkspace | undefined {
  const userWs = getUserWorkspaces().find((ws) => ws.id === id);
  if (userWs) {
    userWs.isDeleted = false;
    persist();
    return userWs;
  }
  const defaultWs = demoWorkspaces.find((ws) => ws.id === id);
  if (defaultWs) {
    defaultWs.isDeleted = false;
    return defaultWs;
  }
  return undefined;
}

export function isUserWorkspace(id: string): boolean {
  return getUserWorkspaces().some((ws) => ws.id === id);
}

export function toWorkspaceShape(dw: DemoWorkspace): Workspace {
  const ownerId = dw.owner || demoUser.id;
  return {
    _id: dw.id,
    name: dw.name,
    description: dw.description,
    color: dw.color,
    icon: dw.icon || '📁',
    isPublic: dw.isPublic ?? false,
    isFavorite: dw.isFavorite ?? false,
    inviteCode: dw.inviteCode || `WS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    owner: ownerId,
    members: dw.members
      .map((m) => (typeof m.userId === 'string' ? m.userId : m.userId.id))
      .filter((mid) => mid !== ownerId),
    memberCount: dw.members.length,
    roomCount: dw.rooms.length,
    isDeleted: dw.isDeleted ?? false,
    createdAt: dw.createdAt,
    updatedAt: dw.updatedAt || dw.createdAt,
  };
}

function toAppRoom(ws: DemoWorkspace, room: Room): Room {
  return { ...room, workspace: toWorkspaceShape(ws) };
}

function toAppMeeting(ws: DemoWorkspace, meeting: Meeting): Meeting {
  return { ...meeting, workspace: toWorkspaceShape(ws) };
}

export function getAllDemoRooms(): Room[] {
  return getAllDemoWorkspaces().flatMap((ws) => ws.rooms.map((r) => toAppRoom(ws, r)));
}

export function getAllDemoMeetings(): Meeting[] {
  return getAllDemoWorkspaces().flatMap((ws) => ws.meetings.map((m) => toAppMeeting(ws, m)));
}

export function getAllDemoFiles(): UploadedFile[] {
  return getAllDemoWorkspaces().flatMap((ws) => ws.files);
}

export function getAllDemoActivities(): Activity[] {
  return getAllDemoWorkspaces().flatMap((ws) => ws.activity);
}

export function getDemoRoomsForWorkspace(workspaceId: string): Room[] {
  const ws = getDemoWorkspace(workspaceId);
  return ws ? ws.rooms.map((r) => toAppRoom(ws, r)) : [];
}

export function getDemoMeetingsForWorkspace(workspaceId: string): Meeting[] {
  const ws = getDemoWorkspace(workspaceId);
  return ws ? ws.meetings.map((m) => toAppMeeting(ws, m)) : [];
}

export function getDemoFilesForWorkspace(workspaceId: string): UploadedFile[] {
  return getDemoWorkspace(workspaceId)?.files || [];
}

export function getDemoActivitiesForWorkspace(workspaceId: string): Activity[] {
  return getDemoWorkspace(workspaceId)?.activity || [];
}

export function getDemoMembersForWorkspace(workspaceId: string): Member[] {
  return getDemoWorkspace(workspaceId)?.members || [];
}

export function getDemoRoom(id: string): Room | undefined {
  for (const ws of getAllDemoWorkspaces()) {
    const room = ws.rooms.find((r) => r._id === id);
    if (room) return toAppRoom(ws, room);
  }
  return undefined;
}

export function getDemoMeeting(id: string): Meeting | undefined {
  for (const ws of getAllDemoWorkspaces()) {
    const meeting = ws.meetings.find((m) => m._id === id);
    if (meeting) return toAppMeeting(ws, meeting);
  }
  return undefined;
}

export function getDemoFile(id: string): UploadedFile | undefined {
  for (const ws of getAllDemoWorkspaces()) {
    const file = ws.files.find((f) => f._id === id);
    if (file) return file;
  }
  return undefined;
}

export function getWorkspacesByMember(userId: string): Workspace[] {
  return getAllDemoWorkspaces()
    .filter((ws) => !ws.isDeleted)
    .filter(
      (ws) =>
        ws.owner === userId ||
        ws.members.some((m) => (typeof m.userId === 'string' ? m.userId : m.userId.id) === userId),
    )
    .map(toWorkspaceShape);
}

export function getDemoStats() {
  const all = getAllDemoWorkspaces().filter((ws) => !ws.isDeleted);
  const rooms = all.reduce((sum, ws) => sum + ws.rooms.length, 0);
  const files = all.reduce((sum, ws) => sum + ws.files.length, 0);
  const members = all.reduce((sum, ws) => sum + ws.members.length, 0);
  const activity = all.reduce((sum, ws) => sum + ws.activity.length, 0);
  return {
    totalWorkspaces: all.length,
    totalRooms: rooms,
    filesShared: files,
    onlineMembers: 24,
    activeSessions: 8,
    recentActivity: activity,
    projectsCreated: all.length,
    growth: {
      workspaces: all.length,
      rooms,
      members,
      activity,
    },
  };
}

export function getDemoMeetingStats(): MeetingStats {
  const meetings = getAllDemoMeetings();
  return {
    total: meetings.length,
    upcoming: meetings.filter((m) => m.status === 'scheduled').length,
    ongoing: meetings.filter((m) => m.status === 'ongoing').length,
    completed: meetings.filter((m) => m.status === 'completed').length,
  };
}

export function addDemoRoom(
  workspaceId: string,
  input: { name: string; type?: string; owner?: string; inviteCode?: string; isActive?: boolean },
): Room {
  const nowIso = new Date().toISOString();
  const ws = getDemoWorkspace(workspaceId) || demoWorkspaces[0];
  const room: Room = {
    _id: `room-demo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: input.name,
    type: (input.type as Room['type']) || 'whiteboard',
    workspace: ws.id,
    owner: input.owner || demoUser.id,
    inviteCode: input.inviteCode || `ROOM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    isActive: input.isActive ?? false,
    participants: [demoUser.id],
    isDeleted: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  ws.rooms.push(room);
  persist();
  return room;
}

export function updateDemoRoom(id: string, patch: Partial<Room>): Room | undefined {
  for (const ws of getAllDemoWorkspaces()) {
    const room = ws.rooms.find((r) => r._id === id);
    if (room) {
      Object.assign(room, patch, { updatedAt: new Date().toISOString() });
      persist();
      return room;
    }
  }
  return undefined;
}

export function deleteDemoRoom(id: string): void {
  for (const ws of getAllDemoWorkspaces()) {
    const room = ws.rooms.find((r) => r._id === id);
    if (room) {
      room.isDeleted = true;
      persist();
      return;
    }
  }
}

export function addDemoMeeting(
  workspaceId: string,
  input: {
    name: string;
    description?: string;
    participants?: string[];
    scheduledAt: string;
    duration?: number;
    agenda?: string;
  },
): Meeting {
  const nowIso = new Date().toISOString();
  const ws = getDemoWorkspace(workspaceId) || demoWorkspaces[0];
  const meeting: Meeting = {
    _id: `meet-demo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: input.name,
    description: input.description || '',
    workspace: ws.id,
    host: demoUser,
    participants: [
      demoUser,
      ...(input.participants || []).map((id) => findUser(id)).filter((u) => u.id !== demoUser.id),
    ],
    scheduledAt: input.scheduledAt,
    duration: input.duration || 30,
    status: 'scheduled',
    agenda: input.agenda || '',
    meetingCode: `MEET-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    isDeleted: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  ws.meetings.push(meeting);
  persist();
  return meeting;
}

export function updateDemoMeeting(id: string, patch: Partial<Meeting>): Meeting | undefined {
  for (const ws of getAllDemoWorkspaces()) {
    const meeting = ws.meetings.find((m) => m._id === id);
    if (meeting) {
      Object.assign(meeting, patch, { updatedAt: new Date().toISOString() });
      persist();
      return meeting;
    }
  }
  return undefined;
}

export function deleteDemoMeeting(id: string): void {
  for (const ws of getAllDemoWorkspaces()) {
    const meeting = ws.meetings.find((m) => m._id === id);
    if (meeting) {
      meeting.isDeleted = true;
      persist();
      return;
    }
  }
}

export function addDemoFile(
  workspaceId: string,
  input: {
    name: string;
    mimeType: string;
    size: number;
    folder?: string;
    roomId?: string;
  },
): UploadedFile {
  const nowIso = new Date().toISOString();
  const ws = getDemoWorkspace(workspaceId) || demoWorkspaces[0];
  const file: UploadedFile = {
    _id: `file-demo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: input.name,
    originalName: input.name,
    mimeType: input.mimeType || 'application/octet-stream',
    size: input.size,
    path: `/${input.folder || 'Root'}/${input.name}`,
    workspace: ws.id,
    room: input.roomId,
    folder: input.folder || 'Root',
    uploader: demoUser,
    isDeleted: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  ws.files.push(file);
  persist();
  return file;
}

export function updateDemoFile(id: string, patch: Partial<UploadedFile>): UploadedFile | undefined {
  for (const ws of getAllDemoWorkspaces()) {
    const file = ws.files.find((f) => f._id === id);
    if (file) {
      Object.assign(file, patch, { updatedAt: new Date().toISOString() });
      persist();
      return file;
    }
  }
  return undefined;
}

export function deleteDemoFile(id: string): void {
  for (const ws of getAllDemoWorkspaces()) {
    const file = ws.files.find((f) => f._id === id);
    if (file) {
      file.isDeleted = true;
      persist();
      return;
    }
  }
}

export function addDemoMember(
  workspaceId: string,
  input: { userId: string; role?: string; status?: string },
): Member {
  const nowIso = new Date().toISOString();
  const ws = getDemoWorkspace(workspaceId) || demoWorkspaces[0];
  const member: Member = {
    _id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: findUser(input.userId),
    workspaceId: ws.id,
    role: (input.role as Member['role']) || 'member',
    status: (input.status as Member['status']) || 'active',
    invitedBy: demoUser,
    joinedAt: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  ws.members.push(member);
  persist();
  return member;
}

export function updateDemoMember(
  workspaceId: string,
  memberId: string,
  patch: Partial<Member>,
): Member | undefined {
  const ws = getDemoWorkspace(workspaceId);
  if (!ws) return undefined;
  const member = ws.members.find((m) => m._id === memberId);
  if (!member) return undefined;
  Object.assign(member, patch, { updatedAt: new Date().toISOString() });
  persist();
  return member;
}

export function removeDemoMember(workspaceId: string, memberId: string): void {
  const ws = getDemoWorkspace(workspaceId);
  if (!ws) return;
  ws.members = ws.members.filter((m) => m._id !== memberId);
  persist();
}

export function getDemoWorkspaceByInviteCode(inviteCode: string): DemoWorkspace | undefined {
  return getAllDemoWorkspaces().find((ws) => ws.inviteCode === inviteCode);
}
