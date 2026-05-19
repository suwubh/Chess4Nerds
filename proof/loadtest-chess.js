// k6 load test for the WS server. setup() mints one guest token per VU via
// POST /auth/guest, then each VU connects, gets paired, and plays a short
// opening line. Run once vs single-node and once vs 2 replicas, compare
// chess_moves_played.
//
//   BACKEND_URL=http://localhost:3000 WS_URL=ws://localhost:8080 \
//     k6 run --vus 20 --duration 30s proof/loadtest-chess.js

import http from 'k6/http';
import ws from 'k6/ws';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const BACKEND_URL = __ENV.BACKEND_URL || 'http://localhost:3000';
const WS_URL = __ENV.WS_URL || 'ws://localhost:8080';

const movesPlayed = new Counter('chess_moves_played');
const moveLatency = new Trend('chess_move_latency_ms');
const gamesStarted = new Counter('chess_games_started');

export const options = {
  vus: 20,
  duration: '30s',
  thresholds: {
    chess_move_latency_ms: ['p(95)<1500'],
  },
};

// Mint a pool of guest tokens up front (3x the VU count gives reconnects
// room to land on unused users).
export function setup() {
  const targetCount = options.vus * 3;
  const sessions = [];
  for (let i = 0; i < targetCount; i++) {
    const res = http.post(
      `${BACKEND_URL}/auth/guest`,
      JSON.stringify({ name: `k6bot-${Date.now()}-${i}` }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    if (res.status !== 200) {
      throw new Error(`POST /auth/guest failed: ${res.status} ${res.body}`);
    }
    const body = JSON.parse(res.body);
    sessions.push({ token: body.token, userId: body.id });
  }
  return { sessions };
}

const WHITE_MOVES = [
  { from: 'e2', to: 'e4' },
  { from: 'g1', to: 'f3' },
  { from: 'f1', to: 'c4' },
  { from: 'd2', to: 'd3' },
  { from: 'c1', to: 'g5' },
  { from: 'b1', to: 'c3' },
];

const BLACK_MOVES = [
  { from: 'e7', to: 'e5' },
  { from: 'b8', to: 'c6' },
  { from: 'g8', to: 'f6' },
  { from: 'f8', to: 'c5' },
  { from: 'd7', to: 'd6' },
  { from: 'h7', to: 'h6' },
];

export default function (data) {
  // Spread across the pool — the matchmaker refuses to pair a user with itself.
  const idx = ((__VU - 1) * 7 + __ITER * 13) % data.sessions.length;
  const { token, userId } = data.sessions[idx];

  const url = `${WS_URL}/?token=${token}`;
  const res = ws.connect(url, {}, (socket) => {
    let gameId = null;
    let myColor = null;
    let moveIdx = 0;
    let lastSendAt = 0;

    socket.on('open', () => {
      socket.send(JSON.stringify({ type: 'init_game' }));
    });

    socket.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }

      if (msg.type === 'init_game') {
        gameId = msg.payload?.gameId;
        myColor = msg.payload?.whitePlayer?.id === userId ? 'w' : 'b';
        gamesStarted.add(1);
        if (myColor === 'w') sendMove();
        return;
      }

      if (msg.type === 'move') {
        if (lastSendAt) {
          moveLatency.add(Date.now() - lastSendAt);
          lastSendAt = 0;
        }
        movesPlayed.add(1);
        moveIdx++;
        if (moveIdx < WHITE_MOVES.length * 2) sendMove();
      }
    });

    function sendMove() {
      const ply = Math.floor(moveIdx / 2);
      const move = myColor === 'w' ? WHITE_MOVES[ply] : BLACK_MOVES[ply];
      if (!move || !gameId) return;
      lastSendAt = Date.now();
      socket.send(
        JSON.stringify({
          type: 'move',
          payload: { gameId, move },
        }),
      );
    }

    // Cap each iteration so VUs cycle into fresh games.
    socket.setTimeout(() => socket.close(), 8000);
  });

  check(res, { 'ws handshake': (r) => r && r.status === 101 });
}
