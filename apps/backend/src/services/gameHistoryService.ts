import { GameResult } from '@prisma/client';
import { db } from '../db';

type PlayerColor = 'white' | 'black';
type Outcome = 'win' | 'loss' | 'draw';

function getOutcome(result: GameResult | null, color: PlayerColor): Outcome | null {
  if (!result) return null;
  if (result === 'DRAW') return 'draw';
  const whiteWon = result === 'WHITE_WINS';
  return (color === 'white' ? whiteWon : !whiteWon) ? 'win' : 'loss';
}

export class GameHistoryService {
  async getPlayerGameHistory(playerId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const games = await db.game.findMany({
      where: {
        OR: [{ whitePlayerId: playerId }, { blackPlayerId: playerId }],
        status: 'COMPLETED',
      },
      include: {
        whitePlayer: { select: { id: true, username: true, name: true } },
        blackPlayer: { select: { id: true, username: true, name: true } },
      },
      orderBy: { startAt: 'desc' },
      skip: offset,
      take: limit,
    });

    return games.map((game) => {
      const isWhite = game.whitePlayerId === playerId;
      const color: PlayerColor = isWhite ? 'white' : 'black';
      const before = isWhite ? game.whiteRatingBefore : game.blackRatingBefore;
      const after = isWhite ? game.whiteRatingAfter : game.blackRatingAfter;

      return {
        id: game.id,
        whitePlayer: {
          id: game.whitePlayer.id,
          username: game.whitePlayer.username ?? game.whitePlayer.name ?? 'Unknown',
        },
        blackPlayer: {
          id: game.blackPlayer.id,
          username: game.blackPlayer.username ?? game.blackPlayer.name ?? 'Unknown',
        },
        result: game.result,
        timeControl: game.timeControl,
        opening: game.opening ?? 'Unknown Opening',
        startAt: game.startAt,
        endAt: game.endAt,
        totalMoves: game.totalMoves ?? 0,
        gameDurationSeconds: game.gameDurationSeconds ?? 0,
        playerColor: color,
        playerRatingBefore: before ?? 1200,
        playerRatingAfter: after ?? 1200,
        ratingChange: before !== null && after !== null ? after - before : null,
        outcome: getOutcome(game.result, color),
      };
    });
  }
}
