# Week 1 — Foundation & Authentication

> **Focus:** Project setup, core architecture, authentication and the dashboard foundation.

## Goals

- Stand up a production-grade monorepo with a React + TypeScript client and an Express + TypeScript API.
- Ship a secure JWT authentication system (register, login, refresh tokens, password reset).
- Lay the foundation of the dashboard that everything else would hang off.
- Integrate MongoDB as the primary datastore.

## What was built

### Project setup

- **Monorepo with npm workspaces** — a single `package.json` orchestrating `client/` and `server/` with shared scripts (`dev`, `build`, `lint`, `typecheck`, `format`).
- **Vite + React 18 + TypeScript 7** for the frontend, with path aliases, ESLint-friendly Prettier config and Tailwind CSS for styling.
- **Express 5 + TypeScript** for the backend, with `tsx watch` for instant reload in development.
- **Docker Compose** to run MongoDB and Redis locally, plus containerized client/server images.

### Authentication

- Email + password registration and login with **bcrypt** password hashing.
- **JWT access tokens + rotating refresh tokens** stored as httpOnly cookies.
- `POST /api/auth/refresh-token` for silent session renewal and `POST /api/auth/logout` for revocation.
- Password reset flow (`forgot-password` / `reset-password`) with hashed one-time tokens.
- Centralized `auth` middleware protecting every route that requires a session.

### Dashboard foundation

- **Protected routes** with a persistent session restored from `localStorage`.
- Base layout shell with sidebar navigation, top bar and responsive containers.
- Redux Toolkit store with the `auth` slice wired to the API layer.
- Reusable UI primitives (Button, Card, Input, Modal, Avatar, Spinner, Toast).

### MongoDB integration

- Mongoose 9 models with proper indexes, timestamps and validation.
- `configs/db.ts` connection lifecycle with graceful logging via Winston.
- Repository pattern (`repositories/`) + service layer (`services/`) to keep controllers thin.

## Deliverables

- Monorepo scaffolding with client, server and tooling.
- Full authentication API (7 endpoints) + auth UI pages.
- Protected dashboard shell.
- Dockerized MongoDB + Redis for local development.

## Key decisions

- **httpOnly cookies for refresh tokens** — prevents XSS token theft while keeping access tokens in memory.
- **JWT rotation on refresh** — each refresh invalidates the previous token, limiting replay windows.
- **Repository + service pattern** on the server — keeps business logic testable and controllers focused.
