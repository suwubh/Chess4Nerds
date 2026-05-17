import { WebSocket } from 'ws';
import { User } from './types';

export class SocketManager {
  private static instance: SocketManager;
  private roomsToUsers: Map<string, User[]>;
  private userToRoom: Map<string, string>;

  private constructor() {
    this.roomsToUsers = new Map();
    this.userToRoom = new Map();
  }

  static getInstance() {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  addUser(user: User, roomId: string) {
    const existing = this.roomsToUsers.get(roomId) ?? [];
    this.roomsToUsers.set(roomId, [...existing, user]);
    this.userToRoom.set(user.userId, roomId);
  }

  broadcast(roomId: string, message: string) {
    const users = this.roomsToUsers.get(roomId);
    if (!users) return;
    for (const user of users) {
      if (user.socket.readyState === WebSocket.OPEN) {
        user.socket.send(message);
      }
    }
  }

  sendToUser(userId: string, message: string) {
    const roomId = this.userToRoom.get(userId);
    if (!roomId) return;
    const user = this.roomsToUsers.get(roomId)?.find((u) => u.userId === userId);
    if (user?.socket.readyState === WebSocket.OPEN) {
      user.socket.send(message);
    }
  }

  broadcastToAll(message: string) {
    for (const users of this.roomsToUsers.values()) {
      for (const user of users) {
        if (user.socket.readyState === WebSocket.OPEN) {
          user.socket.send(message);
        }
      }
    }
  }

  removeUser(user: User) {
    const roomId = this.userToRoom.get(user.userId);
    if (!roomId) return;

    const remaining = (this.roomsToUsers.get(roomId) ?? []).filter(
      (u) => u.userId !== user.userId,
    );
    if (remaining.length === 0) {
      this.roomsToUsers.delete(roomId);
    } else {
      this.roomsToUsers.set(roomId, remaining);
    }
    this.userToRoom.delete(user.userId);
  }

  removeRoom(roomId: string) {
    const users = this.roomsToUsers.get(roomId);
    if (users) {
      for (const user of users) {
        this.userToRoom.delete(user.userId);
      }
    }
    this.roomsToUsers.delete(roomId);
  }
}

export const socketManager = SocketManager.getInstance();
