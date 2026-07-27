# Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- MongoDB 7+ (Docker or local)
- Redis 7+ (Docker or local)

## Docker Deployment (Recommended)

### Quick Start

```bash
git clone https://github.com/Inevitable-1/SyncSpace.git
cd SyncSpace
docker compose up -d
```

This starts:

- **MongoDB** on `localhost:27017`
- **Redis** on `localhost:6379`
- **Server** on `localhost:5000`
- **Client** on `localhost:5173`

### Production Build

```bash
# Build client
cd client && npm install && npm run build

# Build server
cd server && npm install && npm run build

# Start server in production mode
cd server && NODE_ENV=production node dist/server.js
```

## Local Development

### Start Services (Docker)

```bash
docker compose up -d mongo redis
```

### Start Application

```bash
npm install
npm run dev
```

This runs both client and server concurrently with hot-reload.

### Environment Variables

**Server (.env):**

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/syncspace
CLIENT_URL=http://localhost:5173
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

**Client (.env):**

```
VITE_API_URL=http://localhost:5000
```

## Cloud Deployment

### Backend (Railway / Render / Fly.io)

1. Set environment variables:
   - `MONGODB_URI` — MongoDB Atlas connection string
   - `JWT_SECRET` — Random 64-char string
   - `CLIENT_URL` — Your deployed frontend URL
   - `NODE_ENV=production`

2. Build and start:
   ```bash
   npm install
   cd server && npm run build
   NODE_ENV=production node dist/server.js
   ```

### Frontend (Vercel / Netlify)

1. Set environment variable:
   - `VITE_API_URL` — Your deployed backend URL

2. Build settings:
   - Build command: `cd client && npm install && npm run build`
   - Output directory: `client/dist`

### Database (MongoDB Atlas)

1. Create a free cluster at [mongodb.com](https://mongodb.com)
2. Create a database user
3. Whitelist your IP addresses
4. Get the connection string and set it as `MONGODB_URI`

## Production Checklist

- [ ] Set strong `JWT_SECRET` (min 32 chars)
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS for production domains
- [ ] Enable MongoDB Atlas authentication
- [ ] Set up Redis for session caching (optional)
- [ ] Configure rate limiting
- [ ] Set up error monitoring (Sentry)
- [ ] Enable HTTPS
- [ ] Configure logging (Winston → file/S3)

## Monitoring

### Health Check

```bash
curl http://localhost:5000/api/health
# Response: { "status": "ok", "timestamp": "2026-07-27T..." }
```

### Logs

Server logs are output to stdout in JSON format via Winston. In production, pipe to a log aggregation service.

## Scaling Considerations

1. **Horizontal scaling** — Add Socket.IO Redis adapter for multi-server WebSocket
2. **Database** — MongoDB replica set for high availability
3. **CDN** — Serve static assets via CloudFront/Cloudflare
4. **Load balancer** — nginx or cloud load balancer in front of multiple server instances
