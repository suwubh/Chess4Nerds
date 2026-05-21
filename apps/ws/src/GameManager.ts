import { User } from './types';
import { GameStatus, GameResult } from '@prisma/client';
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

interface IncomingMessage {
  type: string;
  payload?: Record<string, any>;
}

// The DB only records the final status, not how a game ended, so derive a
// human-readable reason for clients that reconnect to an already-finished game.
function reasonFromStatus(status: GameStatus, result: GameResult | null): string {
  switch (status) {
    case 'ABANDONED':
      return 'Abandonment';
    case 'TIME_UP':
      return 'Timeout';
    case 'PLAYER_EXIT':
      return 'Player left';
    default:
      return result === 'DRAW' ? 'Draw' : 'Checkmate';
  }
}

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
    this.users = this.users.filter((u) => u.socket !== user.socket);
    socketManager.removeUser(user);
    this.matchmaker.remove(user.userId);

    // If the user was in a live game, start their forfeit countdown. They can
    // cancel it by reconnecting (JOIN_ROOM) before it fires.
    const game = this.games.find(
      (g) => g.player1UserId === user.userId || g.player2UserId === user.userId,
    );
    if (game && !game.result) {
      game.startDisconnectTimer(user.userId);
    }

    for (const [gameId, aiGame] of this.aiGames) {
      if (aiGame.user.userId === user.userId) {
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

  // Adds a game to the live list and wires up self-removal once it ends.
  private registerGame(game: Game) {
    game.onEnded = (gameId) => this.removeGame(gameId);
    this.games.push(game);
  }

  private isPlayer(game: Game, userId: string): boolean {
    return game.player1UserId === userId || game.player2UserId === userId;
  }

  private addHandler(user: User) {
    user.socket.on('message', async (data) => {
      let message: IncomingMessage;
      try {
        message = JSON.parse(data.toString());
      } catch {
        return; // ignore malformed JSON instead of crashing the server
      }
      if (!message || typeof message.type !== 'string') return;

      try {
        await this.handleMessage(user, message);
      } catch (err) {
        console.error('Error handling message:', err);
      }
    });
  }

  private async handleMessage(user: User, message: IncomingMessage) {
    const payload = message.payload ?? {};

    if (message.type === INIT_GAME) {
      const match = await this.matchmaker.enqueue(user);
      if ('opponent' in match) {
        const opponent = match.opponent;
        const game = new Game(opponent.userId, null);
        this.registerGame(game);
        socketManager.addUser(opponent, game.gameId);
        socketManager.addUser(user, game.gameId);
        socketManager.broadcast(
          game.gameId,
          JSON.stringify({ type: GAME_ADDED, gameId: game.gameId }),
        );
        await game.updateSecondPlayer(user.userId);
      } else {
        user.socket.send(JSON.stringify({ type: GAME_ADDED, gameId: null }));
      }
      return;
    }

    if (message.type === INIT_COMPUTER_GAME) {
      const colorChoice = payload.color ?? 'w';
      const playerColor: 'w' | 'b' =
        colorChoice === 'random'
          ? Math.random() < 0.5
            ? 'w'
            : 'b'
          : colorChoice === 'b'
            ? 'b'
            : 'w';

      const requested = payload.difficulty;
      const difficulty: Difficulty =
        requested === 'easy' || requested === 'medium' || requested === 'hard'
          ? requested
          : 'medium';

      const aiGame = new AIGame(user, playerColor, difficulty);
      this.aiGames.set(aiGame.gameId, aiGame);
      await aiGame.start();
      return;
    }

    if (message.type === MOVE) {
      const gameId: string | undefined = payload.gameId;
      if (!gameId) return;

      const aiGame = this.aiGames.get(gameId);
      if (aiGame) {
        const move = payload.move ?? {};
        await aiGame.handleMove(move.from, move.to, move.promotion);
        if (aiGame.isOver()) {
          this.aiGames.delete(gameId);
        }
        return;
      }

      const game = this.games.find((g) => g.gameId === gameId);
      if (game) {
        await game.makeMove(user, payload.move);
      }
      return;
    }

    if (message.type === EXIT_GAME) {
      const game = this.games.find((g) => g.gameId === payload.gameId);
      if (game && this.isPlayer(game, user.userId)) {
        await game.exitGame(user);
      }
      return;
    }

    if (message.type === JOIN_ROOM) {
      await this.handleJoinRoom(user, payload.gameId);
      return;
    }

    if (message.type === RESIGN_GAME) {
      const game = this.games.find((g) => g.gameId === payload.gameId);
      if (!game || !this.isPlayer(game, user.userId)) return;

      const opponent =
        game.player1UserId === user.userId ? game.player2UserId : game.player1UserId;
      if (!opponent) return;

      const result = opponent === game.player1UserId ? 'WHITE_WINS' : 'BLACK_WINS';
      await game.endGame('COMPLETED', result, 'Resignation');
      return;
    }

    if (message.type === DRAW_REQUEST) {
      const game = this.games.find((g) => g.gameId === payload.gameId);
      if (!game || !this.isPlayer(game, user.userId)) return;

      const opponent =
        game.player1UserId === user.userId ? game.player2UserId : game.player1UserId;
      if (!opponent) return;

      socketManager.sendToUser(
        opponent,
        JSON.stringify({
          type: DRAW_REQUEST_RECEIVED,
          payload: { gameId: game.gameId, fromUserId: user.userId },
        }),
      );
      return;
    }

    if (message.type === DRAW_RESPONSE) {
      const game = this.games.find((g) => g.gameId === payload.gameId);
      if (!game || !this.isPlayer(game, user.userId)) return;

      if (payload.accepted) {
        await game.endGame('COMPLETED', 'DRAW', 'Draw by agreement');
      } else {
        const requestor =
          game.player1UserId === user.userId ? game.player2UserId : game.player1UserId;
        if (requestor) {
          socketManager.sendToUser(
            requestor,
            JSON.stringify({
              type: DRAW_RESPONSE,
              payload: { accepted: false, gameId: game.gameId },
            }),
          );
        }
      }
      return;
    }

    if (message.type === CHAT_SEND) {
      const gameId: string | undefined = payload.gameId;
      const text: string = (payload.text ?? '').toString().trim();
      if (!gameId || !text || text.length > 500) return;

      const game = this.games.find((g) => g.gameId === gameId);
      if (!game || !this.isPlayer(game, user.userId)) return;

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
  }

  private async handleJoinRoom(user: User, gameId: string | undefined) {
    if (!gameId) return;

    let availableGame = this.games.find((g) => g.gameId === gameId);

    // Reconnecting to a live game cancels any pending forfeit countdown.
    if (availableGame) {
      availableGame.cancelDisconnectTimer();
    }

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
            reason: reasonFromStatus(gameFromDb.status, gameFromDb.result),
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
        gameFromDb.whitePlayerId,
        gameFromDb.blackPlayerId,
        gameFromDb.id,
        gameFromDb.startAt,
      );
      game.seedMoves(gameFromDb.moves);
      this.registerGame(game);
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
  }

}
