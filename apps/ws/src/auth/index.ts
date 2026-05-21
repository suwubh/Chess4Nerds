import jwt from 'jsonwebtoken';
import { WebSocket } from 'ws';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (JWT_SECRET === 'your_jwt_secret') {
  console.warn('⚠️  JWT_SECRET is set to the example placeholder — use a strong, unique value.');
}

export interface UserJwtClaims {
  userId: string;
  name?: string;
  isGuest?: boolean;
  iat?: number;
  exp?: number;
}

export function extractAuthUser(token: string, ws: WebSocket): User {
  // JWT_SECRET is guaranteed defined by the check above; `!` tells the compiler.
  const decoded = jwt.verify(token, JWT_SECRET!) as unknown as UserJwtClaims;
  return {
    userId: decoded.userId,
    socket: ws,
  };
}
