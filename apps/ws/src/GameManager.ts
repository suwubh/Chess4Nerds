import { WebSocket } from 'ws';
import { User } from './types';
import {
  GAME_OVER,
  INIT_GAME,
  JOIN_GAME,
  MOVE,
  OPPONENT_DISCONNECTED,
  JOIN_ROOM,
  GAME_JOINED,
  GAME_NOT_FOUND,
  GAME_ALERT,
  GAME_ADDED,
  GAME_ENDED,
  EXIT_GAME,
  CHAT_SEND,
  CHAT_MESSAGE,
} from './messages';
import { Game, isPromoting } from './Game';
import { db } from './db';
import { socketManager } from './SocketManager';
import { Square } from 'chess.js';
import { GameStatus } from '@prisma/client';

export class GameManager {
  private games: Game[];
  private pendingGameId: string | null;
  private users: User[];

  constructor() {
    this.games = [];
    this.pendingGameId = null;
    this.users = [];
  }

  addUser(user: User) {
    this.users.push(user);
    this.addHandler(user);
  }

  removeUser(user: User) {
    const userIndex = this.users.findIndex((u) => u.socket === user.socket);
    if (userIndex === -1) {
      console.error('User not found?');
      return;
    }

    this.users = this.users.filter((u) => u.userId !== user.userId);
    socketManager.removeUser(user);
  }

  removeGame(gameId: string) {
    this.games = this.games.filter((g) => g.gameId !== gameId);
    socketManager.removeRoom(gameId);
  }

  private addHandler(user: User) {
    user.socket.on('message', async (data) => {
      const message = JSON.parse(data.toString());
      
      if (message.type === INIT_GAME) {
        if (this.pendingGameId) {
          const game = this.games.find((x) => x.gameId === this.pendingGameId);
          if (!game) {
            console.error('Pending game not found?');
            return;
          }

          if (user.userId === game.player1UserId) {
            socketManager.broadcast(
              game.gameId,
              JSON.stringify({
                type: GAME_ALERT,
                payload: { message: 'Trying to Connect with yourself?' },
              }),
            );
            return;
          }

          socketManager.addUser(user, game.gameId);
          await game?.updateSecondPlayer(user.userId);
          this.pendingGameId = null;
        } else {
          const game = new Game(user.userId, null);
          this.games.push(game);
          this.pendingGameId = game.gameId;
          socketManager.addUser(user, game.gameId);
          socketManager.broadcast(
            game.gameId,
            JSON.stringify({
              type: GAME_ADDED,
              gameId: game.gameId,
            }),
          );
        }
        return;
      }

      if (message.type === MOVE) {
        const gameId = message.payload.gameId;
        const game = this.games.find((game) => game.gameId === gameId);
        if (game) {
          await game.makeMove(user, message.payload.move);
          if (game.result) {
            this.removeGame(game.gameId);
          }
        }
        return;
      }

      if (message.type === EXIT_GAME) {
        const gameId = message.payload.gameId;
        const game = this.games.find((game) => game.gameId === gameId);
        if (game) {
          await game.exitGame(user);
          this.removeGame(game.gameId);
        }
        return;
      }

      if (message.type === JOIN_ROOM) {
        const gameId: string | undefined = message.payload?.gameId;
        if (!gameId) return;

        let availableGame = this.games.find((game) => game.gameId === gameId);
        const gameFromDb = await db.game.findUnique({
          where: { id: gameId },
          include: {
            moves: { orderBy: { moveNumber: 'asc' } },
            blackPlayer: true,
            whitePlayer: true,
          },
        });

        if (availableGame && !availableGame.player2UserId) {
          socketManager.addUser(user, availableGame.gameId);
          await availableGame.updateSecondPlayer(user.userId);
          return;
        }

        if (!gameFromDb) {
          user.socket.send(JSON.stringify({ type: GAME_NOT_FOUND }));
          return;
        }

        if (gameFromDb.status !== GameStatus.IN_PROGRESS) {
          user.socket.send(
            JSON.stringify({
              type: GAME_ENDED,
              payload: {
                result: gameFromDb.result,
                status: gameFromDb.status,
                moves: gameFromDb.moves,
                blackPlayer: {
                  id: gameFromDb.blackPlayer.id,
                  name: gameFromDb.blackPlayer.name,
                },
                whitePlayer: {
                  id: gameFromDb.whitePlayer.id,
                  name: gameFromDb.whitePlayer.name,
                },
              },
            }),
          );
          return;
        }

        if (!availableGame) {
          const game = new Game(
            gameFromDb.whitePlayerId!,
            gameFromDb.blackPlayerId!,
            gameFromDb.id,
            gameFromDb.startAt,
          );
          game.seedMoves(gameFromDb?.moves || []);
          this.games.push(game);
          availableGame = game;
        }

        user.socket.send(
          JSON.stringify({
            type: GAME_JOINED,
            payload: {
              gameId,
              moves: gameFromDb.moves,
              blackPlayer: {
                id: gameFromDb.blackPlayer.id,
                name: gameFromDb.blackPlayer.name,
              },
              whitePlayer: {
                id: gameFromDb.whitePlayer.id,
                name: gameFromDb.whitePlayer.name,
              },
              player1TimeConsumed: availableGame.getPlayer1TimeConsumed(),
              player2TimeConsumed: availableGame.getPlayer2TimeConsumed(),
            },
          }),
        );
        socketManager.addUser(user, gameId);
        return;
      }

      // FIXED: Chat message handling - broadcast to all with sender info
      if (message.type === CHAT_SEND) {
        const gameId: string | undefined = message.payload?.gameId;
        const text: string = (message.payload?.text ?? '').toString().trim();
        if (!gameId || !text || text.length > 500) return;
        
        const outbound = {
          type: CHAT_MESSAGE,
          payload: {
            gameId,
            text,
            ts: Date.now(),
            fromUserId: user.userId,
          },
        };
        
        // Broadcast to everyone including the sender
        // The client should handle deduplication using the fromUserId
        socketManager.broadcast(gameId, JSON.stringify(outbound));
        return;
      }
    });
  }
}
