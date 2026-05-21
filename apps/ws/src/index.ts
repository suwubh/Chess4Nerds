import 'dotenv/config';
import url from 'url';
import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager';
import { extractAuthUser } from './auth';
import { socketManager } from './SocketManager';

// Safety net: log stray errors instead of letting one bad request crash the server.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

const PORT = Number(process.env.WS_PORT) || 8080;
const wss = new WebSocketServer({ port: PORT });
const gameManager = new GameManager();

socketManager.init().catch((err) => {
  console.error('SocketManager init failed:', err);
});

// Periodic snapshot of in-flight games. Used by proof/loadtest-chess.js to
// verify peak concurrent matches. Enable by setting METRICS_LOG=1.
if (process.env.METRICS_LOG === '1') {
  setInterval(() => {
    const ts = new Date().toISOString();
    console.log(
      `metric ts=${ts} active_games=${gameManager.activeCount()} ` +
        `ai_games=${gameManager.activeAICount()} queue=${gameManager.queueSize()}`,
    );
  }, 1000);
}

wss.on('connection', (ws, req) => {
  const { query } = url.parse(req.url || '', true);
  const token = typeof query.token === 'string' ? query.token : null;

  if (!token) {
    ws.close(1008, 'Unauthorized');
    return;
  }

  let user;
  try {
    user = extractAuthUser(token, ws);
  } catch (err) {
    console.error('Auth failed:', err instanceof Error ? err.message : err);
    ws.close(1008, 'Unauthorized');
    return;
  }

  gameManager.addUser(user);

  ws.on('close', () => gameManager.removeUser(user));
  ws.on('error', (error) => console.error('WebSocket error:', error));
});

console.log(`WebSocket server listening on port ${PORT}`);

export default wss;
