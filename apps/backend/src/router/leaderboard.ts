import { Router } from 'express';
import { db } from '../db';

const router = Router();

// GET /api/leaderboard
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        
        const leaderboard = await db.playerRating.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true
                    }
                }
            },
            where: {
                gamesPlayed: {
                    gt: 0
                }
            },
            orderBy: {
                currentRating: 'desc'
            },
            take: limit
        });

        const leaderboardWithRank = leaderboard.map((player, index) => ({
            rank: index + 1,
            id: player.user.id,
            name: player.user.username || player.user.name || 'Unknown Player',
            username: player.user.username || player.user.name || 'Unknown Player',
            rating: player.currentRating,
            currentRating: player.currentRating,
            peakRating: player.peakRating,
            gamesPlayed: player.gamesPlayed,
            totalGames: player.gamesPlayed, // Add for frontend compatibility
            wins: player.wins,
            losses: player.losses,
            draws: player.draws,
            winStreak: player.winStreak,
            longestWinStreak: player.longestWinStreak,
            // FIXED: Return as number, not string
            winRate: player.gamesPlayed > 0 ? ((player.wins / player.gamesPlayed) * 100) : 0
        }));

        res.json({
            success: true,
            data: leaderboardWithRank,
            count: leaderboardWithRank.length
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch leaderboard',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// GET /api/leaderboard/user/:userId
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get user's rating data
        const userRating = await db.playerRating.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true
                    }
                }
            }
        });

        if (!userRating) {
            return res.status(404).json({
                success: false,
                error: 'User rating not found'
            });
        }

        // Calculate rank by counting users with higher ratings
        const rank = await db.playerRating.count({
            where: {
                currentRating: {
                    gt: userRating.currentRating
                },
                gamesPlayed: {
                    gt: 0
                }
            }
        }) + 1;

        const userData = {
            rank,
            id: userRating.user.id,
            name: userRating.user.username || userRating.user.name || 'Unknown Player',
            username: userRating.user.username || userRating.user.name || 'Unknown Player',
            currentRating: userRating.currentRating,
            peakRating: userRating.peakRating,
            gamesPlayed: userRating.gamesPlayed,
            wins: userRating.wins,
            losses: userRating.losses,
            draws: userRating.draws,
            winStreak: userRating.winStreak,
            longestWinStreak: userRating.longestWinStreak,
            // FIXED: Return as number, not string
            winRate: userRating.gamesPlayed > 0 ? ((userRating.wins / userRating.gamesPlayed) * 100) : 0
        };

        res.json({
            success: true,
            data: userData
        });
    } catch (error) {
        console.error('User rank error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user rank'
        });
    }
});

export default router;
