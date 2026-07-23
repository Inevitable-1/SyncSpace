import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import workspaceRoutes from './routes/workspace.js';
import roomRoutes from './routes/room.js';
import activityRoutes from './routes/activity.js';
import notificationRoutes from './routes/notification.js';
import whiteboardRoutes from './routes/whiteboard.js';
import memberRoutes from './routes/member.js';
import inviteRoutes from './routes/invite.js';
import chatRoutes from './routes/chat.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeSocketHandlers } from './socket/whiteboardHandler.js';

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/whiteboards', whiteboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/workspaces/:id/members', memberRoutes);
app.use('/api/workspaces/:id/invites', inviteRoutes);
app.use('/api/invites', inviteRoutes);

initializeSocketHandlers(io);

app.use(errorHandler);

export default app;
