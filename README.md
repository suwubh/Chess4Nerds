# Chess4Nerds

A real-time multiplayer chess platform built as a TypeScript monorepo.

[![Made with TypeScript](https://img.shields.io/badge/Made%20with-TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Built with Turborepo](https://img.shields.io/badge/Built%20with-Turborepo-EF4444?style=flat-square&logo=turborepo)](https://turbo.build/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

## Overview

Chess4Nerds lets two players play chess online over WebSockets. It includes
guest play, OAuth login (Google / GitHub), an Elo-based rating system,
per-player stats, a global leaderboard, game history, and a local engine for
playing against the computer.

## Features

- Real-time multiplayer over WebSockets (chess.js for validation)
- Guest accounts and OAuth login (Google / GitHub) via Passport
- Elo rating updates after each completed game
- Leaderboard and per-player stats / game history
- Single-player mode against `js-chess-engine` with adjustable difficulty
- Resign and draw-offer flows, in-game chat, board themes

## Tech stack

- **Frontend** — React 18, Vite, TypeScript, Tailwind CSS, Recoil, chess.js
- **Backend** — Node.js, Express, Passport (Google / GitHub OAuth), JWT
- **WebSocket server** — `ws`, JWT auth, chess.js for server-side validation
- **Database** — PostgreSQL via Prisma
- **Monorepo** — Turborepo with shared `db`, `store`, `ui` packages

## Repository layout

```
chess4nerds/
├── apps/
│   ├── backend/   # Express REST + OAuth + leaderboard / history endpoints
│   ├── frontend/  # React + Vite client
│   ├── ws/        # WebSocket game server
│   └── native/    # Experimental React Native shell (not actively developed)
├── packages/
│   ├── db/        # Prisma schema + generated client
│   ├── store/     # Shared Recoil atoms / hooks
│   └── ui/        # Shared UI primitives
```

## Prerequisites

- Node.js 18+
- npm (or yarn)
- PostgreSQL (local or hosted)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create environment files** (see [Environment variables](#environment-variables))

3. **Generate the Prisma client and push the schema**

   ```bash
   cd packages/db
   npx prisma generate
   npx prisma db push
   ```

4. **Start everything in dev mode** (from the repo root)

   ```bash
   npm run dev
   ```

   This launches:
   - Frontend at `http://localhost:5173` (Vite default)
   - Backend API at `http://localhost:3000`
   - WebSocket server at `ws://localhost:8080`

## Environment variables

### `apps/backend/.env`

```env
DATABASE_URL="postgresql://user:password@localhost:5432/chess4nerds"

# Required
JWT_SECRET="change-me"
COOKIE_SECRET="change-me"

# OAuth (required to start the server)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# Where to redirect after a successful OAuth login (your frontend origin)
AUTH_REDIRECT_URL="http://localhost:5173"

# Comma-separated list of allowed CORS origins
ALLOWED_ORIGINS="http://localhost:5173"

PORT=3000
```

### `apps/ws/.env`

```env
DATABASE_URL="postgresql://user:password@localhost:5432/chess4nerds"

# Must match the backend
JWT_SECRET="change-me"

WS_PORT=8080
```

### `apps/frontend/.env`

```env
VITE_APP_BACKEND_URL="http://localhost:3000"
VITE_APP_WS_URL="ws://localhost:8080"
```

### `packages/db/.env`

```env
DATABASE_URL="postgresql://user:password@localhost:5432/chess4nerds"
```

## Available scripts

| Command          | What it does                                  |
| ---------------- | --------------------------------------------- |
| `npm run dev`    | Run all apps in development mode (Turborepo)  |
| `npm run build`  | Build every app for production                |

Individual apps also expose their own `dev` / `build` scripts (see each
`package.json`).

## How it works

- The **frontend** maintains a Recoil-backed `user` atom whose default selector
  hits `/auth/refresh` to restore a logged-in or guest user from cookies.
- The **WebSocket server** authenticates every connection using the JWT issued
  by the backend. The `GameManager` matches the first waiting player with the
  next incoming one, creating a `Game` instance per match.
- Each `Game` keeps a `chess.js` board, persists moves to Postgres, and emits
  events (`init_game`, `move`, `game_ended`, etc.) back to both players.
- When a game ends, ratings are recomputed via the Elo formula and the
  leaderboard / per-player stats reflect the change immediately.

## Roadmap

- [x] Real-time multiplayer
- [x] Google / GitHub OAuth
- [x] Leaderboard + match history
- [x] Elo ratings
- [x] Computer opponent
- [ ] Tournaments
- [ ] Game replay / analysis
- [ ] Spectator mode

## License

MIT — see [LICENSE](LICENSE).

## Author

**Subhankar Satpathy** — [@suwubh](https://github.com/suwubh)
