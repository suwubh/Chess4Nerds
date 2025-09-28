import { db } from '../db';
import { GameResult } from '@prisma/client';

export class GameHistoryService {
    async saveGameWithRatings(gameData: {
        gameId: string;
        whitePlayerId: string;
        blackPlayerId: string;
        result: GameResult;
        whiteRatingBefore: number;
        blackRatingBefore: number;
        whiteRatingAfter: number;
        blackRatingAfter: number;
        totalMoves: number;
        gameDurationSeconds: number;
    }): Promise<void> {
        // Update the existing game with rating information
        await db.game.update({
            where: { id: gameData.gameId },
            data: {
                whiteRatingBefore: gameData.whiteRatingBefore,
                blackRatingBefore: gameData.blackRatingBefore,
                whiteRatingAfter: gameData.whiteRatingAfter,
                blackRatingAfter: gameData.blackRatingAfter,
                totalMoves: gameData.totalMoves,
                gameDurationSeconds: gameData.gameDurationSeconds,
                status: 'COMPLETED',
                result: gameData.result,
                endAt: new Date()
            }
        });

        // Update user ratings in User table
        await db.user.update({
            where: { id: gameData.whitePlayerId },
            data: { rating: gameData.whiteRatingAfter }
        });
        await db.user.update({
            where: { id: gameData.blackPlayerId },
            data: { rating: gameData.blackRatingAfter }
        });

        // Update player ratings
        const whiteOutcome = this.getOutcome(gameData.result, 'white');
        const blackOutcome = this.getOutcome(gameData.result, 'black');

        await this.updatePlayerRating(gameData.whitePlayerId, gameData.whiteRatingAfter, whiteOutcome);
        await this.updatePlayerRating(gameData.blackPlayerId, gameData.blackRatingAfter, blackOutcome);
    }

    private getOutcome(result: GameResult, playerColor: 'white' | 'black'): 'win' | 'loss' | 'draw' {
        if (result === 'DRAW') return 'draw';
        if (playerColor === 'white') {
            return result === 'WHITE_WINS' ? 'win' : 'loss';
        } else {
            return result === 'BLACK_WINS' ? 'win' : 'loss';
        }
    }

    async updatePlayerRating(playerId: string, newRating: number, outcome: 'win' | 'loss' | 'draw') {
        const existingRating = await db.playerRating.findUnique({
            where: { userId: playerId }
        });

        if (existingRating) {
            // Update existing record
            await db.playerRating.update({
                where: { userId: playerId },
                data: {
                    currentRating: newRating,
                    peakRating: Math.max(existingRating.peakRating ?? 1200, newRating),
                    gamesPlayed: { increment: 1 },
                    wins: outcome === 'win' ? { increment: 1 } : undefined,
                    losses: outcome === 'loss' ? { increment: 1 } : undefined,
                    draws: outcome === 'draw' ? { increment: 1 } : undefined,
                    winStreak: outcome === 'win' ? { increment: 1 } : 0,
                    longestWinStreak: outcome === 'win'
                        ? Math.max(existingRating.longestWinStreak ?? 0, (existingRating.winStreak ?? 0) + 1)
                        : existingRating.longestWinStreak
                }
            });
        } else {
            // Create new rating record
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
                    longestWinStreak: outcome === 'win' ? 1 : 0
                }
            });
        }
    }

    async getPlayerGameHistory(playerId: string, page: number = 1, limit: number = 20) {
        const offset = (page - 1) * limit;

        const games = await db.game.findMany({
            where: {
                OR: [
                    { whitePlayerId: playerId },
                    { blackPlayerId: playerId }
                ],
                status: 'COMPLETED'
            },
            include: {
                whitePlayer: {
                    select: { id: true, username: true, name: true }
                },
                blackPlayer: {
                    select: { id: true, username: true, name: true }
                }
            },
            orderBy: { startAt: 'desc' },
            skip: offset,
            take: limit
        });

        return games.map(game => {
            const isWhite = game.whitePlayerId === playerId;
            const playerRatingBefore = isWhite ? game.whiteRatingBefore : game.blackRatingBefore;
            const playerRatingAfter = isWhite ? game.whiteRatingAfter : game.blackRatingAfter;
            const ratingChange = (playerRatingAfter !== null && playerRatingBefore !== null)
                ? playerRatingAfter - playerRatingBefore
                : null;

            return {
                id: game.id,
                whitePlayer: {
                    id: game.whitePlayer.id,
                    username: game.whitePlayer?.username ?? game.whitePlayer?.name ?? 'Unknown'
                },
                blackPlayer: {
                    id: game.blackPlayer.id,
                    username: game.blackPlayer?.username ?? game.blackPlayer?.name ?? 'Unknown'
                },
                result: game.result,
                timeControl: game.timeControl,
                opening: game.opening ?? 'Unknown Opening',
                startAt: game.startAt,
                endAt: game.endAt,
                totalMoves: game.totalMoves ?? 0,
                gameDurationSeconds: game.gameDurationSeconds ?? 0,
                playerColor: isWhite ? 'white' : 'black',
                playerRatingBefore: playerRatingBefore ?? 1200,
                playerRatingAfter: playerRatingAfter ?? 1200,
                ratingChange: ratingChange,
                outcome: this.getPlayerOutcome(game.result, isWhite ? 'white' : 'black')
            };
        });
    }

    private getPlayerOutcome(result: GameResult | null, playerColor: 'white' | 'black'): 'win' | 'loss' | 'draw' | null {
        if (!result) return null;
        return this.getOutcome(result, playerColor);
    }
}
