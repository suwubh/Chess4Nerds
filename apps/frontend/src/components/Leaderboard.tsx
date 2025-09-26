import React, { useState, useEffect } from 'react';
import './Leaderboard.css';

interface Player {
    rank: number;
    id: string;
    username: string;
    currentRating: number;
    peakRating: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    winStreak: number;
    winRate: string;
}

const Leaderboard: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLeaderboard();
        
        // Listen for leaderboard updates via WebSocket
        const handleLeaderboardUpdate = () => {
            fetchLeaderboard();
        };

        // Add event listener if you have a WebSocket connection
        // websocket?.addEventListener('message', handleWebSocketMessage);

        return () => {
            // cleanup
        };
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leaderboard`);
            const data = await response.json();
            
            if (data.success) {
                setPlayers(data.data);
            } else {
                setError('Failed to load leaderboard');
            }
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading leaderboard...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="leaderboard">
            <h2>🏆 Global Leaderboard</h2>
            <div className="leaderboard-table">
                <div className="table-header">
                    <span>Rank</span>
                    <span>Player</span>
                    <span>Rating</span>
                    <span>Games</span>
                    <span>Win Rate</span>
                    <span>Streak</span>
                </div>
                {players.map((player) => (
                    <div key={player.id} className={`player-row ${player.rank <= 3 ? 'top-player' : ''}`}>
                        <span className="rank">
                            {player.rank === 1 && '👑'}
                            {player.rank === 2 && '🥈'}
                            {player.rank === 3 && '🥉'}
                            {player.rank > 3 && `#${player.rank}`}
                        </span>
                        <span className="username">{player.username}</span>
                        <span className="rating">{player.currentRating}</span>
                        <span className="games">{player.gamesPlayed}</span>
                        <span className="winrate">{player.winRate}%</span>
                        <span className="streak">{player.winStreak}</span>
                    </div>
                ))}
            </div>
            <button onClick={fetchLeaderboard} className="refresh-button">
                🔄 Refresh
            </button>
        </div>
    );
};

export default Leaderboard;
