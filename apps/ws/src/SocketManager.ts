import { WebSocket } from 'ws';
import { User } from './types';

export class SocketManager {
  private static instance: SocketManager;
  private interestedSockets: Map<string, User[]>;
  private userRoomMapping: Map<string, string>;

  private constructor() {
    this.interestedSockets = new Map();
    this.userRoomMapping = new Map();
  }

  static getInstance() {
    if (SocketManager.instance) {
      return SocketManager.instance;
    }
    SocketManager.instance = new SocketManager();
    return SocketManager.instance;
  }

  addUser(user: User, roomId: string) {
    this.interestedSockets.set(roomId, [
      ...(this.interestedSockets.get(roomId) || []),
      user,
    ]);
    this.userRoomMapping.set(user.userId, roomId);
  }

  broadcast(roomId: string, message: string) {
    const users = this.interestedSockets.get(roomId);
    if (!users) {
      console.error("No users in room to broadcast the message");
      return;
    }

    users.forEach((user) => {
      if (user.socket.readyState === WebSocket.OPEN) {
        user.socket.send(message);
      }
    });
  }

  // Keep this method for other potential use cases
  broadcastToOthers(roomId: string, message: string, excludeUserId: string) {
    const users = this.interestedSockets.get(roomId);
    if (!users) {
      console.error("No users in room to broadcast the message");
      return;
    }

    users.forEach((user) => {
      if (user.userId !== excludeUserId && user.socket.readyState === WebSocket.OPEN) {
        user.socket.send(message);
      }
    });
  }

  removeUser(user: User) {
    const roomId = this.userRoomMapping.get(user.userId);
    if (!roomId) {
      console.error("User was not interested in any room?");
      return;
    }

    const room = this.interestedSockets.get(roomId) || [];
    const remainingUsers = room.filter((u) => u.userId !== user.userId);
    this.interestedSockets.set(roomId, remainingUsers);
    if (this.interestedSockets.get(roomId)?.length === 0) {
      this.interestedSockets.delete(roomId);
    }
    this.userRoomMapping.delete(user.userId);
  }

  sendToUser(userId: string, message: string) {
    const roomId = this.userRoomMapping.get(userId);
    if (roomId) {
      const room = this.interestedSockets.get(roomId);
      if (room) {
        const user = room.find(u => u.userId === userId);
        if (user && user.socket.readyState === WebSocket.OPEN) {
          user.socket.send(message);
        }
      }
    }
  }

  broadcastToAll(message: string) {
    this.interestedSockets.forEach((room) => {
      room.forEach((user) => {
        if (user.socket.readyState === WebSocket.OPEN) {
          user.socket.send(message);
        }
      });
    });
  }

  removeRoom(roomId: string) {
    const users = this.interestedSockets.get(roomId);
    if (users) {
      users.forEach(user => {
        this.userRoomMapping.delete(user.userId);
      });
    }
    this.interestedSockets.delete(roomId);
  }

  get rooms() {
    return this.interestedSockets;
  }
}

export const socketManager = SocketManager.getInstance();
