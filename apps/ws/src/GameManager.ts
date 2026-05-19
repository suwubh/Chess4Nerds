import { User } from './types';
import { GameStatus } from '@prisma/client';
import {
  INIT_GAME,
  MOVE,
  JOIN_ROOM,
  GAME_JOINED,
  GAME_NOT_FOUND,
  GAME_ADDED,
  GAME_ENDED,
  EXIT_GAME,
  CHAT_SEND,
  CHAT_MESSAGE,
  RESIGN_GAME,
  DRAW_REQUEST,
  DRAW_RESPONSE,
  DRAW_REQUEST_RECEIVED,
  INIT_COMPUTER_GAME,
} from './messages';
import { Game } from './Game';
import { AIGame } from './AIGame';
import { Difficulty } from './ai/minimax';
import { Matchmaker } from './matchmaking';
import { db } from './db';
import { socketManager } from './SocketManager';

export class GameManager {

  private games: Game[];

  private users: User[];

  private aiGames: Map<string, AIGame>;

  private matchmaker: Matchmaker;

  constructor() {
    this.games = [];
    this.users = [];
    this.aiGames = new Map();
    this.matchmaker = new Matchmaker();
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
    this.matchmaker.remove(user.userId);

    for (const [gameId, game] of this.aiGames) {
      if (game.user.userId === user.userId) {
        this.aiGames.delete(gameId);
      }
    }
  }

  removeGame(gameId: string) {
    this.games = this.games.filter((g) => g.gameId !== gameId);
    socketManager.removeRoom(gameId);
  }

  activeCount() {
    return this.games.length;
  }

  activeAICount() {
    return this.aiGames.size;
  }

  queueSize() {
    return this.matchmaker.size();
  }

  private addHandler(user: User) {
    user.socket.on('message', async (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === INIT_GAME) {
        const match = await this.matchmaker.enqueue(user);
        if ('opponent' in match) {
          const opponent = match.opponent;
          const game = new Game(opponent.userId, null);
          this.games.push(game);
          socketManager.addUser(opponent, game.gameId);
          socketManager.addUser(user, game.gameId);
          socketManager.broadcast(
            game.gameId,
            JSON.stringify({
              type: GAME_ADDED,
              gameId: game.gameId,
            }),
          );
          await game.updateSecondPlayer(user.userId);
        } else {
          user.socket.send(
            JSON.stringify({
              type: GAME_ADDED,
              gameId: null,
            }),
          );
        }
        return;
      }

      if (message.type === INIT_COMPUTER_GAME) {
        const colorChoice = message.payload?.color ?? 'w';
        const playerColor: 'w' | 'b' =
          colorChoice === 'random'
            ? Math.random() < 0.5
              ? 'w'
              : 'b'
            : colorChoice;

        const requested = message.payload?.difficulty;
        const difficulty: Difficulty =
          requested === 'easy' || requested === 'medium' || requested === 'hard'
            ? requested
            : 'medium';

        const aiGame = new AIGame(user, playerColor, difficulty);
        this.aiGames.set(aiGame.gameId, aiGame);
        aiGame.start();
        return;
      }

      if (message.type === MOVE) {
        const gameId = message.payload.gameId;

        const aiGame = this.aiGames.get(gameId);
        if (aiGame) {
          const move = message.payload.move ?? {};
          aiGame.handleMove(move.from, move.to, move.promotion);
          if (aiGame.isOver()) {
            this.aiGames.delete(gameId);
          }
          return;
        }

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

      if (message.type === RESIGN_GAME) {
        const gameId = message.payload.gameId;
        const game = this.games.find((game) => game.gameId === gameId);
        if (!game) return;

        const resigningPlayer = user.userId;
        const opponent = game.player1UserId === resigningPlayer ? game.player2UserId : game.player1UserId;
        if (!opponent) return;

        const result = opponent === game.player1UserId ? 'WHITE_WINS' : 'BLACK_WINS';
        await game.endGame('COMPLETED', result);

        socketManager.broadcast(
          gameId,
          JSON.stringify({
            type: GAME_ENDED,
            payload: {
              result,
              status: 'RESIGNATION',
              winner: opponent
            }
          })
        );
        this.removeGame(gameId);
        return;
      }

      if (message.type === DRAW_REQUEST) {
        const gameId = message.payload.gameId;
        const game = this.games.find((game) => game.gameId === gameId);
        if (!game) return;

        const requester = user.userId;
        const opponent = game.player1UserId === requester ? game.player2UserId : game.player1UserId;
        if (!opponent) return;

        socketManager.sendToUser(
          opponent,
          JSON.stringify({
            type: DRAW_REQUEST_RECEIVED,
            payload: {
              gameId,
              fromUserId: requester,
            }
          })
        );
        return;
      }

      if (message.type === DRAW_RESPONSE) {
        const gameId = message.payload.gameId;
        const accepted = message.payload.accepted;
        const game = this.games.find((game) => game.gameId === gameId);
        if (!game) return;

        if (accepted) {
          await game.endGame('COMPLETED', 'DRAW');
          socketManager.broadcast(
            gameId,
            JSON.stringify({
              type: GAME_ENDED,
              payload: {
                result: 'DRAW',
                status: 'MUTUAL_AGREEMENT'
              }
            })
          );
          this.removeGame(gameId);
        } else {
          const rejectingPlayer = user.userId;
          const requestor = game.player1UserId === rejectingPlayer ? game.player2UserId : game.player1UserId;
          if (requestor) {
            socketManager.sendToUser(
              requestor,
              JSON.stringify({
                type: DRAW_RESPONSE,
                payload: {
                  accepted: false,
                  gameId
                }
              })
            );
          }
        }
        return;
      }
      if (message.type === CHAT_SEND) {
        const gameId: string | undefined = message.payload?.gameId;
        const text: string = (message.payload?.text ?? '').toString().trim();
        if (!gameId || !text || text.length > 500) return;
        socketManager.broadcast(
          gameId,
          JSON.stringify({
            type: CHAT_MESSAGE,
            payload: {
              gameId,
              text,
              ts: Date.now(),
              fromUserId: user.userId,
            },
          }),
        );
        return;
      }
    });
  }

}
