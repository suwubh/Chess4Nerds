import React, { useState, useEffect } from 'react';

interface PlayerStats {
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    currentRating: number;
    peakRating: number;
    winStreak: number;
    longestWinStreak: number;
    winRate: number;
}

interface PlayerStatsProps {
    userId: string;
}

const PlayerStats: React.FC<PlayerStatsProps> = ({ userId }) => {
    const [stats, setStats] = useState<PlayerStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchStats();
        }
    }, [userId]);

    const fetchStats = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/games/stats/${userId}`);
            const data = await response.json();
            
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading stats...</div>;
    if (!stats) return <div>No stats available</div>;

    return (
        <div className="player-stats">
            <h3>📊 Your Statistics</h3>
            <div className="stats-grid">
                <div className="stat-item">
                    <span className="stat-value">{stats.currentRating}</span>
                    <span className="stat-label">Current Rating</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{stats.peakRating}</span>
                    <span className="stat-label">Peak Rating</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{stats.gamesPlayed}</span>
                    <span className="stat-label">Games Played</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{stats.winRate.toFixed(1)}%</span>
                    <span className="stat-label">Win Rate</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{stats.wins}</span>
                    <span className="stat-label">Wins</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{stats.losses}</span>
                    <span className="stat-label">Losses</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{stats.draws}</span>
                    <span className="stat-label">Draws</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{stats.winStreak}</span>
                    <span className="stat-label">Current Streak</span>
                </div>
            </div>
        </div>
    );
};

export default PlayerStats;
