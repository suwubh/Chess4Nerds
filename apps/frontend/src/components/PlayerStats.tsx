import React, { useState, useEffect } from 'react';

interface PlayerStatsProps {
  userId: string;
}

interface Stats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  rating?: number;
  rank?: number;
}

const PlayerStats: React.FC<PlayerStatsProps> = ({ userId }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:3000';
        const response = await fetch(`${BACKEND_URL}/api/users/${userId}/stats`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else if (response.status === 404) {
          // User has no games yet
          setStats({
            totalGames: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            winRate: 0,
          });
        } else {
          throw new Error(`Failed to fetch stats: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError(error instanceof Error ? error.message : 'Failed to load stats');
        // Set default stats on error
        setStats({
          totalGames: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          winRate: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">⚠️ Failed to load statistics</div>
        <div className="text-sm text-gray-500">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-blue-500 hover:underline text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📊</div>
        <div>No statistics available</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.totalGames}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Total Games</div>
        </div>
        
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.wins}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Wins</div>
        </div>
        
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{stats.losses}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Losses</div>
        </div>
        
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{stats.draws}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Draws</div>
        </div>
      </div>

      {/* Win Rate */}
      {stats.totalGames > 0 && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Win Rate</span>
            <span className="text-lg font-bold text-blue-600">{stats.winRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.winRate}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Rating and Rank (if available) */}
      {(stats.rating || stats.rank) && (
        <div className="flex gap-4">
          {stats.rating && (
            <div className="flex-1 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
              <div className="text-xl font-bold text-yellow-600">⭐ {stats.rating}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Rating</div>
            </div>
          )}
          
          {stats.rank && (
            <div className="flex-1 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
              <div className="text-xl font-bold text-purple-600">🏆 #{stats.rank}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Global Rank</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerStats;
