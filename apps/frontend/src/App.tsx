/* eslint-disable @typescript-eslint/no-unused-vars */

import "./App.css";
import "./themes.css";

import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';
import { Landing } from './screens/Landing';
import { Game } from './screens/Game';
import { ComputerGame } from './screens/ComputerGame';
import Login from './screens/Login';
import { Suspense } from 'react';
import { RecoilRoot } from 'recoil';
import { Loader } from './components/Loader';
import { Layout } from './layout';
import { Settings } from './screens/Settings';
import { Themes } from "./components/themes";
import { ThemesProvider } from "./context/themeContext";

// Import the new leaderboard and game history components
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
  // TODO: Get the current logged-in user's ID from your auth system
  // Replace this with your actual authentication logic
  const getCurrentUserId = (): string => {
    // Example ways to get current user ID:
    // 1. From localStorage: localStorage.getItem('userId') || ''
    // 2. From Recoil state
    // 3. From your auth context
    // 4. From JWT token
    
    // For now, return empty string - you'll need to implement this
    return localStorage.getItem('userId') || '';
  };

  const currentUserId = getCurrentUserId();

  // If no user is logged in, show login prompt
  if (!currentUserId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-bold">Please log in to view your profile</h2>
        <a 
          href="/login" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Go to Login
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Your Chess Profile</h1>
      
      {/* Player Stats Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <PlayerStats userId={currentUserId} />
      </div>
      
      {/* Game History Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <GameHistory userId={currentUserId} />
      </div>
    </div>
  );
}

export default App;
