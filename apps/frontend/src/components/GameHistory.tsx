import { useEffect, useState } from 'react';

const BACKEND_URL =
  import.meta.env.VITE_APP_BACKEND_URL ?? 'http://localhost:3000';

interface GameHistoryProps {
  userId: string;
}

interface Game {
  id: string;
  whitePlayer: { username: string };
  blackPlayer: { username: string };
  result: string;
  outcome: 'win' | 'loss' | 'draw' | null;
  ratingChange: number | null;
  playerRatingAfter: number;
  startAt: string;
  timeControl: string;
  opening: string;
  playerColor: 'white' | 'black';
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const outcomeStyle = (outcome: Game['outcome']) => {
  switch (outcome) {
    case 'win':
      return 'text-green-500';
    case 'loss':
      return 'text-red-500';
    case 'draw':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
};

const GameHistory = ({ userId }: GameHistoryProps) => {
  const [games, setGames] = useState<Game[]>([]);
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
        const res = await fetch(
          `${BACKEND_URL}/api/games/history/${userId}?limit=10`,
          { credentials: 'include' },
        );
        if (res.status === 404) {
          if (!cancelled) setGames([]);
          return;
        }
        if (!res.ok) throw new Error(res.statusText);
        const body = await res.json();
        if (!cancelled) setGames(body.success && body.data ? body.data.games ?? [] : []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load game history');
          setGames([]);
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
      <div className="text-center py-8 text-textSecondary">
        Loading games...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-2">Failed to load games</p>
        <p className="text-sm text-textSecondary">{error}</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-12 text-textSecondary">
        <p className="text-base font-medium mb-2">No games played yet</p>
        <a href="/" className="text-accent hover:underline">
          Play your first game
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-textMain">
          Recent Games ({games.length})
        </h3>
        {games.length >= 10 && (
          <a href={`/history/${userId}`} className="text-sm text-accent hover:underline">
            View all →
          </a>
        )}
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {games.map((game) => (
          <div
            key={game.id}
            className="flex items-center justify-between p-3 bg-bgMain rounded-lg border border-border"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm text-textMain">
                <span className="truncate">
                  {game.whitePlayer.username} vs {game.blackPlayer.username}
                </span>
                <span className="text-xs text-textSecondary">
                  ({game.playerColor})
                </span>
              </div>
              <div className="text-xs text-textSecondary flex items-center gap-2 mt-1">
                <span className={`uppercase font-semibold ${outcomeStyle(game.outcome)}`}>
                  {game.outcome ?? 'unknown'}
                </span>
                {game.ratingChange !== null && (
                  <>
                    <span>•</span>
                    <span
                      className={
                        game.ratingChange >= 0 ? 'text-green-500' : 'text-red-500'
                      }
                    >
                      {game.ratingChange >= 0 ? '+' : ''}
                      {game.ratingChange}
                    </span>
                  </>
                )}
                <span>•</span>
                <span>{game.opening}</span>
              </div>
            </div>
            <div className="text-xs text-textSecondary text-right ml-3">
              {formatDate(game.startAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameHistory;
