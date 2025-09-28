import React, { useState, useEffect } from 'react';

interface LeaderboardEntry {
  id: string;
  name: string;
  rating?: number;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winRate: number;
  rank: number;
}

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:3000';
        const response = await fetch(`${BACKEND_URL}/api/leaderboard?limit=50`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setLeaderboard(Array.isArray(data) ? data : data.leaderboard || []);
        } else {
          throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError(error instanceof Error ? error.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-yellow-500 border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg text-gray-600 dark:text-gray-300">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-2">⚠️ Failed to load leaderboard</div>
          <div className="text-sm text-gray-500 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
          🏆 Leaderboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Top chess players in our community
        </p>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <div className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            No players on leaderboard yet
          </div>
          <p className="text-gray-500 mb-4">
            Be the first to play and claim the top spot!
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Rank</th>
                  <th className="px-6 py-4 text-left font-semibold">Player</th>
                  <th className="px-6 py-4 text-center font-semibold">Rating</th>
                  <th className="px-6 py-4 text-center font-semibold">Games</th>
                  <th className="px-6 py-4 text-center font-semibold">W/L/D</th>
                  <th className="px-6 py-4 text-center font-semibold">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player, index) => (
                  <tr 
                    key={player.id}
                    className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      index < 3 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                        </span>
                        <span className="font-bold text-lg">{player.rank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {player.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-bold text-purple-600">
                        {player.rating || 'Unrated'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-medium">{player.totalGames}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm">
                        <span className="text-green-600 font-medium">{player.wins}</span> / 
                        <span className="text-red-600 font-medium">{player.losses}</span> / 
                        <span className="text-gray-600 font-medium">{player.draws}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="font-bold text-blue-600">
                          {player.winRate.toFixed(1)}%
                        </div>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${player.winRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
