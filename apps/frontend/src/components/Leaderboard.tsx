import React, { useState, useEffect } from 'react';

interface LeaderboardEntry {
  id: string;
  name: string;
  rating?: number;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winRate: number; // Now expecting a number
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
          const result = await response.json();
          console.log('Leaderboard API Response:', result); // Debug log
          
          // FIXED: Handle backend response format correctly
          if (result.success && result.data) {
            setLeaderboard(result.data);
          } else {
            setLeaderboard([]);
          }
        } else {
          throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError(error instanceof Error ? error.message : 'Failed to load leaderboard');
        setLeaderboard([]);
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
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-accent border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg text-textMain">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-2">⚠️ Failed to load leaderboard</div>
          <div className="text-sm text-textSecondary mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accentHover"
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
        <h1 className="text-4xl font-bold text-textMain mb-2">
          🏆 Leaderboard
        </h1>
        <p className="text-textSecondary">
          Top chess players in our community
        </p>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12 bg-bgSecondary rounded-2xl border border-border">
          <div className="text-6xl mb-4">🏆</div>
          <div className="text-lg font-medium text-textMain mb-2">
            No players on leaderboard yet
          </div>
          <p className="text-textSecondary mb-4">
            Be the first to play and claim the top spot!
          </p>
        </div>
      ) : (
        <div className="bg-bgSecondary rounded-2xl shadow-xl overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-accent text-black">
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
                    className="border-b border-border hover:bg-bgMain transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                        </span>
                        <span className="font-bold text-lg text-textMain">{player.rank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-textMain">
                        {player.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-bold text-accent">
                        {player.rating || 'Unrated'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-medium text-textMain">{player.totalGames}</div>
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
                        <div className="font-bold text-accent">
                          {/* FIXED: Now winRate is a number, so .toFixed() works */}
                          {player.winRate.toFixed(1)}%
                        </div>
                        <div className="w-16 bg-border rounded-full h-2">
                          <div 
                            className="bg-accent h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(player.winRate, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Show total count */}
          <div className="bg-bgMain px-6 py-3 border-t border-border">
            <p className="text-sm text-textSecondary text-center">
              Showing {leaderboard.length} players with completed games
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
