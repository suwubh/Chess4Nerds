import { useEffect, useState } from 'react';
import GameHistory from '@/components/GameHistory';
import PlayerStats from '@/components/PlayerStats';
import { User } from '@repo/store/src/atoms/user';

const BACKEND_URL =
  import.meta.env.VITE_APP_BACKEND_URL ?? 'http://localhost:3000';

export function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
          credentials: 'include',
        });
        if (!cancelled && res.ok) {
          setUser(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
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
      <div className="flex justify-center items-center min-h-[400px] text-textMain">
        Loading profile...
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-bgSecondary rounded-xl p-8 text-center border border-border">
          <h2 className="text-2xl font-bold text-textMain mb-2">
            Sign in to view your profile
          </h2>
          <p className="text-textSecondary mb-6">
            Log in to track your games, ratings, and standings.
          </p>
          <a
            href="/login"
            className="inline-block bg-accent hover:bg-accentHover text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Go to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-bgSecondary rounded-xl p-6 border border-border">
          <h1 className="text-2xl font-bold text-textMain">
            {user.name}
            {user.isGuest && (
              <span className="ml-3 text-xs bg-warning text-white px-2 py-1 rounded-full align-middle">
                GUEST
              </span>
            )}
          </h1>
          <p className="text-sm text-textSecondary mt-1">ID: {user.id}</p>
        </header>

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="bg-bgSecondary rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-textMain mb-4">Statistics</h2>
            <PlayerStats userId={user.id} />
          </section>

          <section className="bg-bgSecondary rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-textMain mb-4">Recent Games</h2>
            <GameHistory userId={user.id} />
          </section>
        </div>
      </div>
    </div>
  );
}
