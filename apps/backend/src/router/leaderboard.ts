import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const players = await db.playerRating.findMany({
      where: { gamesPlayed: { gt: 0 } },
      include: {
        user: { select: { id: true, username: true, name: true } },
      },
      orderBy: { currentRating: 'desc' },
      take: limit,
    });

    const data = players.map((p, index) => {
      const displayName = p.user.username || p.user.name || 'Unknown Player';
      return {
        rank: index + 1,
        id: p.user.id,
        name: displayName,
        username: displayName,
        rating: p.currentRating,
        currentRating: p.currentRating,
        peakRating: p.peakRating,
        gamesPlayed: p.gamesPlayed,
        totalGames: p.gamesPlayed,
        wins: p.wins,
        losses: p.losses,
        draws: p.draws,
        winStreak: p.winStreak,
        longestWinStreak: p.longestWinStreak,
        winRate: p.gamesPlayed > 0 ? (p.wins / p.gamesPlayed) * 100 : 0,
      };
    });

    res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const playerRating = await db.playerRating.findUnique({
      where: { userId },
      include: { user: { select: { id: true, username: true, name: true } } },
    });

    if (!playerRating) {
      return res.status(404).json({ success: false, error: 'User rating not found' });
    }

    const higherRanked = await db.playerRating.count({
      where: {
        currentRating: { gt: playerRating.currentRating },
        gamesPlayed: { gt: 0 },
      },
    });

    const displayName =
      playerRating.user.username || playerRating.user.name || 'Unknown Player';

    res.json({
      success: true,
      data: {
        rank: higherRanked + 1,
        id: playerRating.user.id,
        name: displayName,
        username: displayName,
        currentRating: playerRating.currentRating,
        peakRating: playerRating.peakRating,
        gamesPlayed: playerRating.gamesPlayed,
        wins: playerRating.wins,
        losses: playerRating.losses,
        draws: playerRating.draws,
        winStreak: playerRating.winStreak,
        longestWinStreak: playerRating.longestWinStreak,
        winRate:
          playerRating.gamesPlayed > 0
            ? (playerRating.wins / playerRating.gamesPlayed) * 100
            : 0,
      },
    });
  } catch (error) {
    console.error('User rank error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user rank' });
  }
});

export default router;
