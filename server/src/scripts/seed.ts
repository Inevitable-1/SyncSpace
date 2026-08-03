import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { Room } from '../models/Room.js';
import { Member } from '../models/Member.js';
import { Invite } from '../models/Invite.js';
import { Task } from '../models/Task.js';
import { TaskComment } from '../models/TaskComment.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { CodeDocument } from '../models/CodeDocument.js';
import { Whiteboard } from '../models/Whiteboard.js';
import { UploadedFile } from '../models/UploadedFile.js';
import { Activity, type ActivityAction } from '../models/Activity.js';
import { Notification } from '../models/Notification.js';
import { RoomPresence } from '../models/RoomPresence.js';
import { Meeting } from '../models/Meeting.js';
import { RefreshToken } from '../models/RefreshToken.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/syncspace';
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'alex@syncspace.demo';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demo1234';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const now = Date.now();
const minutesAgo = (n: number) => new Date(now - n * MIN);
const hoursAgo = (n: number) => new Date(now - n * HOUR);
const daysAgo = (n: number) => new Date(now - n * DAY);
const inDays = (n: number) => new Date(now + n * DAY);

let uid = 0;
const nextId = () => `seed-${++uid}`;

function avatarFor(name: string, color: string): string {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'>` +
    `<rect width='128' height='128' rx='64' fill='${color}'/>` +
    `<text x='64' y='82' font-family='Inter,Arial,sans-serif' font-size='46' font-weight='700' fill='#ffffff' text-anchor='middle'>${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const USER_DEFS = [
  { name: 'Alex Johnson', email: DEMO_EMAIL, color: '#6366f1' },
  { name: 'Priya Sharma', email: 'priya@syncspace.dev', color: '#10b981' },
  { name: 'Daniel Chen', email: 'daniel@syncspace.dev', color: '#f43f5e' },
  { name: 'Sofia Rodriguez', email: 'sofia@syncspace.dev', color: '#ec4899' },
  { name: 'Marcus Lee', email: 'marcus@syncspace.dev', color: '#f59e0b' },
  { name: 'Emma Wilson', email: 'emma@syncspace.dev', color: '#8b5cf6' },
  { name: 'Liam Patel', email: 'liam@syncspace.dev', color: '#06b6d4' },
  { name: 'Aisha Khan', email: 'aisha@syncspace.dev', color: '#f97316' },
  { name: 'Noah Garcia', email: 'noah@syncspace.dev', color: '#14b8a6' },
  { name: 'Mia Thompson', email: 'mia@syncspace.dev', color: '#a855f7' },
];

const usersByEmail: Record<string, any> = {};

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  console.log('Clearing content collections...');
  await Promise.all([
    Workspace.deleteMany({}),
    Room.deleteMany({}),
    Member.deleteMany({}),
    Invite.deleteMany({}),
    Task.deleteMany({}),
    TaskComment.deleteMany({}),
    ChatMessage.deleteMany({}),
    CodeDocument.deleteMany({}),
    Whiteboard.deleteMany({}),
    UploadedFile.deleteMany({}),
    Activity.deleteMany({}),
    Notification.deleteMany({}),
    RoomPresence.deleteMany({}),
    Meeting.deleteMany({}),
    RefreshToken.deleteMany({}),
  ]);

  console.log('Creating users...');
  for (const def of USER_DEFS) {
    const user = await User.findOneAndUpdate(
      { email: def.email },
      {
        $set: { name: def.name, avatar: avatarFor(def.name, def.color), isEmailVerified: true },
        $setOnInsert: { password: def.email === DEMO_EMAIL ? DEMO_PASSWORD : 'demo1234' },
      },
      { new: true, upsert: true },
    );
    usersByEmail[def.email] = user;
  }
  const alex = usersByEmail[DEMO_EMAIL];
  console.log(`Demo user ready: ${DEMO_EMAIL} (${alex._id})`);

  const W = {
    ai: { name: 'AI Research Lab', description: 'Experiments, model training and evaluation for the recommendation engine.', color: '#8b5cf6', icon: '🧠' },
    college: { name: 'College Project', description: 'Group coursework for the Distributed Systems semester — final report and ML assignment.', color: '#06b6d4', icon: '🎓' },
    frontend: { name: 'Frontend Team', description: 'React + Tailwind app building. Design system, components and review cycles.', color: '#6366f1', icon: '🎨' },
    backend: { name: 'Backend Team', description: 'Node.js APIs, microservices and database design for the platform.', color: '#10b981', icon: '⚙️' },
    marketing: { name: 'Marketing', description: 'Q3 campaigns, content calendar and growth experiments for the product launch.', color: '#f43f5e', icon: '📣' },
    startup: { name: 'Startup Dashboard', description: 'Building the investor dashboard MVP — metrics, charts and reporting.', color: '#f59e0b', icon: '🚀' },
    design: { name: 'UI Design', description: 'Design system, component library and brand guidelines for the product.', color: '#ec4899', icon: '✨' },
  };

  const memberEmails: Record<string, string[]> = {
    ai: ['priya@syncspace.dev', 'emma@syncspace.dev', 'liam@syncspace.dev', 'marcus@syncspace.dev'],
    college: ['daniel@syncspace.dev', 'sofia@syncspace.dev', 'mia@syncspace.dev'],
    frontend: ['daniel@syncspace.dev', 'sofia@syncspace.dev', 'marcus@syncspace.dev', 'mia@syncspace.dev'],
    backend: ['priya@syncspace.dev', 'liam@syncspace.dev', 'noah@syncspace.dev', 'marcus@syncspace.dev'],
    marketing: ['aisha@syncspace.dev', 'emma@syncspace.dev', 'marcus@syncspace.dev'],
    startup: ['daniel@syncspace.dev', 'priya@syncspace.dev', 'aisha@syncspace.dev', 'noah@syncspace.dev'],
    design: ['sofia@syncspace.dev', 'daniel@syncspace.dev', 'mia@syncspace.dev'],
  };

  console.log('Creating workspaces and members...');
  const workspaceDocs: Record<string, any> = {};
  for (const [key, def] of Object.entries(W)) {
    const emails = memberEmails[key];
    const memberIds = emails.map((e) => usersByEmail[e]._id);
    const ws = await Workspace.create({
      name: def.name,
      description: def.description,
      color: def.color,
      icon: def.icon,
      owner: alex._id,
      members: [alex._id, ...memberIds],
      isFavorite: key === 'frontend' || key === 'ai',
    });
    workspaceDocs[key] = ws;

    await Member.create({
      userId: alex._id,
      workspaceId: ws._id,
      role: 'owner',
      status: 'active',
      invitedBy: alex._id,
      joinedAt: daysAgo(45),
    });
    for (let i = 0; i < emails.length; i++) {
      await Member.create({
        userId: usersByEmail[emails[i]]._id,
        workspaceId: ws._id,
        role: i === 0 ? 'admin' : 'member',
        status: 'active',
        invitedBy: alex._id,
        joinedAt: daysAgo(40 - i * 3),
      });
    }
  }

  console.log('Creating rooms...');
  const roomsByKey: Record<string, any> = {};
  const roomDefs = [
    { key: 'ai', name: 'Model Architecture', type: 'whiteboard', active: true },
    { key: 'ai', name: 'Data Pipeline', type: 'code' },
    { key: 'ai', name: 'Research Notes', type: 'document' },
    { key: 'college', name: 'Project Brainstorm', type: 'whiteboard' },
    { key: 'college', name: 'ML Assignment', type: 'code' },
    { key: 'college', name: 'Semester Report', type: 'document' },
    { key: 'frontend', name: 'UI Wireframe', type: 'whiteboard', active: true },
    { key: 'frontend', name: 'React Components', type: 'code' },
    { key: 'frontend', name: 'Design Review', type: 'document' },
    { key: 'backend', name: 'API Design', type: 'whiteboard' },
    { key: 'backend', name: 'Node Services', type: 'code' },
    { key: 'backend', name: 'DB Schema', type: 'document' },
    { key: 'marketing', name: 'Q3 Campaign', type: 'whiteboard', active: true },
    { key: 'marketing', name: 'Content Calendar', type: 'document' },
    { key: 'startup', name: 'Product Roadmap', type: 'whiteboard' },
    { key: 'startup', name: 'Dashboard MVP', type: 'code' },
    { key: 'design', name: 'Design System', type: 'whiteboard' },
    { key: 'design', name: 'Component Library', type: 'document' },
  ];

  for (let i = 0; i < roomDefs.length; i++) {
    const def = roomDefs[i];
    const ws = workspaceDocs[def.key];
    const emails = memberEmails[def.key];
    const participants = [alex._id, ...emails.map((e) => usersByEmail[e]._id)];
    const room = await Room.create({
      name: def.name,
      description: `Collaborative ${def.type} room for ${ws.name}.`,
      type: def.type as 'whiteboard' | 'code' | 'document',
      workspace: ws._id,
      owner: alex._id,
      participants,
      isActive: def.active || false,
      updatedAt: hoursAgo(6 + i),
    });
    roomsByKey[`${def.key}:${def.name}`] = room;
  }

  console.log('Creating whiteboards...');
  const text = (x: number, y: number, t: string, fill = '#1e293b', fontSize = 16) => ({
    id: nextId(),
    type: 'text' as const,
    x,
    y,
    text: t,
    fill,
    fontSize,
    fontFamily: 'Inter',
    strokeWidth: 0,
  });
  const rect = (
    x: number,
    y: number,
    width: number,
    height: number,
    fill: string,
    label?: string,
    labelColor = '#ffffff',
  ) => [
    { id: nextId(), type: 'rect' as const, x, y, width, height, fill, stroke: fill, strokeWidth: 0, cornerRadius: 10, opacity: 0.92 },
    ...(label
      ? [
          {
            id: nextId(),
            type: 'text' as const,
            x: x + 14,
            y: y + 14,
            text: label,
            fill: labelColor,
            fontSize: 13,
            fontFamily: 'Inter',
            strokeWidth: 0,
            width: width - 28,
          },
        ]
      : []),
  ];
  const circle = (x: number, y: number, radius: number, fill: string) => ({
    id: nextId(),
    type: 'circle' as const,
    x: x - radius,
    y: y - radius,
    radiusX: radius,
    radiusY: radius,
    fill,
    stroke: fill,
    strokeWidth: 0,
    opacity: 0.9,
  });
  const arrow = (x1: number, y1: number, x2: number, y2: number, color = '#94a3b8') => ({
    id: nextId(),
    type: 'arrow' as const,
    points: [x1, y1, x2, y2],
    stroke: color,
    strokeWidth: 2,
    fill: color,
  });
  const line = (x1: number, y1: number, x2: number, y2: number, color = '#cbd5e1') => ({
    id: nextId(),
    type: 'line' as const,
    points: [x1, y1, x2, y2],
    stroke: color,
    strokeWidth: 1.5,
    tension: 0.5,
    lineCap: 'round',
    lineJoin: 'round',
  });

  const whiteboardCompositions: Record<string, any[]> = {
    'frontend:UI Wireframe': [
      text(120, 60, 'UI Wireframe — Login & Onboarding', '#1e293b', 30),
      ...rect(100, 130, 240, 300, '#6366f1', 'Login Screen\n\nEmail\nPassword\nSign in\n\nor continue with Google'),
      arrow(360, 280, 430, 280),
      ...rect(450, 130, 240, 300, '#8b5cf6', 'Onboarding\n\n• Choose topics\n• Import links\n• Invite team'),
      arrow(710, 280, 780, 280),
      ...rect(800, 130, 240, 300, '#10b981', 'Dashboard\n\nRecent workspaces\nActivity feed\nQuick actions'),
      line(100, 470, 1000, 470),
      circle(180, 560, 26, '#f43f5e'),
      text(210, 545, 'Error state + empty states still pending', '#b91c1c', 14),
      circle(540, 560, 26, '#f59e0b'),
      text(570, 545, 'Validate dark mode contrast', '#92400e', 14),
      circle(900, 560, 26, '#10b981'),
      text(930, 545, 'Approved by design', '#065f46', 14),
    ],
    'frontend:Design Review': [
      text(120, 60, 'Design Review — Comments', '#1e293b', 26),
      ...rect(100, 140, 340, 200, '#ec4899', 'Component Library v2.1\n\nButton, Input, Card, Toggle\nBadge, Tooltip, Tabs'),
      arrow(460, 240, 540, 240),
      ...rect(560, 140, 380, 200, '#f59e0b', 'Feedback from review\n\n• Spacing scale needs docs\n• Add loading states\n• Expose size variants'),
      line(100, 380, 940, 380),
      text(120, 410, 'Next: publish tokens to npm and update Storybook.', '#6366f1', 16),
    ],
    'ai:Model Architecture': [
      text(120, 60, 'Recommendation Engine v3', '#1e293b', 30),
      ...rect(100, 140, 200, 130, '#8b5cf6', 'User Embeddings\nBERT + behavior'),
      arrow(320, 205, 390, 205),
      ...rect(410, 140, 220, 130, '#06b6d4', 'Candidate Generator\nHNSW recall @100'),
      arrow(650, 205, 720, 205),
      ...rect(740, 140, 220, 130, '#10b981', 'Ranking Model\nLightGBM 2-stage'),
      line(100, 310, 960, 310),
      circle(220, 380, 24, '#f43f5e'),
      text(250, 370, 'Offline eval: NDCG@10 0.68 → target 0.72', '#b91c1c', 14),
      circle(620, 380, 24, '#f59e0b'),
      text(650, 370, 'A/B test on 5% traffic starting Fri', '#92400e', 14),
    ],
    'backend:API Design': [
      text(120, 60, 'REST API — Endpoint Plan', '#1e293b', 28),
      ...rect(100, 150, 250, 120, '#0f766e', 'POST /api/auth/*\nlogin, register, refresh'),
      arrow(370, 210, 440, 210),
      ...rect(460, 150, 280, 120, '#10b981', 'GET /api/workspaces\nmembers, rooms, files'),
      arrow(760, 210, 830, 210),
      ...rect(850, 150, 250, 120, '#14b8a6', 'GET /api/rooms\nmessages, presence'),
      text(120, 330, 'Rate limiting: 100 req/min per user. All endpoints auth via Bearer JWT.', '#1e293b', 15),
    ],
    'startup:Product Roadmap': [
      text(120, 60, 'Product Roadmap — Q3', '#1e293b', 30),
      ...rect(100, 150, 200, 130, '#f59e0b', 'Jul\nInvite system\n+ onboarding'),
      arrow(320, 215, 390, 215),
      ...rect(410, 150, 200, 130, '#f97316', 'Aug\nDashboards\n+ meetings'),
      arrow(630, 215, 700, 215),
      ...rect(720, 150, 200, 130, '#ef4444', 'Sep\nPublic launch\n+ analytics'),
      text(120, 340, 'Stretch: mobile app beta before holiday break 🎄', '#92400e', 15),
    ],
    'marketing:Q3 Campaign': [
      text(120, 60, 'Q3 Campaign Board', '#1e293b', 30),
      ...rect(100, 140, 260, 220, '#f43f5e', 'SOCIAL\n\n• Launch teaser Tue\n• Influencer collabs\n• UGC contest'),
      ...rect(420, 140, 260, 220, '#fb7185', 'EMAIL\n\n• Welcome series\n• Product tour\n• Win-back nudge'),
      ...rect(740, 140, 260, 220, '#fda4af', 'PAID\n\n• LinkedIn video ads\n• Search brand terms\n• Retargeting 7d'),
      line(100, 400, 1000, 400),
      text(120, 430, 'Budget: $12k | Target: 15k signups | Owner: Aisha', '#be123c', 15),
    ],
    'design:Design System': [
      text(120, 60, 'Design System — Tokens', '#1e293b', 28),
      circle(200, 230, 45, '#ec4899'),
      circle(320, 230, 45, '#a855f7'),
      circle(440, 230, 45, '#6366f1'),
      circle(560, 230, 45, '#06b6d4'),
      circle(680, 230, 45, '#10b981'),
      text(120, 320, 'Color palette draft — v2 (oklch based)', '#1e293b', 15),
      ...rect(100, 360, 300, 90, '#f0abfc', 'Type scale: 12 / 14 / 16 / 20 / 24 / 32', '#9d174d'),
      ...rect(480, 360, 420, 90, '#c4b5fd', 'Spacing: 4px base grid, 8px component', '#5b21b6'),
    ],
  };

  for (const [roomKey, objects] of Object.entries(whiteboardCompositions)) {
    const room = roomsByKey[roomKey];
    if (!room) continue;
    await Whiteboard.create({ roomId: room._id, objects, createdBy: alex._id });
  }

  console.log('Creating code documents...');
  const reactFiles: Record<string, { content: string; language: string }> = {
    'src/App.tsx': {
      language: 'typescript',
      content: `import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/common/Toast';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import WorkspacesPage from './pages/WorkspacesPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="workspaces" element={<WorkspacesPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}`,
    },
    'src/components/Button.tsx': {
      language: 'typescript',
      content: `import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl font-semibold transition-all',
  {
    variants: {
      variant: {
        primary: 'bg-brand-600 text-white hover:bg-brand-500 shadow-lg',
        secondary: 'bg-white/5 text-white hover:bg-white/10 border border-white/10',
        ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
      },
      size: { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>
>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={buttonVariants({ variant, size, className })} {...props} />
));
Button.displayName = 'Button';`,
    },
    'src/hooks/useSocket.ts': {
      language: 'typescript',
      content: `import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useSocket(roomId: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;
    socket.emit('join', roomId);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  return socketRef.current;
}`,
    },
    'src/utils/format.ts': {
      language: 'typescript',
      content: `export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(1) + ' MB';
  return (bytes / 1024 ** 3).toFixed(1) + ' GB';
}

export function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h ago';
  const days = Math.floor(hours / 24);
  if (days < 7) return days + 'd ago';
  return new Date(date).toLocaleDateString();
}`,
    },
    'tailwind.config.ts': {
      language: 'typescript',
      content: `import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          800: '#3730a3',
        },
        background: 'rgb(var(--bg-primary) / <alpha-value>)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config;`,
    },
    'README.md': {
      language: 'markdown',
      content: `# SyncSpace Frontend

Collaborative workspace for teams — whiteboards, code rooms and file sharing.

## Getting started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Stack

- React 18 + Vite + TypeScript
- Redux Toolkit (state)
- Tailwind CSS + Framer Motion (UI)
- Monaco Editor + Konva (rooms)
- Socket.IO (realtime collaboration)`,
    },
  };

  const nodeFiles: Record<string, { content: string; language: string }> = {
    'src/index.ts': {
      language: 'typescript',
      content: `import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db';
import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspace';
import roomRoutes from './routes/room';

async function main() {
  await connectDB();

  const app = express();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  app.use(helmet());
  app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api/rooms', roomRoutes);

  const port = process.env.PORT || 5000;
  httpServer.listen(port, () => console.log('Server ready on', port));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});`,
    },
    'src/middleware/auth.ts': {
      language: 'typescript',
      content: `import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
    };
    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    req.user = { userId: user.id, email: user.email };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}`,
    },
    'src/models/Meeting.ts': {
      language: 'typescript',
      content: `import mongoose, { Schema, type Document } from 'mongoose';

export type MeetingStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export interface IMeeting extends Document {
  name: string;
  workspace: mongoose.Types.ObjectId;
  host: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  scheduledAt: Date;
  duration: number;
  status: MeetingStatus;
  meetingCode: string;
}

const meetingSchema = new Schema<IMeeting>(
  {
    name: { type: String, required: true, trim: true },
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 30 },
    status: { type: String, enum: ['scheduled', 'ongoing', 'completed', 'cancelled'], default: 'scheduled' },
    meetingCode: { type: String, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
  },
  { timestamps: true },
);

export const Meeting = mongoose.model<IMeeting>('Meeting', meetingSchema);`,
    },
    'src/config/db.ts': {
      language: 'typescript',
      content: `import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/syncspace';
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}`,
    },
    '.env.example': {
      language: 'dotenv',
      content: `PORT=5000
MONGODB_URI=mongodb://localhost:27017/syncspace
CLIENT_URL=http://localhost:5173
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d`,
    },
  };

  const pipelineFiles: Record<string, { content: string; language: string }> = {
    'pipelines/etl.py': {
      language: 'python',
      content: `from datetime import datetime, timedelta
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, to_date

def run_etl(run_date: str) -> None:
    spark = SparkSession.builder.appName("recommendation-etl").getOrCreate()
    events = spark.read.parquet(f"s3://events/{run_date}/")

    daily = (
        events.filter(col("event").isin(["view", "click", "purchase"]))
        .groupBy("user_id", "item_id")
        .agg(count_events(), sum_revenue())
    )

    daily.write.mode("overwrite").parquet(f"s3://features/{run_date}/")
    spark.stop()

if __name__ == "__main__":
    run_etl((datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"))`,
    },
    'models/ranker.py': {
      language: 'python',
      content: `import lightgbm as lgb
import numpy as np
from sklearn.metrics import ndcg_score

class TwoStageRanker:
    def __init__(self, candidates=100, re_rank=10):
        self.candidates = candidates
        self.re_rank = re_rank

    def predict(self, user_features, item_features):
        # Stage 1: HNSW recall, Stage 2: gradient boosted ranking
        recall = self.hnsw_index.query(user_features, k=self.candidates)
        return self.ranker.predict(recall)

    def evaluate(self, labels, scores):
        return float(np.mean([ndcg_score([l], [s]) for l, s in zip(labels, scores)]))`,
    },
    'notebooks/offline_eval.ipynb': {
      language: 'json',
      content: `{
 "cells": [
  {
   "cell_type": "markdown",
   "source": ["# Offline evaluation — Recommendation v3\\n\\nCompare NDCG@10 across model versions."]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "source": ["from ranker import TwoStageRanker", "model = TwoStageRanker()", "ndcg = model.evaluate(labels, scores)", "print('NDCG@10', ndcg)"]
  }
 ],
 "metadata": {},
 "nbformat": 4,
 "nbformat_minor": 5
}`,
    },
  };

  const mvpFiles: Record<string, { content: string; language: string }> = {
    'src/pages/Overview.tsx': {
      language: 'typescript',
      content: `import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MetricCard } from '../components/MetricCard';
import { RevenueChart } from '../components/RevenueChart';
import { fetchMetrics } from '../api';

export function Overview() {
  const { data } = useQuery({ queryKey: ['metrics'], queryFn: fetchMetrics });

  const mrr = useMemo(() => data?.mrr ?? 0, [data]);
  const activeUsers = useMemo(() => data?.activeUsers ?? 0, [data]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="MRR" value={mrr} trend="+8.2%" />
        <MetricCard label="Active users" value={activeUsers} trend="+12.4%" />
        <MetricCard label="Churn" value="2.1%" trend="-0.4%" />
      </div>
      <RevenueChart data={data?.series ?? []} />
    </div>
  );
}`,
    },
    'src/components/RevenueChart.tsx': {
      language: 'typescript',
      content: `import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
        <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => '$' + v + 'k'} />
        <Tooltip
          contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
        />
        <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#grad)" strokeWidth={2} />
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
      </AreaChart>
    </ResponsiveContainer>
  );
}`,
    },
    'src/api.ts': {
      language: 'typescript',
      content: `const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function fetchMetrics() {
  const res = await fetch(BASE + '/api/insights/metrics');
  if (!res.ok) throw new Error('Failed to load metrics');
  return res.json();
}`,
    },
  };

  const codeRoomMap: Record<string, Record<string, { content: string; language: string }>> = {
    'frontend:React Components': reactFiles,
    'backend:Node Services': nodeFiles,
    'ai:Data Pipeline': pipelineFiles,
    'startup:Dashboard MVP': mvpFiles,
  };

  for (const [roomKey, files] of Object.entries(codeRoomMap)) {
    const room = roomsByKey[roomKey];
    if (!room) continue;
    for (const [filePath, def] of Object.entries(files)) {
      const name = filePath.split('/').pop()!;
      const parentPath = '/' + filePath.split('/').slice(0, -1).join('/');
      const normalizedParent = parentPath === '/' ? '/' : parentPath;
      await CodeDocument.create({
        name,
        path: `/${filePath}`,
        content: def.content,
        language: def.language,
        room: room._id,
        workspace: room.workspace,
        createdBy: alex._id,
        lastEditedBy: alex._id,
        parentPath: normalizedParent,
        isFolder: false,
        isDeleted: false,
      });
    }
  }

  console.log('Creating chat messages...');
  const chatThreads: Record<string, { sender: string; content: string; type?: string; minutes?: number; replyTo?: string }[]> = {
    'frontend:UI Wireframe': [
      { sender: 'alex@syncspace.demo', content: 'Morning team 👋 I pushed the updated wireframe for the login flow.', minutes: 148 },
      { sender: 'sofia@syncspace.dev', content: 'Nice! The spacing on the onboarding step looks much better now.', minutes: 130 },
      { sender: 'daniel@syncspace.dev', content: 'I can start building the components tomorrow morning.', minutes: 118 },
      { sender: 'mia@syncspace.dev', content: 'Should we also cover the password reset screen in this pass?', minutes: 95 },
      { sender: 'alex@syncspace.demo', content: 'Good catch — reset flow is mocked on the right side, take a look 🔍', minutes: 80 },
      { sender: 'sofia@syncspace.dev', content: 'LGTM, let me add the empty states before we finalize.', minutes: 42, replyTo: 'mia@syncspace.dev' },
      { sender: 'daniel@syncspace.dev', content: '🎉', type: 'emoji', minutes: 30 },
    ],
    'frontend:Design Review': [
      { sender: 'marcus@syncspace.dev', content: 'Review comments are in — mostly about spacing tokens.', minutes: 200 },
      { sender: 'sofia@syncspace.dev', content: 'Thanks Marcus! Updating the scale to a 4px base grid.', minutes: 175 },
      { sender: 'alex@syncspace.demo', content: 'Can we include the new size variants for buttons too?', minutes: 120 },
      { sender: 'sofia@syncspace.dev', content: 'Yes, adding sm / md / lg today.', minutes: 100 },
    ],
    'ai:Model Architecture': [
      { sender: 'emma@syncspace.dev', content: 'Offline eval is at NDCG@10 = 0.68 📈', minutes: 260 },
      { sender: 'alex@syncspace.demo', content: 'Solid progress. What is blocking 0.72?', minutes: 230 },
      { sender: 'liam@syncspace.dev', content: 'Feature freshness — we only update embeddings nightly.', minutes: 205 },
      { sender: 'priya@syncspace.dev', content: 'Switching to 4-hour refreshes should close most of the gap.', minutes: 180 },
      { sender: 'emma@syncspace.dev', content: 'Planning to kick off the A/B test on 5% traffic Friday.', minutes: 60 },
    ],
    'backend:API Design': [
      { sender: 'liam@syncspace.dev', content: 'Auth middleware is up — JWT + refresh rotation done ✅', minutes: 320 },
      { sender: 'alex@syncspace.demo', content: 'Great. Can you also add rate limiting to the /api/rooms routes?', minutes: 290 },
      { sender: 'noah@syncspace.dev', content: 'Adding Redis-backed limiter later today.', minutes: 250 },
      { sender: 'priya@syncspace.dev', content: 'OpenAPI spec is in the repo now, regenerate after changes.', minutes: 150 },
    ],
    'marketing:Q3 Campaign': [
      { sender: 'aisha@syncspace.dev', content: 'Teaser drops Tuesday — draft is in the Content Calendar 📅', minutes: 180 },
      { sender: 'emma@syncspace.dev', content: 'I pulled the engagement numbers from last quarter as a baseline.', minutes: 150 },
      { sender: 'alex@syncspace.demo', content: 'Love it. Let’s target 15k signups for the quarter.', minutes: 90 },
      { sender: 'aisha@syncspace.dev', content: 'On it. Paid plan is approved too. 🚀', minutes: 45 },
    ],
    'startup:Product Roadmap': [
      { sender: 'marcus@syncspace.dev', content: 'Moving the investor dashboard MVP to August 15.', minutes: 190 },
      { sender: 'daniel@syncspace.dev', content: 'Fine by me — gives us room for the charts polish.', minutes: 160 },
      { sender: 'priya@syncspace.dev', content: 'Backend for the metrics endpoint will be ready Friday.', minutes: 110 },
    ],
    'college:Project Brainstorm': [
      { sender: 'daniel@syncspace.dev', content: 'Prof approved our distributed consensus topic 🎉', minutes: 400 },
      { sender: 'sofia@syncspace.dev', content: 'Great news! Let’s split the report sections this week.', minutes: 360 },
      { sender: 'mia@syncspace.dev', content: 'I’ll take the fault-tolerance chapter.', minutes: 320 },
      { sender: 'alex@syncspace.demo', content: 'I’ll handle the simulation experiments then.', minutes: 280 },
    ],
    'design:Design System': [
      { sender: 'sofia@syncspace.dev', content: 'Color palette v2 is up — oklch based, 12 stops per hue.', minutes: 210 },
      { sender: 'alex@syncspace.demo', content: 'Contrast ratios all pass AA on the new scale?', minutes: 185 },
      { sender: 'sofia@syncspace.dev', content: 'Checked the 12 pairs — all pass, even the lightest gray.', minutes: 140 },
    ],
  };

  for (const [roomKey, thread] of Object.entries(chatThreads)) {
    const room = roomsByKey[roomKey];
    if (!room) continue;
    const idsBySender: Record<string, string> = {};
    for (let i = 0; i < thread.length; i++) {
      const m = thread[i];
      const sender = usersByEmail[m.sender]._id;
      const replyToId = m.replyTo ? idsBySender[m.replyTo] : undefined;
      const msg = await ChatMessage.create({
        room: room._id,
        sender,
        content: m.content,
        type: (m.type as 'text' | 'emoji' | 'system') || 'text',
        replyTo: replyToId,
        seenBy: [alex._id, sender],
      });
      idsBySender[m.sender] = msg._id.toString();
      await ChatMessage.updateOne({ _id: msg._id }, { $set: { createdAt: minutesAgo(m.minutes ?? i + 1) } });
    }
  }

  console.log('Creating tasks...');
  const taskDefs: Record<string, any[]> = {
    frontend: [
      { title: 'Build login flow components', description: 'Email + password form with validation and Google OAuth button.', status: 'completed', priority: 'high', labels: ['frontend', 'auth'], dueIn: -6, assignee: 'daniel@syncspace.dev', checklist: [{ text: 'Form validation', done: true }, { text: 'OAuth button', done: true }] },
      { title: 'Wire onboarding wizard to API', description: 'Connect the three-step onboarding to the /api/onboarding endpoint.', status: 'in-progress', priority: 'high', labels: ['frontend', 'api'], dueIn: 2, assignee: 'daniel@syncspace.dev', checklist: [{ text: 'API client', done: true }, { text: 'Error states', done: false }] },
      { title: 'Fix sidebar collapse on mobile', description: 'Hamburger menu should overlay instead of pushing content.', status: 'review', priority: 'medium', labels: ['ui', 'responsive'], dueIn: 1, assignee: 'mia@syncspace.dev' },
      { title: 'Add empty states to dashboard cards', description: 'Nice illustrations + CTA for empty workspaces and rooms.', status: 'todo', priority: 'low', labels: ['ui', 'polish'], dueIn: 4, assignee: 'sofia@syncspace.dev' },
      { title: 'Set up Storybook for component library', description: 'Publish the library so designers can browse variants.', status: 'todo', priority: 'medium', labels: ['tooling', 'components'], dueIn: 6, assignee: 'daniel@syncspace.dev' },
    ],
    backend: [
      { title: 'Implement refresh token rotation', description: 'Rotate the refresh token on every use, revoke on reuse.', status: 'completed', priority: 'urgent', labels: ['auth', 'security'], dueIn: -3, assignee: 'liam@syncspace.dev', checklist: [{ text: 'Rotation logic', done: true }, { text: 'Reuse detection', done: true }] },
      { title: 'Add rate limiting to public routes', description: '100 req/min per IP on /api/rooms and /api/files.', status: 'in-progress', priority: 'high', labels: ['api', 'security'], dueIn: 1, assignee: 'noah@syncspace.dev' },
      { title: 'Write integration tests for meetings API', description: 'Cover create, start, join and stats endpoints.', status: 'in-progress', priority: 'medium', labels: ['testing'], dueIn: 3, assignee: 'priya@syncspace.dev' },
      { title: 'Optimize member list query', description: 'The paginated member query is slow above 500 members.', status: 'todo', priority: 'medium', labels: ['performance'], dueIn: 5, assignee: 'liam@syncspace.dev' },
    ],
    ai: [
      { title: 'Ship nightly embedding refresh', description: 'Move from 24h to 4h refresh for user + item embeddings.', status: 'in-progress', priority: 'high', labels: ['ml', 'pipeline'], dueIn: 2, assignee: 'priya@syncspace.dev', checklist: [{ text: 'Incremental update', done: true }, { text: 'Backfill script', done: false }] },
      { title: 'Run offline eval for ranker v3', description: 'Compare NDCG@10 vs v2 on the frozen test set.', status: 'review', priority: 'high', labels: ['ml', 'eval'], dueIn: 0, assignee: 'emma@syncspace.dev' },
      { title: 'Launch A/B test on 5% traffic', description: 'Randomized split, track engagement and retention for 2 weeks.', status: 'todo', priority: 'urgent', labels: ['experiment'], dueIn: 3, assignee: 'emma@syncspace.dev' },
      { title: 'Document candidate generation', description: 'Write the design doc for the HNSW index config.', status: 'todo', priority: 'low', labels: ['docs'], dueIn: 7, assignee: 'liam@syncspace.dev' },
    ],
    marketing: [
      { title: 'Publish teaser for Q3 campaign', description: 'TikTok + Instagram Reels teaser, 15s cutdown.', status: 'completed', priority: 'high', labels: ['social'], dueIn: -1, assignee: 'aisha@syncspace.dev' },
      { title: 'Draft welcome email series', description: '3-email onboarding sequence with product tour.', status: 'in-progress', priority: 'medium', labels: ['email'], dueIn: 2, assignee: 'aisha@syncspace.dev' },
      { title: 'Set up retargeting audience', description: '7-day retargeting for visitors who viewed pricing.', status: 'todo', priority: 'medium', labels: ['ads'], dueIn: 4, assignee: 'aisha@syncspace.dev' },
    ],
    startup: [
      { title: 'Build MRR chart component', description: 'Recharts area chart with monthly trend + tooltip.', status: 'completed', priority: 'high', labels: ['dashboard'], dueIn: -2, assignee: 'daniel@syncspace.dev' },
      { title: 'Expose /api/insights/metrics', description: 'Aggregate MRR, active users and churn from events.', status: 'in-progress', priority: 'high', labels: ['backend'], dueIn: 1, assignee: 'priya@syncspace.dev' },
      { title: 'Investor demo script', description: '10-minute walkthrough for the Friday board call.', status: 'todo', priority: 'high', labels: ['demo'], dueIn: 2, assignee: 'marcus@syncspace.dev' },
    ],
    design: [
      { title: 'Finalize color palette v2', description: 'oklch based 12-stop scale, all AA compliant.', status: 'completed', priority: 'high', labels: ['design-system'], dueIn: -4, assignee: 'sofia@syncspace.dev' },
      { title: 'Add button size variants', description: 'sm / md / lg with icon support.', status: 'in-progress', priority: 'medium', labels: ['components'], dueIn: 2, assignee: 'sofia@syncspace.dev' },
      { title: 'Audit dark mode contrast', description: 'Check all component surfaces against AA.', status: 'todo', priority: 'medium', labels: ['a11y'], dueIn: 5, assignee: 'mia@syncspace.dev' },
    ],
    college: [
      { title: 'Write fault-tolerance chapter', description: 'Section 4 — leader election and log replication under failure.', status: 'in-progress', priority: 'high', labels: ['report'], dueIn: 5, assignee: 'mia@syncspace.dev' },
      { title: 'Simulate consensus experiments', description: 'Raft simulation on 5 nodes with random partitions.', status: 'todo', priority: 'high', labels: ['experiment'], dueIn: 7, assignee: 'alex@syncspace.demo' },
      { title: 'Collect citations for related work', description: '10+ sources on distributed consensus algorithms.', status: 'completed', priority: 'medium', labels: ['report'], dueIn: -2, assignee: 'daniel@syncspace.dev' },
    ],
  };

  const allTasks: any[] = [];
  for (const [wsKey, defs] of Object.entries(taskDefs)) {
    const ws = workspaceDocs[wsKey];
    for (let i = 0; i < defs.length; i++) {
      const t = defs[i];
      const assignee = t.assignee ? usersByEmail[t.assignee]._id : undefined;
      const task = await Task.create({
        title: t.title,
        description: t.description,
        workspace: ws._id,
        creator: alex._id,
        assignee,
        status: t.status,
        priority: t.priority,
        labels: t.labels,
        dueDate: t.dueIn >= 0 ? inDays(t.dueIn) : daysAgo(-t.dueIn),
        checklist: t.checklist || [],
        order: i,
      });
      allTasks.push(task);
    }
  }

  const commentDefs: { title: string; by: string; content: string; minutes: number }[] = [
    { title: 'Fix sidebar collapse on mobile', by: 'alex@syncspace.demo', content: 'Sofia has the mockup — ping her if the breakpoint is unclear.', minutes: 200 },
    { title: 'Fix sidebar collapse on mobile', by: 'mia@syncspace.dev', content: 'Will check the breakpoint and PR by EOD ✅', minutes: 150 },
    { title: 'Add rate limiting to public routes', by: 'noah@syncspace.dev', content: 'Using the token bucket package, tests included.', minutes: 120 },
    { title: 'Launch A/B test on 5% traffic', by: 'emma@syncspace.dev', content: 'Variant assignment is deterministic on user_id — no leakage.', minutes: 90 },
    { title: 'Investor demo script', by: 'marcus@syncspace.dev', content: 'Draft v1 ready, review before Thursday.', minutes: 70 },
  ];
  for (const c of commentDefs) {
    const task = allTasks.find((t) => t.title === c.title);
    if (!task) continue;
    const comment = await TaskComment.create({
      task: task._id,
      author: usersByEmail[c.by]._id,
      content: c.content,
    });
    await TaskComment.updateOne({ _id: comment._id }, { $set: { createdAt: minutesAgo(c.minutes) } });
  }

  console.log('Creating files...');
  interface FileDef {
    ws: string;
    name: string;
    mimeType: string;
    size: number;
    folder: string;
    by: string;
    minutes: number;
  }
  const fileDefs: FileDef[] = [
    { ws: 'frontend', name: 'design-system.fig', mimeType: 'application/fig', size: 4_200_000, folder: '/designs', by: 'sofia@syncspace.dev', minutes: 60 * 26 },
    { ws: 'frontend', name: 'brand-logo.svg', mimeType: 'image/svg+xml', size: 42_000, folder: '/assets', by: 'sofia@syncspace.dev', minutes: 60 * 50 },
    { ws: 'frontend', name: 'api-docs.pdf', mimeType: 'application/pdf', size: 890_000, folder: '/docs', by: 'alex@syncspace.demo', minutes: 60 * 22 },
    { ws: 'frontend', name: 'sprint-notes.md', mimeType: 'text/markdown', size: 12_500, folder: '/meetings', by: 'marcus@syncspace.dev', minutes: 60 * 30 },
    { ws: 'frontend', name: 'component-library.zip', mimeType: 'application/zip', size: 9_800_000, folder: '/', by: 'daniel@syncspace.dev', minutes: 60 * 90 },
    { ws: 'ai', name: 'dataset.csv', mimeType: 'text/csv', size: 22_400_000, folder: '/datasets', by: 'emma@syncspace.dev', minutes: 60 * 40 },
    { ws: 'ai', name: 'model-card.md', mimeType: 'text/markdown', size: 18_000, folder: '/docs', by: 'priya@syncspace.dev', minutes: 60 * 70 },
    { ws: 'ai', name: 'training-logs.json', mimeType: 'application/json', size: 3_100_000, folder: '/logs', by: 'liam@syncspace.dev', minutes: 60 * 12 },
    { ws: 'ai', name: 'architecture.png', mimeType: 'image/png', size: 1_400_000, folder: '/', by: 'alex@syncspace.demo', minutes: 60 * 55 },
    { ws: 'ai', name: 'benchmark-results.pdf', mimeType: 'application/pdf', size: 640_000, folder: '/docs', by: 'emma@syncspace.dev', minutes: 60 * 33 },
    { ws: 'backend', name: 'openapi.yaml', mimeType: 'application/yaml', size: 88_000, folder: '/api', by: 'priya@syncspace.dev', minutes: 60 * 20 },
    { ws: 'backend', name: 'database-schema.png', mimeType: 'image/png', size: 520_000, folder: '/docs', by: 'liam@syncspace.dev', minutes: 60 * 44 },
    { ws: 'backend', name: 'rate-limiter.ts', mimeType: 'text/x-typescript', size: 6_400, folder: '/src', by: 'noah@syncspace.dev', minutes: 60 * 8 },
    { ws: 'backend', name: 'api-benchmark.csv', mimeType: 'text/csv', size: 240_000, folder: '/reports', by: 'noah@syncspace.dev', minutes: 60 * 18 },
    { ws: 'marketing', name: 'q3-campaign.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: 5_600_000, folder: '/campaigns', by: 'aisha@syncspace.dev', minutes: 60 * 28 },
    { ws: 'marketing', name: 'content-calendar.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 98_000, folder: '/', by: 'aisha@syncspace.dev', minutes: 60 * 36 },
    { ws: 'marketing', name: 'teaser-thumbnail.png', mimeType: 'image/png', size: 1_900_000, folder: '/assets', by: 'aisha@syncspace.dev', minutes: 60 * 6 },
    { ws: 'startup', name: 'investor-deck.pdf', mimeType: 'application/pdf', size: 3_300_000, folder: '/investor', by: 'marcus@syncspace.dev', minutes: 60 * 15 },
    { ws: 'startup', name: 'mrr-trend.png', mimeType: 'image/png', size: 760_000, folder: '/charts', by: 'daniel@syncspace.dev', minutes: 60 * 4 },
    { ws: 'startup', name: 'pricing-data.json', mimeType: 'application/json', size: 24_000, folder: '/', by: 'priya@syncspace.dev', minutes: 60 * 62 },
    { ws: 'design', name: 'typography-scale.pdf', mimeType: 'application/pdf', size: 480_000, folder: '/docs', by: 'sofia@syncspace.dev', minutes: 60 * 47 },
    { ws: 'design', name: 'color-tokens.json', mimeType: 'application/json', size: 14_000, folder: '/tokens', by: 'sofia@syncspace.dev', minutes: 60 * 31 },
    { ws: 'design', name: 'icons-pack.zip', mimeType: 'application/zip', size: 2_100_000, folder: '/', by: 'sofia@syncspace.dev', minutes: 60 * 78 },
    { ws: 'college', name: 'report-chapter4.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 420_000, folder: '/report', by: 'mia@syncspace.dev', minutes: 60 * 11 },
    { ws: 'college', name: 'simulation-results.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 310_000, folder: '/simulation', by: 'alex@syncspace.demo', minutes: 60 * 3 },
  ];

  for (const f of fileDefs) {
    const ws = workspaceDocs[f.ws];
    const file = await UploadedFile.create({
      name: f.name,
      originalName: f.name,
      mimeType: f.mimeType,
      size: f.size,
      path: `/uploads/${f.name}`,
      workspace: ws._id,
      folder: f.folder,
      uploader: usersByEmail[f.by]._id,
    });
    await UploadedFile.updateOne({ _id: file._id }, { $set: { createdAt: minutesAgo(f.minutes) } });
  }

  console.log('Creating invites...');
  await Invite.create([
    { email: 'jordan.reyes@syncspace.dev', workspaceId: workspaceDocs.frontend._id, invitedBy: alex._id, role: 'member', status: 'pending', expiresAt: inDays(5) },
    { email: 'yuki.tanaka@syncspace.dev', workspaceId: workspaceDocs.ai._id, invitedBy: alex._id, role: 'member', status: 'pending', expiresAt: inDays(4) },
    { email: 'maria.fernandez@syncspace.dev', workspaceId: workspaceDocs.startup._id, invitedBy: alex._id, role: 'admin', status: 'pending', expiresAt: inDays(6) },
  ]);

  console.log('Creating meetings...');
  const meetingDefs = [
    {
      key: 'frontend',
      name: 'Sprint Planning — Frontend',
      description: 'Plan sprint 14: onboarding wizard, Storybook setup and polish.',
      status: 'completed',
      scheduledAt: daysAgo(6),
      duration: 45,
      agenda: 'Sprint goals • Story estimates • Risk review',
      participants: ['daniel@syncspace.dev', 'sofia@syncspace.dev', 'mia@syncspace.dev'],
      endedAt: daysAgo(6),
    },
    {
      key: 'backend',
      name: 'API Design Review',
      description: 'Walk through the /api/insights endpoints before implementation.',
      status: 'completed',
      scheduledAt: daysAgo(3),
      duration: 30,
      agenda: 'Endpoint contracts • Rate limits • Error format',
      participants: ['priya@syncspace.dev', 'liam@syncspace.dev', 'noah@syncspace.dev'],
      endedAt: daysAgo(3),
    },
    {
      key: 'design',
      name: 'Design System Audit',
      description: 'Review contrast, spacing tokens and component coverage.',
      status: 'completed',
      scheduledAt: daysAgo(1),
      duration: 40,
      agenda: 'Palette v2 • Type scale • A11y checklists',
      participants: ['sofia@syncspace.dev', 'daniel@syncspace.dev', 'mia@syncspace.dev'],
      endedAt: daysAgo(1),
    },
    {
      key: 'marketing',
      name: 'Q3 Campaign Sync',
      description: 'Align on teaser launch, influencer list and budget pacing.',
      status: 'ongoing',
      scheduledAt: hoursAgo(1),
      duration: 30,
      agenda: 'Teaser status • Paid budget • Influencer outreach',
      participants: ['aisha@syncspace.dev', 'emma@syncspace.dev', 'marcus@syncspace.dev'],
    },
    {
      key: 'ai',
      name: 'AI Model Standup',
      description: 'Daily sync on embedding refresh and A/B test rollout.',
      status: 'scheduled',
      scheduledAt: inDays(1),
      duration: 15,
      agenda: 'Refresh status • Eval results • Blockers',
      participants: ['priya@syncspace.dev', 'emma@syncspace.dev', 'liam@syncspace.dev'],
    },
    {
      key: 'startup',
      name: 'Investor Demo Rehearsal',
      description: 'Dry run of the 10-minute dashboard walkthrough for the board call.',
      status: 'scheduled',
      scheduledAt: inDays(2),
      duration: 60,
      agenda: 'Story flow • Metrics narration • Q&A',
      participants: ['daniel@syncspace.dev', 'priya@syncspace.dev', 'marcus@syncspace.dev'],
    },
    {
      key: 'college',
      name: 'Report Milestone Check',
      description: 'Check chapter progress and align on the submission checklist.',
      status: 'scheduled',
      scheduledAt: inDays(4),
      duration: 30,
      agenda: 'Chapter status • Citation format • Review slots',
      participants: ['daniel@syncspace.dev', 'sofia@syncspace.dev', 'mia@syncspace.dev'],
    },
  ];

  for (const m of meetingDefs) {
    const ws = workspaceDocs[m.key];
    const participantIds = m.participants.map((e) => usersByEmail[e]._id);
    const code = 'MS-' + Math.floor(1000 + Math.random() * 9000);
    await Meeting.create({
      name: m.name,
      description: m.description,
      workspace: ws._id,
      host: alex._id,
      participants: participantIds,
      scheduledAt: m.scheduledAt,
      duration: m.duration,
      status: m.status as 'scheduled' | 'ongoing' | 'completed' | 'cancelled',
      agenda: m.agenda,
      meetingCode: code,
      endedAt: m.endedAt,
    });
  }

  console.log('Creating activities...');
  const activityDefs: {
    action: string;
    entityType: 'workspace' | 'room' | 'member' | 'invite' | 'auth' | 'task' | 'file';
    entityName?: string;
    minutes: number;
    by: string;
  }[] = [
    { action: 'created workspace', entityType: 'workspace', entityName: 'AI Research Lab', minutes: 60 * 24 * 40, by: DEMO_EMAIL },
    { action: 'created workspace', entityType: 'workspace', entityName: 'Frontend Team', minutes: 60 * 24 * 32, by: DEMO_EMAIL },
    { action: 'created workspace', entityType: 'workspace', entityName: 'UI Design', minutes: 60 * 24 * 20, by: DEMO_EMAIL },
    { action: 'created room', entityType: 'room', entityName: 'Model Architecture', minutes: 60 * 24 * 8, by: DEMO_EMAIL },
    { action: 'created room', entityType: 'room', entityName: 'UI Wireframe', minutes: 60 * 24 * 6, by: DEMO_EMAIL },
    { action: 'added member', entityType: 'member', entityName: 'Daniel Chen', minutes: 60 * 24 * 5, by: DEMO_EMAIL },
    { action: 'sent invite', entityType: 'invite', entityName: 'jordan.reyes@syncspace.dev', minutes: 60 * 24 * 4, by: DEMO_EMAIL },
    { action: 'uploaded file', entityType: 'file', entityName: 'architecture.png', minutes: 60 * 24 * 3, by: DEMO_EMAIL },
    { action: 'created task', entityType: 'task', entityName: 'Wire onboarding wizard to API', minutes: 60 * 24 * 2, by: DEMO_EMAIL },
    { action: 'completed task', entityType: 'task', entityName: 'Build login flow components', minutes: 60 * 24 * 1, by: DEMO_EMAIL },
    { action: 'sent message', entityType: 'room', entityName: 'UI Wireframe', minutes: 148, by: DEMO_EMAIL },
    { action: 'joined room', entityType: 'room', entityName: 'Q3 Campaign', minutes: 90, by: DEMO_EMAIL },
    { action: 'created task', entityType: 'task', entityName: 'Simulate consensus experiments', minutes: 60, by: DEMO_EMAIL },
  ];

  for (const a of activityDefs) {
    const act = await Activity.create({
      user: usersByEmail[a.by]._id,
      action: a.action as ActivityAction,
      entityType: a.entityType,
      entityName: a.entityName,
    });
    await Activity.updateOne({ _id: act._id }, { $set: { createdAt: minutesAgo(a.minutes) } });
  }

  console.log('Creating notifications...');
  const notificationDefs: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    entityType?: 'workspace' | 'room' | 'member' | 'invite' | 'activity';
    minutes: number;
    isRead: boolean;
  }[] = [
    { title: 'Meeting Started', message: 'Q3 Campaign Sync is live now — 4 participants joined.', type: 'success', entityType: 'room', minutes: 55, isRead: false },
    { title: 'Workspace Created', message: 'You created AI Research Lab.', type: 'success', entityType: 'workspace', minutes: 60 * 24 * 40, isRead: true },
    { title: 'File Uploaded', message: 'Emma Wilson uploaded dataset.csv to AI Research Lab.', type: 'info', entityType: 'workspace', minutes: 60 * 40, isRead: false },
    { title: 'Member Joined', message: 'Sofia Rodriguez joined Frontend Team.', type: 'success', entityType: 'member', minutes: 60 * 24 * 6, isRead: true },
    { title: 'Invite Accepted', message: 'Marcus Lee accepted your invite to Startup Dashboard.', type: 'success', entityType: 'invite', minutes: 60 * 24 * 2, isRead: false },
    { title: 'Room Created', message: 'You created "Model Architecture" in AI Research Lab.', type: 'info', entityType: 'room', minutes: 60 * 24 * 8, isRead: true },
    { title: 'Task Completed', message: 'Daniel Chen completed "Build login flow components".', type: 'info', entityType: 'activity', minutes: 60 * 24, isRead: false },
    { title: 'Meeting Scheduled', message: 'Investor Demo Rehearsal is scheduled for Friday.', type: 'info', entityType: 'room', minutes: 60 * 5, isRead: false },
    { title: 'New Comment', message: 'Noah Garcia commented on "Add rate limiting to public routes".', type: 'info', entityType: 'activity', minutes: 120, isRead: true },
  ];

  for (const n of notificationDefs) {
    const notif = await Notification.create({
      user: alex._id,
      title: n.title,
      message: n.message,
      type: n.type,
      entityType: n.entityType,
      isRead: n.isRead,
    });
    await Notification.updateOne({ _id: notif._id }, { $set: { createdAt: minutesAgo(n.minutes) } });
  }

  console.log('Creating presence markers...');
  const activeRoom = roomsByKey['marketing:Q3 Campaign'];
  if (activeRoom) {
    await RoomPresence.create([
      { room: activeRoom._id, user: alex._id, status: 'online', socketId: 'seed-socket-alex' },
      { room: activeRoom._id, user: usersByEmail['aisha@syncspace.dev']._id, status: 'online', socketId: 'seed-socket-aisha' },
      { room: activeRoom._id, user: usersByEmail['emma@syncspace.dev']._id, status: 'online', socketId: 'seed-socket-emma' },
    ]);
  }

  console.log('Seeding complete!');
  console.log('Demo account: alex@syncspace.demo / demo1234 (use "Try Demo" on the login page)');
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Seeding failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
