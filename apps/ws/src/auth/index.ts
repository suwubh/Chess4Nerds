import jwt from 'jsonwebtoken';
import { WebSocket } from 'ws';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export interface UserJwtClaims {
  userId: string;
  name?: string;
  isGuest?: boolean;
  iat?: number;
  exp?: number;
}

export function extractAuthUser(token: string, ws: WebSocket): User {
  const decoded = jwt.verify(token, JWT_SECRET) as UserJwtClaims;
  return {
    userId: decoded.userId,
    socket: ws,
  };
}
