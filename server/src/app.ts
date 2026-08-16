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
import taskRoutes from './routes/task.js';
import fileRoutes from './routes/file.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeSocketHandlers } from './socket/whiteboardHandler.js';
import { initializeEditorHandlers } from './socket/editorHandler.js';
import codeDocumentRoutes from './routes/codeDocument.js';
import meetingRoutes from './routes/meeting.js';
import profileRoutes from './routes/profile.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
const httpServer = createServer(app);

const CONFIGURED_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const IS_DEV = process.env.NODE_ENV !== 'production';

// Allows any http://localhost:PORT (or 127.0.0.1) origin in development so a
// Vite port shift (e.g. 5173 -> 5174 when the default is busy) can never break
// CORS and take down registration/login. Production is locked to CORS_ORIGIN.
function corsOrigin(
  requestOrigin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void {
  if (!requestOrigin) {
    callback(null, true);
    return;
  }
  if (IS_DEV) {
    try {
      const { hostname } = new URL(requestOrigin);
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        callback(null, true);
        return;
      }
    } catch {
      // fall through to the configured origin below
    }
  }
  callback(null, requestOrigin === CONFIGURED_ORIGIN);
}

const corsOptions: cors.CorsOptions = { origin: corsOrigin, credentials: true };

export const io = new Server(httpServer, {
  cors: corsOptions,
});

app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/whiteboards', whiteboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/workspaces/:id/members', memberRoutes);
app.use('/api/workspaces/:id/invites', inviteRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/documents', codeDocumentRoutes);
app.use('/api/meetings', meetingRoutes);

initializeSocketHandlers(io);
initializeEditorHandlers(io);

app.use(errorHandler);

export default app;
