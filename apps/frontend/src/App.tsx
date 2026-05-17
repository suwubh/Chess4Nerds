import './App.css';
import './themes.css';

import { Suspense } from 'react';
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';
import { RecoilRoot } from 'recoil';

import { Loader } from './components/Loader';
import { Layout } from './layout';
import { Themes } from './components/themes';
import { ThemesProvider } from './context/themeContext';

import { Landing } from './screens/Landing';
import { Game } from './screens/Game';
import { ComputerGame } from './screens/ComputerGame';
import Login from './screens/Login';
import { Settings } from './screens/Settings';
import { Profile } from './screens/Profile';

import Leaderboard from './components/Leaderboard';
import GameHistory from './components/GameHistory';
import PlayerStats from './components/PlayerStats';

function GameHistoryRoute() {
  const { userId } = useParams<{ userId: string }>();
  return <GameHistory userId={userId ?? ''} />;
}

function PlayerStatsRoute() {
  const { userId } = useParams<{ userId: string }>();
  return <PlayerStats userId={userId ?? ''} />;
}

function App() {
  return (
    <div className="min-h-screen bg-bgMain text-textMain">
      <RecoilRoot>
        <Suspense fallback={<Loader />}>
          <ThemesProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout><Landing /></Layout>} />
                <Route path="/login" element={<Login />} />
                <Route path="/game/:gameId" element={<Layout><Game /></Layout>} />
                <Route path="/game/computer" element={<Layout><ComputerGame /></Layout>} />
                <Route path="/settings" element={<Layout><Settings /></Layout>}>
                  <Route path="themes" element={<Themes />} />
                </Route>
                <Route path="/leaderboard" element={<Layout><Leaderboard /></Layout>} />
                <Route path="/profile" element={<Layout><Profile /></Layout>} />
                <Route path="/history/:userId" element={<Layout><GameHistoryRoute /></Layout>} />
                <Route path="/stats/:userId" element={<Layout><PlayerStatsRoute /></Layout>} />
              </Routes>
            </BrowserRouter>
          </ThemesProvider>
        </Suspense>
      </RecoilRoot>
    </div>
  );
}

export default App;
