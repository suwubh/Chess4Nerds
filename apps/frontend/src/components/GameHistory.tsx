import React, { useState, useEffect } from 'react';

interface GameHistoryProps {
  userId: string;
}

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

const GameHistory: React.FC<GameHistoryProps> = ({ userId }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGameHistory = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:3000';
        // FIXED: Use correct endpoint path
        const response = await fetch(`${BACKEND_URL}/api/games/history/${userId}?limit=10`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          // FIXED: Extract games from success wrapper
          if (result.success && result.data) {
            setGames(result.data.games || []);
          } else {
            setGames([]);
          }
        } else if (response.status === 404) {
          setGames([]);
        } else {
          throw new Error(`Failed to fetch games: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error fetching game history:', error);
        setError(error instanceof Error ? error.message : 'Failed to load game history');
        setGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGameHistory();
  }, [userId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getResultIcon = (outcome: string) => {
    switch (outcome) {
      case 'win': return '🏆';
      case 'loss': return '😞';
      case 'draw': return '🤝';
      default: return '⚪';
    }
  };

  const getResultColor = (outcome: string) => {
    switch (outcome) {
      case 'win': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'loss': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'draw': return 'text-gray-600 bg-gray-50 dark:bg-gray-700';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">⚠️ Failed to load game history</div>
        <div className="text-sm text-gray-500">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-purple-500 hover:underline text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">♟️</div>
        <div className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          No games played yet
        </div>
        <div className="text-sm text-gray-500 mb-4">
          Start playing to see your game history here!
        </div>
        <a
          href="/"
          className="inline-flex items-center px-4 py-2 bg-amber-100 text-gray-800 rounded-lg hover:bg-amber-200 transition-colors"
        >
          <span className="mr-2">🎯</span>
          Play Your First Game
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-white">
         Recent Games ({games.length})
        </h3>

        {games.length >= 10 && (
          <a 
            href={`/history/${userId}`} 
            className="text-sm text-white hover:underline"
          >
            View All →
          </a>
        )}
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {games.map((game) => (
          <div 
            key={game.id} 
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            {/* Game Result & Opponent */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getResultColor(game.outcome)}`}>
                {getResultIcon(game.outcome)}
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white truncate">
                    {game.whitePlayer.username} vs {game.blackPlayer.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({game.playerColor === 'white' ? '⚪' : '⚫'})
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <span className={`result ${game.outcome}`}>
                    {game.outcome.toUpperCase()}
                  </span>
                  {game.ratingChange !== null && (
                    <>
                      <span>•</span>
                      <span className={`rating-change ${game.ratingChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {game.ratingChange >= 0 ? '+' : ''}{game.ratingChange}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>{game.opening}</span>
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="text-xs text-gray-500 text-right">
              {formatDate(game.startAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameHistory;
