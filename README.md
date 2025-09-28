# ♟️ Chess4Nerds

**A modern, full-stack multiplayer chess platform built with TypeScript**

[![Made with TypeScript](https://img.shields.io/badge/Made%20with-TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Powered by Turbo](https://img.shields.io/badge/Built%20with-Turborepo-EF4444?style=flat-square&logo=turborepo)](https://turbo.build/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 🚀 Overview

Chess4Nerds is a comprehensive chess platform featuring real-time multiplayer gameplay, AI opponents, and modern web technologies. Built as a Turborepo monorepo with TypeScript throughout.

### ✨ Key Features

- 🎮 **Real-time Multiplayer** - Play chess instantly via WebSocket connections
- 🤖 **AI Chess Engine** - Challenge computer opponents using chess.js
- 📊 **User Authentication** - Secure login with Passport.js (Google & GitHub OAuth)
- 💬 **Live Gaming** - Real-time move updates and game state synchronization
- 📱 **Cross-platform** - Web application with planned mobile support
- 🎨 **Modern UI** - Built with React, Tailwind CSS, and Radix UI components

---

## 🏗️ Architecture

This project uses **Turborepo** for monorepo management:

```
chess4nerds/
├── apps/
│   ├── backend/         # Express.js API server with Passport auth
│   ├── frontend/        # React + Vite web application
│   ├── ws/              # WebSocket server for real-time gaming
│   └── native/          # React Native mobile app (planned)
├── packages/
│   ├── db/              # Prisma database schema and client
│   ├── store/           # Shared state management
│   └── ui/              # Reusable UI components
└── Configuration files
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript and Vite
- **Tailwind CSS** for styling with custom chess themes
- **Radix UI** components (Dialog, Accordion, Alert Dialog)
- **Chess.js** for game logic and validation
- **Zustand & Recoil** for state management
- **React Router** for navigation

### Backend
- **Node.js** with Express.js and TypeScript
- **Prisma ORM** with PostgreSQL database
- **Passport.js** authentication (Google & GitHub OAuth)
- **JWT** tokens with cookie sessions
- **ESBuild** for fast compilation

### WebSocket Server
- **WebSocket (ws)** for real-time communication
- **Chess.js** for server-side game validation
- **JWT** authentication
- **ESBuild** compilation

### Database & Tools
- **PostgreSQL** with Prisma ORM
- **Turborepo** for monorepo management
- **ESLint** for code quality
- **TypeScript** throughout the stack

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+)
- **Yarn** (v1.22+)
- **PostgreSQL** database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/suwubh/Chess4Nerds.git
   cd Chess4Nerds
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   
   **`apps/backend/.env`**
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/chess4nerds"
   GOOGLE_CLIENT_ID="your-google-oauth-client-id"
   GOOGLE_CLIENT_SECRET="your-google-oauth-secret"
   GITHUB_CLIENT_ID="your-github-oauth-client-id"
   GITHUB_CLIENT_SECRET="your-github-oauth-secret"
   JWT_SECRET="your-jwt-secret-key"
   COOKIE_SECRET="your-cookie-secret"
   AUTH_REDIRECT_URL="http://localhost:3000"
   PORT=3001
   ```
   
   **`apps/frontend/.env`** (check `.env.example`)
   ```env
   VITE_API_URL=http://localhost:3001
   VITE_WS_URL=ws://localhost:3002
   ```

4. **Set up the database**
   ```bash
   yarn db:generate
   yarn db:push
   ```

5. **Start development servers**
   ```bash
   yarn dev
   ```
   
   This starts all applications:
   - Frontend: `http://localhost:3000` (Vite dev server)
   - Backend API: `http://localhost:3001`
   - WebSocket: `ws://localhost:3002`

---

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start all applications in development mode |
| `yarn build` | Build all applications for production |
| `yarn lint` | Run ESLint across all packages |
| `yarn lint:fix` | Fix ESLint issues automatically |
| `yarn db:generate` | Generate Prisma client |
| `yarn db:push` | Push schema changes to database |

### Individual App Scripts

**Backend:**
- `npm run dev` - Build and start backend server
- `npm run build` - Build with ESBuild
- `npm run lint` - ESLint check

**Frontend:**
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run lint` - ESLint check

**WebSocket:**
- `npm run dev` - Build and start WebSocket server

---

## 🎮 How to Play

1. **Sign Up** - Create account or use Google/GitHub OAuth
2. **Find Opponents** - Connect with other players
3. **Play Chess** - Real-time chess with instant move updates
4. **Challenge AI** - Practice against computer opponents

---

## 🔧 Development

### Project Structure

- **Turborepo** manages the monorepo with optimized builds
- **TypeScript** across all packages for type safety
- **ESLint** configured for code quality
- **Prisma** handles database operations and migrations
- **ESBuild** for fast backend compilation

### Key Dependencies

- `chess.js` - Chess game logic and validation
- `@radix-ui/*` - Accessible UI components
- `tailwindcss` - Utility-first CSS framework
- `passport` - Authentication middleware
- `prisma` - Database toolkit
- `ws` - WebSocket implementation

---

## 🗺️ Roadmap

- [ ] Enhanced AI difficulty levels
- [ ] Tournament system
- [ ] Game replay and analysis
- [ ] Mobile app completion
- [ ] Spectator mode
- [ ] Chess puzzles and training

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Follow TypeScript and ESLint conventions
4. Test your changes
5. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 📞 Contact

**Developer**: Subhankar Satpathy ([@suwubh](https://github.com/suwubh))  
**Email**: subhankarsatpathy69@gmail.com  
**Repository**: [Chess4Nerds](https://github.com/suwubh/Chess4Nerds)

---

<div align="center">
  
**Built with ❤️ for chess enthusiasts**

</div>