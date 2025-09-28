# ♟️ Chess4Nerds

**A modern, full-stack multiplayer chess platform built with TypeScript and cutting-edge web technologies.**

[![Made with TypeScript](https://img.shields.io/badge/Made%20with-TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Powered by Turbo](https://img.shields.io/badge/Built%20with-Turborepo-EF4444?style=flat-square&logo=turborepo)](https://turbo.build/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 🚀 Overview

Chess4Nerds is a comprehensive chess platform designed for developers who appreciate clean architecture and serious gameplay. Built as a modern monorepo with TypeScript throughout, it offers real-time multiplayer chess, AI opponents, and comprehensive player analytics.

### ✨ Key Features

- 🎮 **Real-time Multiplayer** - Instant gameplay via WebSocket connections
- 🤖 **AI Chess Engine** - Challenge computer opponents of varying difficulty
- 📊 **Elo Rating System** - Track your progress with professional rating calculations
- 💬 **In-game Chat** - Communicate with opponents during matches
- 📈 **Match History** - Comprehensive game analytics and replay functionality
- 🏆 **Global Leaderboards** - Compete with players worldwide
- 📱 **Cross-platform** - Web, mobile, and desktop support
- 🎨 **Customizable Themes** - Personalize your chess board experience

---

## 🏗️ Architecture

This project uses a **Turborepo monorepo** structure with clearly separated concerns:

```
chess4nerds/
├── apps/
│   ├── backend/         # Express.js API server
│   ├── frontend/        # React + Vite web application  
│   ├── native/          # React Native mobile app
│   └── ws/              # WebSocket server for real-time gaming
├── packages/
│   ├── db/              # Database schema and migrations
│   ├── store/           # Shared state management
│   └── ui/              # Reusable UI components
└── shared configuration files
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for lightning-fast development
- **Styling**: Tailwind CSS with custom chess themes
- **Chess Logic**: Chess.js for game validation
- **Real-time**: WebSocket client for live gameplay

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with strict type checking
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session management and quick data access
- **Authentication**: JWT-based auth with OAuth support

### Infrastructure
- **Monorepo**: Turborepo for efficient builds and development
- **Package Manager**: Yarn workspaces
- **Real-time**: WebSocket server for instant move updates
- **Chess Engine**: Custom integration with chess.js and js-chess-engine

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **Yarn** (v1.22+)
- **PostgreSQL** (v13+)
- **Redis** (v6+)

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
   
   Create `.env` files in each app directory:
   
   **`apps/backend/.env`**
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/chess4nerds"
   
   # Redis
   REDIS_URL="redis://localhost:6379"
   
   # Authentication
   JWT_SECRET="your-super-secret-jwt-key"
   COOKIE_SECRET="your-cookie-secret"
   
   # OAuth (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GITHUB_CLIENT_ID="your-github-client-id"
   GITHUB_CLIENT_SECRET="your-github-client-secret"
   
   # Server
   PORT=3001
   NODE_ENV=development
   ALLOWED_HOSTS="localhost:3000,localhost:3001"
   AUTH_REDIRECT_URL="http://localhost:3000"
   ```
   
   **`apps/ws/.env`**
   ```env
   WS_PORT=3002
   REDIS_URL="redis://localhost:6379"
   JWT_SECRET="your-super-secret-jwt-key"
   ```
   
   **`apps/frontend/.env`**
   ```env
   VITE_API_URL=http://localhost:3001
   VITE_WS_URL=ws://localhost:3002
   VITE_APP_NAME="Chess4Nerds"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client and run migrations
   yarn db:generate
   yarn db:push
   ```

5. **Start development servers**
   ```bash
   # Start all services concurrently
   yarn dev
   ```
   
   This will start:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:3001`
   - WebSocket server: `ws://localhost:3002`

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

---

## 🎮 How to Play

1. **Create an Account** - Sign up with email or OAuth providers
2. **Find a Match** - Use the matchmaking system to find opponents
3. **Play Chess** - Enjoy real-time chess with instant move updates
4. **Track Progress** - Monitor your Elo rating and match history
5. **Challenge the AI** - Practice against computer opponents
6. **Join the Community** - Compete on global leaderboards

---

## 🔧 Development

### Project Structure

- **Apps**: Each application (`backend`, `frontend`, `ws`, `native`) is independently deployable
- **Packages**: Shared libraries and utilities used across applications
- **Turborepo**: Handles build caching, parallel execution, and dependency management

### Contributing Guidelines

1. **Fork the repository** and create a feature branch
2. **Follow TypeScript best practices** and maintain type safety
3. **Write tests** for new features and bug fixes
4. **Use conventional commits** for clear git history
5. **Ensure all checks pass** before submitting a PR

### Code Style

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Enforced code quality and consistency
- **Prettier**: Automated code formatting
- **Husky**: Pre-commit hooks for quality assurance

---

## 🗺️ Roadmap

### 🎯 Phase 1 (Current)
- [x] Core chess gameplay
- [x] Real-time multiplayer
- [x] User authentication
- [x] Basic AI opponent
- [x] Elo rating system

### 🎯 Phase 2 (In Progress)
- [ ] Advanced AI difficulty levels
- [ ] Tournament system
- [ ] Spectator mode
- [ ] Mobile app optimization
- [ ] Chess puzzles and training

### 🎯 Phase 3 (Planned)
- [ ] Video call integration
- [ ] Chess variant support (King of the Hill, Chess960)
- [ ] Advanced analytics and insights
- [ ] Social features and friend system
- [ ] Professional tournament hosting

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation, your help makes Chess4Nerds better.

### How to Contribute

1. **Check existing issues** or create a new one
2. **Fork the repository** and create your feature branch
3. **Make your changes** following our coding standards
4. **Add tests** for new functionality
5. **Submit a pull request** with a clear description

---

## 📞 Contact & Support

**Developer**: Subhankar Satpathy ([@suwubh](https://github.com/suwubh))  
**Email**: subhankarsatpathy69@gmail.com  
**Project Repository**: [Chess4Nerds](https://github.com/suwubh/Chess4Nerds)

### Getting Help

- 🐛 **Bug reports**: Open an issue with detailed reproduction steps
- 💡 **Feature requests**: Share your ideas in the issues section
- ❓ **Questions**: Start a discussion or reach out directly

---

<div align="center">
  
**Built with ❤️ for chess enthusiasts and coding nerds**

*"Every chess master was once a beginner." - Irving Chernev*

</div>