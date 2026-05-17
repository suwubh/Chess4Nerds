import 'dotenv/config';
import url from 'url';
import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager';
import { extractAuthUser } from './auth';

const PORT = Number(process.env.WS_PORT) || 8080;
const wss = new WebSocketServer({ port: PORT });
const gameManager = new GameManager();

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
