import { useEffect, useState } from 'react';

const BACKEND_URL =
  import.meta.env.VITE_APP_BACKEND_URL ?? 'http://localhost:3000';

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  rating?: number;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winRate: number;
}

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/leaderboard?limit=50`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(res.statusText);
        const body = await res.json();
        if (!cancelled) setEntries(body.success && body.data ? body.data : []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
          setEntries([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-textMain">
        Loading leaderboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-red-500 mb-2">Failed to load leaderboard</p>
        <p className="text-sm text-textSecondary mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accentHover"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-textMain">Leaderboard</h1>
        <p className="text-textSecondary mt-2">Top players ranked by rating</p>
      </header>

      {entries.length === 0 ? (
        <div className="text-center py-12 bg-bgSecondary rounded-xl border border-border">
          <p className="text-lg font-medium text-textMain mb-1">
            No ranked players yet
          </p>
          <p className="text-textSecondary">
            Play a few games to claim the top spot.
          </p>
        </div>
      ) : (
        <div className="bg-bgSecondary rounded-xl overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-accent text-black">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Rank</th>
                  <th className="px-6 py-4 text-left font-semibold">Player</th>
                  <th className="px-6 py-4 text-center font-semibold">Rating</th>
                  <th className="px-6 py-4 text-center font-semibold">Games</th>
                  <th className="px-6 py-4 text-center font-semibold">W / L / D</th>
                  <th className="px-6 py-4 text-center font-semibold">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((player) => (
                  <tr
                    key={player.id}
                    className="border-b border-border hover:bg-bgMain transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-textMain">{player.rank}</td>
                    <td className="px-6 py-4 text-textMain">{player.name}</td>
                    <td className="px-6 py-4 text-center font-semibold text-accent">
                      {player.rating ?? 'Unrated'}
                    </td>
                    <td className="px-6 py-4 text-center text-textMain">
                      {player.totalGames}
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      <span className="text-green-600">{player.wins}</span> /{' '}
                      <span className="text-red-600">{player.losses}</span> /{' '}
                      <span className="text-gray-500">{player.draws}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-semibold text-accent w-12 text-right">
                          {player.winRate.toFixed(1)}%
                        </span>
                        <div className="w-16 bg-border rounded-full h-2">
                          <div
                            className="bg-accent h-2 rounded-full"
                            style={{ width: `${Math.min(player.winRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-bgMain px-6 py-3 border-t border-border text-center text-sm text-textSecondary">
            Showing {entries.length} players
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
