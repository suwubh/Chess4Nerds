import { Chess, Square } from 'chess.js';
import { randomUUID } from 'crypto';

import { Difficulty, pickAIMove } from './ai/minimax';
import {
  COMPUTER_GAME_ENDED,
  COMPUTER_GAME_STARTED,
  COMPUTER_MOVE,
} from './messages';
import { User } from './types';
import { isPromoting } from './Game';

type PlayerColor = 'w' | 'b';

// In-memory only — engine games don't touch the DB and don't affect ratings.
export class AIGame {
  public gameId: string;
  public user: User;
  public playerColor: PlayerColor;
  public difficulty: Difficulty;
  private board: Chess;
  private over = false;

  constructor(user: User, playerColor: PlayerColor, difficulty: Difficulty) {
    this.gameId = randomUUID();
    this.user = user;
    this.playerColor = playerColor;
    this.difficulty = difficulty;
    this.board = new Chess();
  }

  start() {
    this.send(COMPUTER_GAME_STARTED, {
      gameId: this.gameId,
      playerColor: this.playerColor,
      difficulty: this.difficulty,
      fen: this.board.fen(),
    });

    if (this.playerColor === 'b') {
      this.playAIMove();
    }
  }

  handleMove(from: string, to: string, promotion?: string) {
    if (this.over) return;
    if (this.board.turn() !== this.playerColor) return;

    try {
      if (isPromoting(this.board, from as Square, to as Square)) {
        this.board.move({ from, to, promotion: promotion ?? 'q' });
      } else {
        this.board.move({ from, to });
      }
    } catch {
      return;
    }

    if (this.checkGameOver()) return;
    this.playAIMove();
  }

  private playAIMove() {
    const move = pickAIMove(this.board.fen(), this.difficulty);
    if (!move) {
      this.checkGameOver();
      return;
    }

    this.board.move(move.san);
    this.send(COMPUTER_MOVE, {
      gameId: this.gameId,
      move: { from: move.from, to: move.to, promotion: move.promotion, san: move.san },
      fen: this.board.fen(),
    });

    this.checkGameOver();
  }

  private checkGameOver(): boolean {
    if (!this.board.isGameOver()) return false;

    let result: 'WHITE_WINS' | 'BLACK_WINS' | 'DRAW';
    if (this.board.isDraw() || this.board.isStalemate() || this.board.isThreefoldRepetition()) {
      result = 'DRAW';
    } else {
      result = this.board.turn() === 'b' ? 'WHITE_WINS' : 'BLACK_WINS';
    }

    this.over = true;
    this.send(COMPUTER_GAME_ENDED, {
      gameId: this.gameId,
      result,
      fen: this.board.fen(),
    });
    return true;
  }

  isOver() {
    return this.over;
  }

  private send(type: string, payload: object) {
    if (this.user.socket.readyState !== this.user.socket.OPEN) return;
    this.user.socket.send(JSON.stringify({ type, payload }));
  }
}
