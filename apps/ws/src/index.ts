import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager';
import url from 'url';
import { extractAuthUser } from './auth';

const wss = new WebSocketServer({ port: 8080 });
const gameManager = new GameManager();

wss.on('connection', function connection(ws, req) {
    try {
        const parsedUrl = url.parse(req.url || '', true);
        const token = parsedUrl.query.token as string;
        
        if (!token) {
            console.log('Connection rejected: No token provided');
            ws.close(1008, 'Unauthorized');
            return;
        }

        const user = extractAuthUser(token, ws);
        console.log(`User connected: ${user.userId}`);
        
        gameManager.addUser(user);

        ws.on('close', () => {
            console.log(`User disconnected: ${user.userId}`);
            gameManager.removeUser(user);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

    } catch (error) {
        console.error('Connection error:', error);
        ws.close(1011, 'Server error');
    }
});

console.log('WebSocket server started on port 8080');

export default wss;
