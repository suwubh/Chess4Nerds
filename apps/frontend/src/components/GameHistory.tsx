import React, { useState, useEffect } from 'react';
import './GameHistory.css';

interface Game {
    id: string;
    whitePlayer: { username: string };
    blackPlayer: { username: string };
    result: string;
    outcome: 'win' | 'loss' | 'draw';
    ratingChange: number | null;
    playerRatingAfter: number;
    startAt: string;
    timeControl: string;
    opening: string;
    playerColor: string;
}

interface GameHistoryProps {
    userId: string;
}

const GameHistory: React.FC<GameHistoryProps> = ({ userId }) => {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchGameHistory();
        }
    }, [userId, page]);

    const fetchGameHistory = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/games/history/${userId}?page=${page}&limit=20`
            );
            const data = await response.json();
            
            if (data.success) {
                if (page === 1) {
                    setGames(data.data.games);
                } else {
                    setGames(prev => [...prev, ...data.data.games]);
                }
                setHasMore(data.data.hasMore);
            }
        } catch (error) {
            console.error('Failed to fetch game history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getOutcomeClass = (outcome: string) => {
        switch (outcome) {
            case 'win': return 'outcome-win';
            case 'loss': return 'outcome-loss';
            case 'draw': return 'outcome-draw';
            default: return '';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const loadMore = () => {
        setPage(p => p + 1);
    };

    if (loading && page === 1) return <div>Loading game history...</div>;

    return (
        <div className="game-history">
            <h3>📋 Recent Games</h3>
            <div className="game-list">
                {games.map((game) => (
                    <div key={game.id} className={`game-row ${getOutcomeClass(game.outcome)}`}>
                        <div className="game-players">
                            <span className={game.playerColor === 'white' ? 'playing-white' : 'playing-black'}>
                                {game.whitePlayer.username} vs {game.blackPlayer.username}
                            </span>
                            <span className="player-color">
                                ({game.playerColor === 'white' ? '⚪' : '⚫'})
                            </span>
                        </div>
                        <div className="game-outcome">
                            <span className={`result ${game.outcome}`}>
                                {game.outcome.toUpperCase()}
                            </span>
                            {game.ratingChange !== null && (
                                <span className={`rating-change ${game.ratingChange >= 0 ? 'positive' : 'negative'}`}>
                                    {game.ratingChange >= 0 ? '+' : ''}{game.ratingChange}
                                </span>
                            )}
                            <span className="new-rating">({game.playerRatingAfter})</span>
                        </div>
                        <div className="game-meta">
                            <span className="opening">{game.opening}</span>
                            <span className="time-control">{game.timeControl}</span>
                            <span className="date">{formatDate(game.startAt)}</span>
                        </div>
                    </div>
                ))}
            </div>
            
            {hasMore && (
                <button 
                    className="load-more"
                    onClick={loadMore}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Load More Games'}
                </button>
            )}
        </div>
    );
};

export default GameHistory;
