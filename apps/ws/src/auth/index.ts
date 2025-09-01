import jwt from 'jsonwebtoken';
import { User } from '../types';
import { WebSocket } from 'ws';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

export interface UserJwtClaims {
    userId: string;
    name?: string;
    isGuest?: boolean;
    iat?: number;
    exp?: number;
}

export function extractAuthUser(token: string, ws: WebSocket): User {
    try {
        if (!token) {
            return {
                userId: `guest_${Math.random().toString(36).substr(2, 9)}`,
                socket: ws
            };
        }

        const decoded = jwt.verify(token, JWT_SECRET) as UserJwtClaims;
        
        return {
            userId: decoded.userId,
            socket: ws
        };
    } catch (error) {
        console.error('Token verification failed:', error);
        // Return guest user if token is invalid
        return {
            userId: `guest_${Math.random().toString(36).substr(2, 9)}`,
            socket: ws
        };
    }
}
