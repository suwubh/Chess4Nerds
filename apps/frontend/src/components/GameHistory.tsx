import React, { useState, useEffect } from 'react';

interface GameHistoryProps {
  userId: string;
}

interface Game {
  id: string;
  opponent: {
    id: string;
    name: string;
  };
  result: 'win' | 'loss' | 'draw';
  color: 'white' | 'black';
  moves: number;
  duration: number; // in seconds
  createdAt: string;
  endReason?: 'checkmate' | 'resignation' | 'timeout' | 'draw' | 'stalemate';
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
        const response = await fetch(`${BACKEND_URL}/api/users/${userId}/games?limit=10`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setGames(Array.isArray(data) ? data : data.games || []);
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'win': return '🏆';
      case 'loss': return '😞';
      case 'draw': return '🤝';
      default: return '⚪';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
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
          className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
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
        <h3 className="font-medium text-gray-800 dark:text-white">
          Recent Games ({games.length})
        </h3>
        {games.length >= 10 && (
          <a 
            href={`/history/${userId}`} 
            className="text-sm text-purple-600 hover:underline"
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getResultColor(game.result)}`}>
                {getResultIcon(game.result)}
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white truncate">
                    vs {game.opponent.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({game.color === 'white' ? '⚪' : '⚫'})
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <span>{game.moves} moves</span>
                  <span>•</span>
                  <span>{formatDuration(game.duration)}</span>
                  {game.endReason && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{game.endReason}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="text-xs text-gray-500 text-right">
              {formatDate(game.createdAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameHistory;
