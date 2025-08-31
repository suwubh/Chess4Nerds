♟️ Chess4Nerds

Chess4Nerds is a full-stack, multiplayer chess application built for nerds who love both clean code and strategic gameplay. The platform delivers a seamless online chess experience with real-time multiplayer support, AI-powered single-player mode, and rich community features like leaderboards, ratings, and in-game chat.

🚀 Tech Stack

Frontend: React + TypeScript

Backend: Node.js + TypeScript

Real-Time: WebSockets

State Management: Redis

Database: Postgres

✨ Features

🔐 User Authentication – Secure signup/login to manage your profile.

🎮 Matchmaking System – Create or join games instantly with friends or random players.

⏱ Real-Time Gameplay – WebSocket-powered instant move updates for a smooth experience.

📈 Elo-Style Rating System – Dynamic rating adjustments after each match.

🎨 Custom Themes – Personalize your chessboard with unique styles.

🤖 Play vs Computer – Challenge the built-in chess engine for solo practice.

💬 In-Game Chat – Communicate with opponents while playing.

🏆 Leaderboard & Match History – Track performance and progress over time.

📸 Screenshots (Optional)

(Add images or GIFs of gameplay, matchmaking, and chat features here)

⚡ Getting Started
1. Clone the repository
git clone https://github.com/suwubh/Chess4Nerds.git
cd Chess4Nerds

2. Install dependencies
# Install server dependencies
cd backend
npm install

# Install websocket server dependencies
cd ../ws
npm install

# Install client dependencies
cd ../frontend
npm install

3. Set up environment variables

Create a .env file in backend, ws, and frontend directories with your config values. Example:

# Backend
PORT=5000
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key

# WebSocket server
WS_PORT=5001
REDIS_URL=redis://localhost:6379

# Frontend
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5001

4. Run the application
# Start backend
cd backend
npm run dev

# Start WebSocket server
cd ../ws
npm run dev

# Start frontend
cd ../frontend
npm run dev


Now open http://localhost:5173
 in your browser and enjoy Chess4Nerds ♟️

🛠️ Development Roadmap

 Add spectating mode.

 Mobile responsive UI.

 Enhanced chess engine with adjustable difficulty.

 Tournaments & timed matches.

🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the issues page

.

🙌 Acknowledgements

chess.js
 – chess logic library.

stockfish.js
 – WebAssembly chess engine.

The open-source community ❤️
