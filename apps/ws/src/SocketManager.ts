import { WebSocket } from 'ws';
import { User } from './types';
import { getPubSub, PubSub } from './pubsub';

export class SocketManager {
  private static instance: SocketManager;
  private roomsToUsers: Map<string, User[]>;
  private userToRoom: Map<string, string>;
  private pubsub: PubSub | null = null;

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

  async init() {
    if (this.pubsub) return;
    this.pubsub = await getPubSub();
    // Messages from other replicas get delivered to our local sockets only.
    this.pubsub.onRoomMessage((roomId, message) => this.deliverLocal(roomId, message));
    this.pubsub.onBroadcastAll((message) => this.deliverLocalAll(message));
  }

  addUser(user: User, roomId: string) {
    const existing = this.roomsToUsers.get(roomId) ?? [];
    this.roomsToUsers.set(roomId, [...existing, user]);
    this.userToRoom.set(user.userId, roomId);
  }

  broadcast(roomId: string, message: string) {
    this.deliverLocal(roomId, message);
    this.pubsub?.publish(roomId, message);
  }

  broadcastToAll(message: string) {
    this.deliverLocalAll(message);
    this.pubsub?.publishAll(message);
  }

  sendToUser(userId: string, message: string) {
    // Single-replica only — cross-replica DMs would need a presence registry.
    const roomId = this.userToRoom.get(userId);
    if (!roomId) return;
    const user = this.roomsToUsers.get(roomId)?.find((u) => u.userId === userId);
    if (user?.socket.readyState === WebSocket.OPEN) {
      user.socket.send(message);
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

  private deliverLocal(roomId: string, message: string) {
    const users = this.roomsToUsers.get(roomId);
    if (!users) return;
    for (const user of users) {
      if (user.socket.readyState === WebSocket.OPEN) {
        user.socket.send(message);
      }
    }
  }

  private deliverLocalAll(message: string) {
    for (const users of this.roomsToUsers.values()) {
      for (const user of users) {
        if (user.socket.readyState === WebSocket.OPEN) {
          user.socket.send(message);
        }
      }
    }
  }
}

export const socketManager = SocketManager.getInstance();
