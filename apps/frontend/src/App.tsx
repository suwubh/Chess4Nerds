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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">♔</span>
          </div>
        </div>
        <p className="mt-4 text-textMain text-lg">Loading your chess profile...</p>
      </div>
    );
  }

  // If no user is logged in, show improved login prompt
  if (!currentUser || !currentUser.id) {
    return (
      <div className="min-h-[600px] bg-bgMain flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
          {/* Chess pieces decoration */}
          <div className="flex justify-center space-x-2 mb-6">
            <span className="text-4xl">♔</span>
            <span className="text-4xl">♕</span>
            <span className="text-4xl">♖</span>
            <span className="text-4xl">♗</span>
            <span className="text-4xl">♘</span>
            <span className="text-4xl">♙</span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Ready to Play Chess?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Log in to view your profile, track your games, and climb the leaderboard!
          </p>
          
          <a 
            href="/login" 
            className="inline-flex items-center justify-center w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <span className="mr-2">🎯</span>
            Start Your Chess Journey
          </a>
          
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Join thousands of chess players worldwide
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgMain py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section - Improved */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
          
          <div className="relative p-8">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-6">
                {/* Avatar with Chess Piece */}
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl text-white drop-shadow-lg">
                      {currentUser.isGuest ? '♟' : '♔'}
                    </span>
                  </div>
                  {currentUser.isGuest && (
                    <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                      GUEST
                    </div>
                  )}
                </div>
                
                {/* User Info */}
                <div className="text-white">
                  <h1 className="text-3xl font-bold mb-2">
                    Welcome back, {currentUser.name}! 
                    <span className="ml-2">👋</span>
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-purple-200">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>Online</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🆔</span>
                      <code className="bg-black bg-opacity-30 px-2 py-1 rounded text-xs">
                        {currentUser.id.slice(0, 8)}...
                      </code>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-3">
                <button className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white border-opacity-20">
                  <span className="mr-2">⚡</span>
                  Quick Game
                </button>
                <button className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white border-opacity-20">
                  <span className="mr-2">🏆</span>
                  Leaderboard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats and History Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Player Stats Section - Improved */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <span className="text-xl">📊</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">Your Statistics</h2>
                </div>
                <div className="text-blue-100 text-sm">
                  Updated live
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <PlayerStats userId={currentUser.id} />
            </div>
          </div>
          
          {/* Game History Section - Improved */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <span className="text-xl">📜</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">Recent Games</h2>
                </div>
                <div className="text-purple-100 text-sm">
                  Last 10 games
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <GameHistory userId={currentUser.id} />
            </div>
          </div>
        </div>

        {/* Achievement/Info Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🎯</span>
              <h3 className="font-semibold text-gray-800 dark:text-white">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              <a href="/game/computer" className="block w-full text-left text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-2 rounded transition-colors">
                🤖 Play vs Computer
              </a>
              <a href="/leaderboard" className="block w-full text-left text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-3 py-2 rounded transition-colors">
                🏆 View Leaderboard
              </a>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">⚙️</span>
              <h3 className="font-semibold text-gray-800 dark:text-white">Preferences</h3>
            </div>
            <div className="space-y-2">
              <a href="/settings" className="block w-full text-left text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-2 rounded transition-colors">
                🎨 Themes & Settings
              </a>
              <button className="block w-full text-left text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-2 rounded transition-colors">
                🔔 Notifications
              </button>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">💡</span>
              <h3 className="font-semibold text-gray-800 dark:text-white">Tips</h3>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <p>• Challenge friends to improve faster</p>
              <p>• Practice puzzles daily</p>
              <p>• Review your game history</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
