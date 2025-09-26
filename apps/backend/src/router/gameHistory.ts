import { Router } from 'express';
import { GameHistoryService } from '../services/gameHistoryService';
import { db } from '../db';

const router = Router();
const gameHistoryService = new GameHistoryService();

// GET /api/games/history/:userId
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        
        const games = await gameHistoryService.getPlayerGameHistory(userId, page, limit);
        
        res.json({ 
            success: true, 
            data: {
                games,
                page,
                limit,
                hasMore: games.length === limit
            }
        });
    } catch (error) {
        console.error('Game history error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch game history' 
        });
    }
});

// GET /api/games/stats/:userId
router.get('/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const stats = await db.playerRating.findUnique({
            where: { userId },
            select: {
                gamesPlayed: true,
                wins: true,
                losses: true,
                draws: true,
                currentRating: true,
                peakRating: true,
                winStreak: true,
                longestWinStreak: true
            }
        });

        if (!stats) {
            return res.status(404).json({ 
                success: false, 
                error: 'User stats not found' 
            });
        }

        const winRate = stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed * 100).toFixed(1) : '0.0';

        res.json({ 
            success: true, 
            data: {
                ...stats,
                winRate: parseFloat(winRate)
            }
        });
    } catch (error) {
        console.error('Game stats error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch game stats' 
        });
    }
});

export default router;
