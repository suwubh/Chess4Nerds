import { WebSocket } from 'ws';

export interface User {
    userId: string;
    socket: WebSocket;
}

export type GAME_STATUS = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'TIME_UP' | 'PLAYER_EXIT';
export type GAME_RESULT = "WHITE_WINS" | "BLACK_WINS" | "DRAW";

export enum AuthProvider {
    GUEST = 'GUEST',
    GOOGLE = 'GOOGLE',
    GITHUB = 'GITHUB',
    EMAIL = 'EMAIL'
}
