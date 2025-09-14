# Chess4Nerds

♟️ **Chess4Nerds** — a full-stack, multiplayer chess application built for nerds who love clean code and serious gameplay. Play realtime multiplayer games, challenge the built-in engine, and track progress with leaderboards and match history.

---

## Table of Contents

* [About](#about)
* [Demo](#demo)
* [Tech Stack](#tech-stack)
* [Features](#features)
* [Getting Started](#getting-started)

  * [Prerequisites](#prerequisites)
  * [Environment variables](#environment-variables)
  * [Install & Run](#install--run)
* [Development](#development)
* [Roadmap](#roadmap)
* [Contributing](#contributing)
* [Acknowledgements](#acknowledgements)
* [License](#license)
* [Contact](#contact)

---

## About

Chess4Nerds is a modern, TypeScript-based chess platform featuring:

* Real-time multiplayer via WebSockets
* Play vs Computer using a chess engine
* Matchmaking and leaderboards with an Elo-style rating system
* In-game chat and match history
* Redis for fast state and matchmaking, Postgres for persistent storage

This repo uses a monorepo layout with separate apps for server, WebSocket service, and frontend.

---

## Demo

Run locally (instructions below) or deploy to your preferred hosting provider.

---

## Tech Stack

* **Frontend:** React + TypeScript (Vite)
* **Backend:** Node.js + TypeScript (Express or similar)
* **Realtime:** WebSocket server (separate `ws` service)
* **Database:** PostgreSQL
* **Cache / State:** Redis
* **Language:** TypeScript

---

## Features

* User authentication (signup / login)
* Matchmaking: create/join games
* Real-time gameplay with instant move updates (WebSockets)
* Elo-style rating adjustments after matches
* Play vs Computer (single-player mode)
* In-game chat between opponents
* Leaderboard and match history
* Custom board themes

---

## Getting Started

### Prerequisites

* Node.js (v18+ recommended)
* npm or yarn
* PostgreSQL
* Redis

### Environment variables

Create `.env` files in the `backend/`, `ws/`, and `frontend/` folders. Example values below.

**backend/.env**

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/chess4nerds
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

**ws/.env**

```env
WS_PORT=5001
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
```

**frontend/.env** (for Vite)

```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5001
```

Adjust variable names to match the code if different.

### Install & Run

Clone the repository and install dependencies.

```bash
git clone https://github.com/suwubh/Chess4Nerds.git
cd Chess4Nerds

# (Optional) Install dependencies from the root if you use a monorepo tool
# npm install
# or
# pnpm install
# or
# yarn install
```

Install per-package (recommended):

```bash
# Server
cd backend
npm install

# WebSocket server
cd ../ws
npm install

# Frontend
cd ../frontend
npm install
```

Start each service (run these in separate terminals or use a process manager):

```bash
# Start backend
cd backend
npm run dev

# Start WebSocket server
cd ../ws
npm run dev

# Start frontend (Vite)
cd ../frontend
npm run dev
```

Open the frontend (typically `http://localhost:5173` for Vite) to play.

---

## Development

* Follow conventional commits and branch naming (e.g. `feature/`, `fix/`, `chore/`).
* If you add new environment variables, document them in this README and create a `.env.example`.
* Add unit and integration tests as you change backend logic (Jest / Supertest recommended).
* Use ESLint + Prettier to keep code style consistent across packages.

---

## Roadmap

Planned improvements:

* Spectator mode
* Mobile responsive UI and PWA support
* Tournaments & timed matches
* Adjustable engine difficulty and better single-player AI
* UI polish: animated piece movement, PGN export/import

---

## Contributing

Contributions are welcome! Steps to contribute:

1. Fork the repo
2. Create a new branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests where appropriate
4. Open a pull request describing the change

Please open an issue to discuss large features before implementing.

---

## Acknowledgements

Thanks to the open-source community and libraries like `chess.js` for chess rules/validation.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)


---

## Contact

Maintainer: `suwubh` (Subhankar Satpathy)

Repo: [https://github.com/suwubh/Chess4Nerds](https://github.com/suwubh/Chess4Nerds)

Feel free to open issues or PRs — happy to collaborate!
