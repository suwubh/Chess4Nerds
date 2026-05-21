import { GameResult, GameStatus } from '@prisma/client';
import { db } from '../db';

type PlayerColor = 'white' | 'black';
type Outcome = 'win' | 'loss' | 'draw';

function getOutcome(result: GameResult, color: PlayerColor): Outcome {
  if (result === 'DRAW') return 'draw';
  const whiteWon = result === 'WHITE_WINS';
  return (color === 'white' ? whiteWon : !whiteWon) ? 'win' : 'loss';
}

interface SaveGameInput {
  gameId: string;
  whitePlayerId: string;
  blackPlayerId: string;
  result: GameResult;
  status: GameStatus;
  whiteRatingBefore: number;
  blackRatingBefore: number;
  whiteRatingAfter: number;
  blackRatingAfter: number;
  totalMoves: number;
  gameDurationSeconds: number;
}

export class GameHistoryService {
  async saveGameWithRatings(input: SaveGameInput): Promise<void> {
    await db.$transaction([
      db.game.update({
        where: { id: input.gameId },
        data: {
          whiteRatingBefore: input.whiteRatingBefore,
          blackRatingBefore: input.blackRatingBefore,
          whiteRatingAfter: input.whiteRatingAfter,
          blackRatingAfter: input.blackRatingAfter,
          totalMoves: input.totalMoves,
          gameDurationSeconds: input.gameDurationSeconds,
          status: input.status,
          result: input.result,
          endAt: new Date(),
        },
      }),
      db.user.update({
        where: { id: input.whitePlayerId },
        data: { rating: input.whiteRatingAfter },
      }),
      db.user.update({
        where: { id: input.blackPlayerId },
        data: { rating: input.blackRatingAfter },
      }),
    ]);

    await this.upsertPlayerRating(
      input.whitePlayerId,
      input.whiteRatingAfter,
      getOutcome(input.result, 'white'),
    );
    await this.upsertPlayerRating(
      input.blackPlayerId,
      input.blackRatingAfter,
      getOutcome(input.result, 'black'),
    );
  }

  private async upsertPlayerRating(playerId: string, newRating: number, outcome: Outcome) {
    const existing = await db.playerRating.findUnique({ where: { userId: playerId } });

    if (!existing) {
      await db.playerRating.create({
        data: {
          userId: playerId,
          currentRating: newRating,
          peakRating: newRating,
          gamesPlayed: 1,
          wins: outcome === 'win' ? 1 : 0,
          losses: outcome === 'loss' ? 1 : 0,
          draws: outcome === 'draw' ? 1 : 0,
          winStreak: outcome === 'win' ? 1 : 0,
          longestWinStreak: outcome === 'win' ? 1 : 0,
        },
      });
      return;
    }

    const isWin = outcome === 'win';
    const newWinStreak = isWin ? existing.winStreak + 1 : 0;

    await db.playerRating.update({
      where: { userId: playerId },
      data: {
        currentRating: newRating,
        peakRating: Math.max(existing.peakRating, newRating),
        gamesPlayed: { increment: 1 },
        wins: isWin ? { increment: 1 } : undefined,
        losses: outcome === 'loss' ? { increment: 1 } : undefined,
        draws: outcome === 'draw' ? { increment: 1 } : undefined,
        winStreak: newWinStreak,
        longestWinStreak: Math.max(existing.longestWinStreak, newWinStreak),
      },
    });
  }
}
