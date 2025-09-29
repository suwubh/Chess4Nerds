import "./App.css";
import "./themes.css";

import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';
import { Landing } from './screens/Landing';
import { Game } from './screens/Game';
import { ComputerGame } from './screens/ComputerGame';
import Login from './screens/Login';
import { Suspense, useEffect, useState } from 'react';
import { RecoilRoot, useRecoilValue } from 'recoil';
import { Loader } from './components/Loader';
import { Layout } from './layout';
import { Settings } from './screens/Settings';
import { Themes } from "./components/themes";
import { ThemesProvider } from "./context/themeContext";
import { User, userAtom } from '../../../packages/store/src/atoms/user';

import Leaderboard from './components/Leaderboard';
import GameHistory from './components/GameHistory';
import PlayerStats from './components/PlayerStats';

function App() {
  return (
    <div className="min-h-screen bg-bgMain text-textMain">
      <RecoilRoot>
        <Suspense fallback={<Loader />}>
          <ThemesProvider>
            <AuthApp />
          </ThemesProvider>
        </Suspense>
      </RecoilRoot>
    </div>
  );
}

function AuthApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={<Layout><Landing /></Layout>} 
        />
        <Route
          path="/login"
          element={<Login />}
        />
        <Route
          path="/game/:gameId"
          element={<Layout><Game /></Layout>}
        />
        <Route
          path="/game/computer"
          element={<Layout><ComputerGame /></Layout>}
        />
        <Route 
          path='/settings' 
          element={<Layout><Settings /></Layout>} 
        >
          <Route path="themes" element={<Themes />} />
        </Route>

        {/* NEW: Leaderboard route */}
        <Route
          path="/leaderboard"
          element={<Layout><Leaderboard /></Layout>}
        />

        {/* NEW: Player profile page with stats and game history */}
        <Route
          path="/profile"
          element={<Layout><PlayerProfilePage /></Layout>}
        />

        {/* NEW: Game history for specific user */}
        <Route
          path="/history/:userId"
          element={<Layout><GameHistoryWrapper /></Layout>}
        />

        {/* NEW: Stats only page for specific user */}
        <Route
          path="/stats/:userId"
          element={<Layout><PlayerStatsWrapper /></Layout>}
        />
      </Routes>
    </BrowserRouter>
  );
}

// Wrapper component to extract userId from URL params
function GameHistoryWrapper() {
  const { userId } = useParams<{ userId: string }>();
  return <GameHistory userId={userId || ''} />;
}

// Wrapper component for player stats
function PlayerStatsWrapper() {
  const { userId } = useParams<{ userId: string }>();
  return <PlayerStats userId={userId || ''} />;
}

// Combined profile page showing both stats and game history
function PlayerProfilePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:3000';
        const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[600px] bg-bgMain">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-border border-t-accent"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl text-textMain">♔</span>
          </div>
        </div>
        <p className="mt-4 text-textMain text-lg font-medium">Loading your chess profile...</p>
      </div>
    );
  }

  if (!currentUser || !currentUser.id) {
    return (
      <div className="min-h-[600px] bg-bgMain flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-bgSecondary rounded-2xl shadow-xl p-8 text-center border-2 border-border">
          <div className="flex justify-center space-x-2 mb-6">
            <span className="text-4xl text-textMain">♔</span>
            <span className="text-4xl text-textMain">♕</span>
            <span className="text-4xl text-textMain">♖</span>
            <span className="text-4xl text-textMain">♗</span>
            <span className="text-4xl text-textMain">♘</span>
            <span className="text-4xl text-textMain">♙</span>
          </div>
          
          <h2 className="text-2xl font-bold text-textMain mb-2">
            Ready to Play Chess?
          </h2>
          <p className="text-textSecondary mb-6 font-medium">
            Log in to view your profile, track your games, and climb the leaderboard!
          </p>
          
          <a 
            href="/login" 
            className="inline-flex items-center justify-center w-full bg-accent hover:bg-accentHover text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-xl border-2 border-accent hover:border-accentHover"
          >
            <span className="mr-2">🎯</span>
            Start Your Chess Journey
          </a>
          
          <div className="mt-4 text-sm text-textSecondary font-medium">
            Join thousands of chess players worldwide
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgMain py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="relative overflow-hidden bg-bgSecondary rounded-2xl shadow-xl border-2 border-border">
          <div className="absolute inset-0 opacity-[0.02]">
            <div className="grid grid-cols-8 h-full">
              {Array.from({ length: 64 }, (_, i) => (
                <div
                  key={i}
                  className={`${
                    (Math.floor(i / 8) + i) % 2 === 0 ? 'bg-textMain' : 'bg-transparent'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="relative p-8">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center shadow-xl border-2 border-border">
                    <span className="text-3xl text-black drop-shadow-lg font-bold">
                      {currentUser.isGuest ? '♟' : '♔'}
                    </span>
                  </div>
                  {currentUser.isGuest && (
                    <div className="absolute -bottom-2 -right-2 bg-warning text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg border border-white">
                      GUEST
                    </div>
                  )}
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold mb-2 text-textMain">
                    Welcome back, {currentUser.name}! 
                    <span className="ml-2">👋</span>
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-success rounded-full shadow-sm"></span>
                      <span className="text-textMain font-medium">🟢Online</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-textMain">🆔</span>
                      <code className="bg-bgMain px-3 py-1 rounded text-xs border-2 border-border text-textMain font-mono font-medium">
                        {currentUser.id.slice(0, 8)}...
                      </code>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <a href="/game/random" className="bg-bgMain hover:bg-accent hover:text-white text-textMain font-medium px-4 py-2 rounded-lg transition-all duration-200 border-2 border-border hover:border-accent shadow-lg">
                  <span className="mr-2">⚡</span>
                  Quick Game
                </a>
                <a href="/leaderboard" className="bg-bgMain hover:bg-accent hover:text-white text-textMain font-medium px-4 py-2 rounded-lg transition-all duration-200 border-2 border-border hover:border-accent shadow-lg">
                  <span className="mr-2">🏆</span>
                  Leaderboard
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Stats and History Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Player Stats Section - FIXED */}
          <div className="bg-bgSecondary rounded-2xl shadow-xl border-2 border-border overflow-hidden">
            <div className="bg-accent p-4 border-b-2 border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/90 text-accent rounded-xl flex items-center justify-center border border-border shadow-md">
                    <span className="text-xl">📊</span>
                  </div>
                  <h2 className="text-xl font-bold text-black drop-shadow-md">Your Statistics</h2>
                </div>
                <div className="text-black/95 text-sm font-semibold drop-shadow-sm">
                  Updated now
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-bgSecondary">
              <PlayerStats userId={currentUser.id} />
            </div>
          </div>
          
          {/* Game History Section - FIXED */}
          <div className="bg-bgSecondary rounded-2xl shadow-xl border-2 border-border overflow-hidden">
            <div className="bg-secondary p-4 border-b-2 border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/90 text-secondary rounded-xl flex items-center justify-center border border-border shadow-md">
                    <span className="text-xl">📜</span>
                  </div>
                  <h2 className="text-xl font-bold text-black drop-shadow-md">Recent Games</h2>
                </div>
                <div className="text-black/95 text-sm font-semibold drop-shadow-sm">
                  Last 10 games
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-bgSecondary">
              <GameHistory userId={currentUser.id} />
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-bgSecondary rounded-xl p-6 shadow-xl border-2 border-border">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🎯</span>
              <h3 className="font-bold text-textMain text-lg">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              <a href="/game/computer" className="block w-full text-left text-accent hover:bg-bgMain hover:text-textMain font-medium px-3 py-3 rounded transition-colors border-2 border-transparent hover:border-border shadow-sm hover:shadow-md">
                🤖 Play vs Computer
              </a>
              <a href="/leaderboard" className="block w-full text-left text-accent hover:bg-bgMain hover:text-textMain font-medium px-3 py-3 rounded transition-colors border-2 border-transparent hover:border-border shadow-sm hover:shadow-md">
                🏆 View Leaderboard
              </a>
              <a href="/game/random" className="block w-full text-left text-accent hover:bg-bgMain hover:text-textMain font-medium px-3 py-3 rounded transition-colors border-2 border-transparent hover:border-border shadow-sm hover:shadow-md">
                ⚡ Find Match
              </a>
            </div>
          </div>
          
          <div className="bg-bgSecondary rounded-xl p-6 shadow-xl border-2 border-border">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⚙️</span>
              <h3 className="font-bold text-textMain text-lg">Preferences</h3>
            </div>
            <div className="space-y-3">
              <a href="/settings" className="block w-full text-left text-textSecondary hover:text-textMain hover:bg-bgMain font-medium px-3 py-3 rounded transition-colors border-2 border-transparent hover:border-border shadow-sm hover:shadow-md">
                🎨 Themes & Settings
              </a>
              {/* <button className="block w-full text-left text-textSecondary hover:text-textMain hover:bg-bgMain font-medium px-3 py-3 rounded transition-colors border-2 border-transparent hover:border-border shadow-sm hover:shadow-md">
                🔔 Notifications
              </button> */}
              <button className="block w-full text-left text-textSecondary hover:text-textMain hover:bg-bgMain font-medium px-3 py-3 rounded transition-colors border-2 border-transparent hover:border-border shadow-sm hover:shadow-md">
                📱 Mobile App(Coming soon...)
              </button>
            </div>
          </div>
          
          <div className="bg-bgSecondary rounded-xl p-6 shadow-xl border-2 border-border">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">💡</span>
              <h3 className="font-bold text-textMain text-lg">Chess Tips</h3>
            </div>
            <div className="text-sm text-textSecondary space-y-3">
              <p className="flex items-start gap-3 font-medium">
                <span className="text-accent text-base font-bold">•</span>
                <span>Challenge friends to improve faster</span>
              </p>
              <p className="flex items-start gap-3 font-medium">
                <span className="text-accent text-base font-bold">•</span>
                <span>Practice puzzles daily for tactical skills</span>
              </p>
              <p className="flex items-start gap-3 font-medium">
                <span className="text-accent text-base font-bold">•</span>
                <span>Review your games to learn from mistakes</span>
              </p>
              <p className="flex items-start gap-3 font-medium">
                <span className="text-accent text-base font-bold">•</span>
                <span>Study openings to gain early advantages</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




export default App;
