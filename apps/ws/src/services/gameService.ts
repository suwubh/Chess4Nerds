import { GameResult, GameStatus } from '@prisma/client';
import { db } from '../db';
import { GameHistoryService } from './gameHistoryService';
import { RatingService } from './ratingService';

const ratingService = new RatingService();
const gameHistoryService = new GameHistoryService();

export class GameService {
  async completeGameWithRatings(gameId: string, result: GameResult, status: GameStatus) {
    const game = await db.game.findUnique({
      where: { id: gameId },
      include: {
        whitePlayer: true,
        blackPlayer: true,
        moves: { orderBy: { moveNumber: 'asc' } },
      },
    });

    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }

    const [whiteRatingRow, blackRatingRow] = await Promise.all([
      db.playerRating.findUnique({ where: { userId: game.whitePlayerId } }),
      db.playerRating.findUnique({ where: { userId: game.blackPlayerId } }),
    ]);

    const whiteRating = whiteRatingRow?.currentRating ?? game.whitePlayer.rating;
    const blackRating = blackRatingRow?.currentRating ?? game.blackPlayer.rating;

    const { whiteNewRating, blackNewRating } = ratingService.calculateNewRatings(
      whiteRating,
      blackRating,
      result,
      whiteRatingRow?.gamesPlayed ?? 0,
      blackRatingRow?.gamesPlayed ?? 0,
    );

    const gameDurationSeconds = Math.round((Date.now() - game.startAt.getTime()) / 1000);

    await gameHistoryService.saveGameWithRatings({
      gameId: game.id,
      whitePlayerId: game.whitePlayerId,
      blackPlayerId: game.blackPlayerId,
      result,
      status,
      whiteRatingBefore: whiteRating,
      blackRatingBefore: blackRating,
      whiteRatingAfter: whiteNewRating,
      blackRatingAfter: blackNewRating,
      totalMoves: game.moves.length,
      gameDurationSeconds,
    });

    return {
      gameId: game.id,
      whitePlayerId: game.whitePlayerId,
      blackPlayerId: game.blackPlayerId,
      whiteNewRating,
      blackNewRating,
      whiteRatingChange: whiteNewRating - whiteRating,
      blackRatingChange: blackNewRating - blackRating,
    };
  }
}
