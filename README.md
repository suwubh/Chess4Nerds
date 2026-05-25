# Chess4Nerds

A real-time multiplayer chess platform built as a TypeScript monorepo.

[![Made with TypeScript](https://img.shields.io/badge/Made%20with-TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Built with Turborepo](https://img.shields.io/badge/Built%20with-Turborepo-EF4444?style=flat-square&logo=turborepo)](https://turbo.build/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)


```mermaid
flowchart TB
    subgraph Client
        FE["⬡ React frontend\nVite · Recoil · chess.js · Tailwind"]
    end

    subgraph Apps["Server apps"]
        BE["Backend\nExpress · Passport · JWT"]
        WS["WS server\nws · GameManager · Minimax AI"]
        RD["Redis pub/sub\nOptional broadcast relay"]
    end

    subgraph Packages["Shared packages"]
        DB["@repo/db\nPrisma schema · PrismaClient"]
        ST["@repo/store\nRecoil atoms · useUser hook"]
        TB["Turborepo\nMonorepo build pipeline"]
    end

    subgraph Infra["Infrastructure"]
        PG[("PostgreSQL\nUsers · Games · Moves · Ratings")]
        CI["GitHub Actions CI\nLint · Build · Test"]
        LT["k6 load test\nproof/ harness"]
    end

    FE -- "REST /auth /api" --> BE
    FE <-- "WSS" --> WS
    WS -- "pub/sub" --> RD

    BE --> DB
    WS --> DB
    WS --> ST
    FE --> ST

    DB --> PG
    BE -.-> CI
    WS -.-> CI
    WS -.-> LT
```

## Overview

Chess4Nerds lets two players play chess online over WebSockets. It includes
guest play, OAuth login (Google / GitHub), Elo-based ratings and matchmaking,
per-player stats, a global leaderboard, game history, and a single-player mode
against a minimax engine.

## Features

- Real-time multiplayer over WebSockets, with server-authoritative move
  validation via chess.js
- Elo-band matchmaking (±100 rating, widens with wait time) and Elo updates
  after each completed game (K=32 standard, 40 provisional, 10 for 2100+)
- Optional Redis pub/sub layer that relays room broadcasts between WebSocket
  replicas (see "Scaling notes" below for what this does and does not cover)
- Single-player mode against an in-house minimax + alpha-beta engine with
  MVV-LVA move ordering, piece-square evaluation, and easy/medium/hard
  difficulty (search depth 2/3/4)
- Guest accounts and OAuth login (Google / GitHub) via Passport
- Leaderboard, per-player stats and game history
- Resign and draw-offer flows, in-game chat, board themes

## Tech stack

- **Frontend** — React 18, Vite, TypeScript, Tailwind CSS, Recoil, chess.js
- **Backend** — Node.js, Express, Passport (Google / GitHub OAuth), JWT
- **WebSocket server** — `ws`, JWT auth, chess.js validation, in-house
  minimax engine, optional Redis pub/sub broadcast relay
- **Database** — PostgreSQL via Prisma
- **Monorepo** — Turborepo with shared `db` and `store` packages
- **CI** — GitHub Actions (Prisma schema validate, builds, tests)

## Repository layout

```
chess4nerds/
├── apps/
│   ├── backend/   # Express REST + OAuth + leaderboard / history endpoints
│   ├── frontend/  # React + Vite client
│   └── ws/        # WebSocket game server
├── packages/
│   ├── db/        # Prisma schema + generated client
│   └── store/     # Shared Recoil atoms / hooks
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

# Optional. When set, the WS server publishes every room broadcast through
# Redis so additional ws replicas can re-broadcast to their own clients. Leave
# unset for single-node setups.
# REDIS_URL="redis://localhost:6379"
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
  by the backend. The `GameManager` queues players in a rating-aware
  matchmaker (`apps/ws/src/matchmaking.ts`) that pairs opponents within ±100
  Elo and widens the band the longer a player waits.
- Each `Game` keeps a `chess.js` board, persists moves to Postgres, and emits
  events (`init_game`, `move`, `game_ended`, etc.) back to both players.
- Single-player games use an in-memory `AIGame` (`apps/ws/src/AIGame.ts`)
  driven by the minimax engine in `apps/ws/src/ai/minimax.ts`. The engine
  uses alpha-beta pruning with MVV-LVA move ordering and piece-square-table
  evaluation. Search depth is selected by difficulty (easy = 2, medium = 3,
  hard = 4). AI games are never written to the DB and don't affect ratings.
- When a multiplayer game ends, ratings are recomputed via the Elo formula and
  the leaderboard / per-player stats reflect the change immediately.
- Setting `REDIS_URL` enables a pub/sub layer (`apps/ws/src/pubsub.ts`) that
  relays room broadcasts to other WS replicas. See "Scaling notes" below for
  what this covers. `proof/` contains a k6 load-test harness for the WS server.

## Scaling notes

The WebSocket server keeps authoritative game state (the `chess.js` board,
clocks, timers) and the matchmaking queue in memory. Setting `REDIS_URL` adds a
pub/sub layer that relays room broadcasts to other replicas — useful for
read-only fan-out — but it is **not** full horizontal scaling on its own:
matchmaking and game state are still per-replica. Running multiple replicas
correctly would additionally require shared matchmaking and either pinning all
of a game's traffic to one owner replica or moving game state into a shared
store. The project is intended to run as a single WS instance; the `proof/`
harness load-tests that single instance.

## Roadmap

- [x] Real-time multiplayer
- [x] Google / GitHub OAuth
- [x] Leaderboard + match history
- [x] Elo ratings + Elo-band matchmaking
- [x] Computer opponent (minimax + alpha-beta)
- [x] Redis pub/sub broadcast relay for WS replicas
- [ ] Fully horizontally scalable WS layer (shared matchmaking + game state)
- [ ] Tournaments
- [ ] Game replay / analysis
- [ ] Spectator mode

## License

MIT — see [LICENSE](LICENSE).

## Author

**Subhankar Satpathy** — [@suwubh](https://github.com/suwubh)
