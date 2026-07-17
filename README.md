# SyncSpace

A real-time collaborative platform built with the MERN stack. Think Excalidraw meets VS Code Live Share — an enterprise-grade workspace where teams can collaborate on whiteboards, code, and documents simultaneously.

## Features (Day 1)

- **User Authentication** — Register, login, logout with JWT access + refresh token rotation
- **Password Reset** — Forgot password flow with secure token-based reset
- **Protected Routes** — Client-side route guards with automatic token refresh
- **Persistent Sessions** — Auth state persisted to localStorage with silent token renewal
- **Real-time Foundation** — Socket.io server configured for future collaborative features
- **Docker Support** — MongoDB, Redis, and app services via Docker Compose

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 8, Tailwind CSS 3, Redux Toolkit, TanStack Query, React Router 6 |
| Backend | Node.js, Express 5, TypeScript, Socket.io 4 |
| Database | MongoDB (Mongoose 9) |
| Auth | JWT (access + refresh tokens), bcryptjs, httpOnly cookies |
| Tooling | npm workspaces, Prettier, Husky, lint-staged, concurrently |
| DevOps | Docker, Docker Compose, MongoDB 7, Redis 7 |

## Project Structure

```
SyncSpace/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── features/        # Feature modules (auth, canvas, editor, collaboration)
│   │   ├── pages/           # Route-level page components
│   │   ├── services/        # API client and service layer
│   │   ├── store.ts         # Redux store configuration
│   │   └── types/           # Shared TypeScript types
│   ├── index.html
│   ├── vite.config.ts
│   └── tailwind.config.js
├── server/                  # Express backend
│   ├── src/
│   │   ├── configs/         # Database and service configuration
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, error handling
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic layer
│   │   ├── types/           # Shared TypeScript types
│   │   └── utils/           # Helpers (tokens, logger, async handler)
│   └── tsconfig.json
├── docker/                  # Dockerfiles for client and server
├── docs/                    # Documentation
├── scripts/                 # Build and utility scripts
├── docker-compose.yml       # Multi-service dev environment
└── package.json             # Root workspace config
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Docker & Docker Compose (optional)

### Installation

```bash
git clone https://github.com/your-username/SyncSpace.git
cd SyncSpace
npm install
```

### Environment Setup

Create environment files:

**server/.env**
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/syncspace
CLIENT_URL=http://localhost:5173
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

**client/.env**
```
VITE_API_URL=http://localhost:5000
```

### Run with Docker

```bash
docker compose up -d
```

### Run Locally

Start MongoDB first (via Docker or local install), then:

```bash
npm run dev
```

This starts both client (http://localhost:5173) and server (http://localhost:5000) concurrently.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client and server in development mode |
| `npm run build` | Build both client and server for production |
| `npm run lint` | Run Prettier checks across all workspaces |
| `npm run format` | Auto-format code with Prettier |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout (clears refresh token) |
| POST | `/api/auth/refresh-token` | Refresh access token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/me` | Get current user (requires auth) |

## Roadmap

- [ ] Collaborative whiteboard (Konva)
- [ ] Real-time code editor (Monaco)
- [ ] Socket.io room management
- [ ] User avatars and profiles
- [ ] Email verification
- [ ] Rate limiting and brute-force protection
- [ ] CI/CD pipeline
- [ ] End-to-end testing

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
