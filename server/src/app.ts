import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { logger } from './utils/logger.js';
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
import { authRateLimit, apiRateLimit } from './middleware/rateLimit.js';
import codeDocumentRoutes from './routes/codeDocument.js';
import meetingRoutes from './routes/meeting.js';
import profileRoutes from './routes/profile.js';
import dashboardRoutes from './routes/dashboard.js';
import sharedRoutes from './routes/shared.js';
import codeRunRoutes from './routes/codeRun.js';

const app = express();
const httpServer = createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        imgSrc: ["'self'", 'data:', 'https://unpkg.com'],
        fontSrc: ["'self'", 'https://unpkg.com'],
        connectSrc: ["'self'"],
      },
    },
  }),
);
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get('/', (_req, res) => {
  res.json({ success: true, message: 'SyncSpace API is running', version: '1.0.0' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const openApiSpec = JSON.parse(readFileSync(join(__dirname, 'configs', 'openapi.json'), 'utf-8'));

app.get('/api/docs/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});

app.get('/api/docs', (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>SyncSpace API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      color: #3b4151;
    }
    .topbar { display: none; }
    #swagger-ui .wrapper { max-width: 1200px; margin: 0 auto; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #3b4151 !important; }
    .swagger-ui .scheme-container { background: #f7f7f7 !important; box-shadow: none !important; border: 1px solid #e6e6e6; border-radius: 4px; padding: 16px; }
    .swagger-ui .opblock-tag { color: #3b4151 !important; border-bottom: 1px solid #e6e6e6 !important; }
    .swagger-ui .opblock .opblock-summary-description { color: #6b7280 !important; }
    .swagger-ui .opblock .opblock-section-header { background: #fafafa !important; }
    .swagger-ui .markdown p, .swagger-ui .markdown li,
    .swagger-ui .renderedMarkdown p, .swagger-ui .renderedMarkdown li { color: #3b4151 !important; }
    .swagger-ui .markdown code, .swagger-ui .renderedMarkdown code { background: #f3f4f6 !important; color: #e53e3e !important; }
    .swagger-ui .model-title { color: #3b4151 !important; }
    .swagger-ui .model { color: #6b7280 !important; }
    .swagger-ui table thead tr td, .swagger-ui table thead tr th { border-bottom: 1px solid #e6e6e6 !important; color: #6b7280 !important; }
    .swagger-ui .response-col_status { color: #3b4151 !important; }
    .header-bar {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-bottom: 1px solid #334155;
      padding: 20px 40px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .header-bar h1 { color: #06b6d4; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header-bar .version { background: rgba(6,182,212,0.15); color: #06b6d4; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; }
    .header-bar .links { display: flex; gap: 16px; }
    .header-bar .links a { color: #94a3b8; text-decoration: none; font-size: 13px; transition: color 0.2s; }
    .header-bar .links a:hover { color: #06b6d4; }
  </style>
</head>
<body>
  <div class="header-bar">
    <div style="display:flex;align-items:center;gap:16px;">
      <h1>SyncSpace API</h1>
      <span class="version">v1.0.0</span>
    </div>
    <div class="links">
      <a href="/" target="_blank">API Root</a>
      <a href="/api/health" target="_blank">Health Check</a>
      <a href="https://github.com/Inevitable-1/SyncSpace" target="_blank">GitHub</a>
    </div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs/openapi.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
      deepLinking: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 2,
      tryItOutEnabled: true,
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    });
  </script>
</body>
</html>`);
});

app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/profile', apiRateLimit, profileRoutes);
app.use('/api/dashboard', apiRateLimit, dashboardRoutes);
app.use('/api/workspaces', apiRateLimit, workspaceRoutes);
app.use('/api/rooms', apiRateLimit, roomRoutes);
app.use('/api/activities', apiRateLimit, activityRoutes);
app.use('/api/notifications', apiRateLimit, notificationRoutes);
app.use('/api/whiteboards', apiRateLimit, whiteboardRoutes);
app.use('/api/chat', apiRateLimit, chatRoutes);
app.use('/api/tasks', apiRateLimit, taskRoutes);
app.use('/api/files', apiRateLimit, fileRoutes);
app.use('/api/workspaces/:id/members', apiRateLimit, memberRoutes);
app.use('/api/workspaces/:id/invites', apiRateLimit, inviteRoutes);
app.use('/api/invites', apiRateLimit, inviteRoutes);
app.use('/api/documents', apiRateLimit, codeDocumentRoutes);
app.use('/api/meetings', apiRateLimit, meetingRoutes);
app.use('/api/shared', apiRateLimit, sharedRoutes);
app.use('/api/code/run', apiRateLimit, codeRunRoutes);

initializeSocketHandlers(io);
initializeEditorHandlers(io);

app.use(errorHandler);

function printRoutes(): void {
  const registeredRoutes = [
    'GET     /',
    'GET     /api/health',
    'GET     /api/docs',
    'GET     /api/docs/openapi.json',
    'ALL     /api/auth/*',
    'ALL     /api/profile/*',
    'ALL     /api/dashboard/*',
    'ALL     /api/workspaces/*',
    'ALL     /api/rooms/*',
    'ALL     /api/activities/*',
    'ALL     /api/notifications/*',
    'ALL     /api/whiteboards/*',
    'ALL     /api/chat/*',
    'ALL     /api/tasks/*',
    'ALL     /api/files/*',
    'ALL     /api/workspaces/:id/members/*',
    'ALL     /api/workspaces/:id/invites/*',
    'ALL     /api/invites/*',
    'ALL     /api/documents/*',
    'ALL     /api/meetings/*',
  ];
  logger.info('\n=== Registered Routes ===');
  registeredRoutes.forEach((r) => logger.info(`  ${r}`));
  logger.info(`\n  Total: ${registeredRoutes.length} route groups\n`);
}

export { printRoutes };

export default app;
