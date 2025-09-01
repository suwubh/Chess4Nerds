import { RatingService } from './ratingService';
import { GameHistoryService } from './gameHistoryService';
import { db } from '../db';
import { GameResult } from '@prisma/client';

const ratingService = new RatingService();
const gameHistoryService = new GameHistoryService();

export class GameService {
    async completeGameWithRatings(gameId: string, result: GameResult) {
        try {
            // Get game with players and moves
            const game = await db.game.findUnique({
                where: { id: gameId },
                include: {
                    whitePlayer: true,
                    blackPlayer: true,
                    moves: {
                        orderBy: { moveNumber: 'asc' }
                    }
                }
            });

            if (!game) {
                throw new Error('Game not found');
            }

            // Get current ratings (prioritize PlayerRating table, fallback to User table)
            let whiteRating = game.whitePlayer.rating;
            let blackRating = game.blackPlayer.rating;

            const whitePlayerRating = await db.playerRating.findUnique({
                where: { userId: game.whitePlayerId }
            });
            const blackPlayerRating = await db.playerRating.findUnique({
                where: { userId: game.blackPlayerId }
            });

            if (whitePlayerRating) whiteRating = whitePlayerRating.currentRating;
            if (blackPlayerRating) blackRating = blackPlayerRating.currentRating;

            // Calculate new ratings using Elo system
            const { whiteNewRating, blackNewRating } = ratingService.calculateNewRatings(
                whiteRating,
                blackRating,
                result
            );

            // Calculate game duration
            const startTime = game.startAt.getTime();
            const endTime = new Date().getTime();
            const gameDurationSeconds = Math.round((endTime - startTime) / 1000);

            // Save game with ratings and update player stats
            await gameHistoryService.saveGameWithRatings({
                gameId: game.id,
                whitePlayerId: game.whitePlayerId,
                blackPlayerId: game.blackPlayerId,
                result: result,
                whiteRatingBefore: whiteRating,
                blackRatingBefore: blackRating,
                whiteRatingAfter: whiteNewRating,
                blackRatingAfter: blackNewRating,
                totalMoves: game.moves.length,
                gameDurationSeconds
            });

            console.log(`Game ${gameId} completed with ratings:`, {
                result,
                whiteRatingChange: whiteNewRating - whiteRating,
                blackRatingChange: blackNewRating - blackRating
            });

            return {
                gameId: game.id,
                whiteRatingChange: whiteNewRating - whiteRating,
                blackRatingChange: blackNewRating - blackRating,
                whiteNewRating,
                blackNewRating,
                whitePlayerId: game.whitePlayerId,
                blackPlayerId: game.blackPlayerId
            };

        } catch (error) {
            console.error('Error completing game with ratings:', error);
            throw error;
        }
    }

    // Convert your GAME_STATUS and GAME_RESULT to determine winner
    mapGameResult(status: string, result: string): GameResult {
        // Your existing result is already in the right format
        return result as GameResult;
    }
}
