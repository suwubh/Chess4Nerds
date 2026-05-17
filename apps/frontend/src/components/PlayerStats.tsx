import { useEffect, useState } from 'react';

const BACKEND_URL =
  import.meta.env.VITE_APP_BACKEND_URL ?? 'http://localhost:3000';

interface PlayerStatsProps {
  userId: string;
}

interface Stats {
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

const EMPTY_STATS: Stats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  currentRating: 1200,
  peakRating: 1200,
  winStreak: 0,
  longestWinStreak: 0,
  winRate: 0,
};

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="text-center p-4 bg-bgMain rounded-lg border border-border">
    <div className="text-2xl font-bold text-textMain">{value}</div>
    <div className="text-xs text-textSecondary mt-1">{label}</div>
  </div>
);

const PlayerStats = ({ userId }: PlayerStatsProps) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/games/stats/${userId}`, {
          credentials: 'include',
        });
        if (res.status === 404) {
          if (!cancelled) setStats(EMPTY_STATS);
          return;
        }
        if (!res.ok) throw new Error(res.statusText);
        const body = await res.json();
        if (!cancelled) setStats(body.success ? body.data : EMPTY_STATS);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load stats');
          setStats(EMPTY_STATS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center py-8 text-textSecondary">Loading stats...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-2">Failed to load statistics</p>
        <p className="text-sm text-textSecondary">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Games" value={stats.gamesPlayed} />
        <StatCard label="Wins" value={stats.wins} />
        <StatCard label="Losses" value={stats.losses} />
        <StatCard label="Draws" value={stats.draws} />
      </div>

      {stats.gamesPlayed > 0 && (
        <div className="p-4 bg-bgMain rounded-lg border border-border">
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-textSecondary">Win rate</span>
            <span className="font-semibold text-textMain">
              {stats.winRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.winRate}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-4 bg-bgMain rounded-lg border border-border text-center">
          <div className="text-xl font-bold text-textMain">{stats.currentRating}</div>
          <div className="text-xs text-textSecondary mt-1">
            Current rating · peak {stats.peakRating}
          </div>
        </div>
        <div className="p-4 bg-bgMain rounded-lg border border-border text-center">
          <div className="text-xl font-bold text-textMain">{stats.winStreak}</div>
          <div className="text-xs text-textSecondary mt-1">
            Win streak · best {stats.longestWinStreak}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStats;
