Overview
Chess4Nerds is a full‑stack multiplayer chess app built with React, Node.js, TypeScript, WebSockets, and Redis to deliver real‑time gameplay, matchmaking, and personalized themes.
It includes authentication, an Elo‑style rating system, in‑game chat, a computer opponent mode, and persistent leaderboards with match history for a complete chess experience.

Key features
User authentication with signup/login flows for secure session management.

Matchmaking to create or join games quickly with minimal friction.

Real‑time gameplay powered by WebSockets for instant move synchronization.

Elo‑style rating with dynamic adjustments after each game to reflect skill.

Custom themes for boards and UI, including a bubblegum theme variant.

Play vs Computer mode using a built‑in chess engine for solo practice.

In‑game chat to coordinate and banter with opponents.

Leaderboard and match history to track progress over time.

Tech stack
Frontend: React + TypeScript for a typed, component‑driven UI.

Backend: Node.js + TypeScript for a scalable service layer.

Transport: WebSockets for low‑latency, bidirectional updates.

Data layer: Redis for real‑time state coordination and ephemeral storage.

Styling: Tailwind CSS with extended theme tokens (boardDark, boardLight, bubblegum).

Icons: lucide-react for crisp, consistent navigation icons.

Theming
The UI supports custom themes using Tailwind’s extended palette, including boardDark (#9A9484), boardLight (#EAEAEA), and a bubblegum light‑pink token for theme‑based styling.
Theme usage is applied at the component level so icon and text colors adapt to “default” (dark gray) or “bubblegum” (light pink) without disrupting layout or behavior.
