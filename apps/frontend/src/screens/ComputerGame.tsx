import { useEffect, useState } from 'react';
import { Game as ChessEngine } from 'js-chess-engine';
import { Chess } from 'chess.js';
import { useRecoilState } from 'recoil';

import { ChessBoard } from '@/components/ChessBoard';
import { useThemeContext } from '@/hooks/useThemes';
import { movesAtom } from '@repo/store/src/atoms/chessBoard';

type Color = 'w' | 'b';
type ColorChoice = Color | 'random';

const DIFFICULTIES = [
  { value: 0, label: 'Beginner' },
  { value: 1, label: 'Easy' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Hard' },
  { value: 4, label: 'Expert' },
];

const colorLabel = (c: ColorChoice) =>
  c === 'w' ? 'White' : c === 'b' ? 'Black' : 'Random';

const computeEngineMove = (history: { from: string; to: string }[], level: number) => {
  const engine = new ChessEngine();
  for (const move of history) {
    try {
      engine.move(move.from.toUpperCase(), move.to.toUpperCase());
    } catch (err) {
      console.error('Engine sync error:', err);
    }
  }
  const result = engine.aiMove(level);
  if (!result || typeof result !== 'object') return null;
  const [fromKey] = Object.keys(result);
  if (!fromKey) return null;
  return { from: fromKey.toLowerCase(), to: result[fromKey].toLowerCase() };
};

export const ComputerGame = () => {
  const [chess] = useState(() => new Chess());
  const [board, setBoard] = useState(chess.board());
  const [, setMoves] = useRecoilState(movesAtom);
  const { theme } = useThemeContext();

  const [selectedColor, setSelectedColor] = useState<ColorChoice>('w');
  const [myColor, setMyColor] = useState<Color>('w');
  const [difficulty, setDifficulty] = useState(2);
  const [isThinking, setIsThinking] = useState(false);
  const [gameStatus, setGameStatus] = useState<'playing' | 'checkmate' | 'draw'>('playing');

  const makeComputerMove = () => {
    if (chess.isGameOver()) return;
    setIsThinking(true);

    setTimeout(() => {
      try {
        const aiMove = computeEngineMove(chess.history({ verbose: true }), difficulty);
        if (!aiMove) return;

        const move = chess.move(aiMove);
        if (!move) return;

        setBoard(chess.board());
        setMoves((prev) => [...prev, move]);

        if (chess.isGameOver()) {
          setGameStatus(chess.isCheckmate() ? 'checkmate' : 'draw');
        }
      } catch (err) {
        console.error('Computer move error:', err);
      } finally {
        setIsThinking(false);
      }
    }, 800 + difficulty * 200);
  };

  const resetGame = () => {
    chess.reset();
    setBoard(chess.board());
    setMoves([]);
    setGameStatus('playing');
    setIsThinking(false);

    const newColor: Color =
      selectedColor === 'random' ? (Math.random() > 0.5 ? 'w' : 'b') : selectedColor;
    setMyColor(newColor);

    if (newColor === 'b') {
      setTimeout(makeComputerMove, 500);
    }
  };

  // ChessBoard sends moves via socket.send; intercept it to trigger the engine
  const localSocket = {
    send: (data: string) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed?.type === 'move') {
          setTimeout(makeComputerMove, 400);
        }
      } catch {
        /* ignore */
      }
    },
  } as unknown as WebSocket;

  useEffect(() => {
    resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const themeText = theme === 'pink' ? 'text-pink-400' : 'text-[#9A9484]';
  const themeBtn =
    theme === 'pink'
      ? 'bg-pink-300 hover:bg-pink-400'
      : 'bg-[#9A9484] hover:bg-[#8B8570]';

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex flex-col items-center gap-4 mb-4">
        <h2 className={`text-2xl font-bold ${themeText}`}>Play vs Computer</h2>
        <p className="text-sm text-gray-500">
          You: {myColor === 'w' ? 'White' : 'Black'} · Computer:{' '}
          {myColor === 'w' ? 'Black' : 'White'}
        </p>

        <div className="flex items-center gap-2">
          <label className="font-medium">Play as:</label>
          <select
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value as ColorChoice)}
            disabled={isThinking}
            className="px-3 py-1 rounded border text-black"
          >
            <option value="w">White</option>
            <option value="b">Black</option>
            <option value="random">Random</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="font-medium">Difficulty:</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            disabled={isThinking}
            className="px-3 py-1 rounded border text-black"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-center">
          {isThinking && (
            <p className="text-blue-500 animate-pulse font-bold">
              Computer is thinking...
            </p>
          )}
          {gameStatus === 'checkmate' && (
            <p className="text-red-500 font-bold">Game over - Checkmate</p>
          )}
          {gameStatus === 'draw' && (
            <p className="text-yellow-500 font-bold">Game drawn</p>
          )}
          <p className="text-sm text-gray-400">Total moves: {chess.history().length}</p>
        </div>
      </div>

      <div className="relative">
        <ChessBoard
          myColor={myColor}
          gameId="computer-vs-human"
          started
          chess={chess}
          board={board}
          setBoard={setBoard}
          socket={localSocket}
        />
        {isThinking && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded">
            <div className="bg-white px-4 py-2 rounded shadow-lg">
              <span className="text-black font-medium">Computer thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={resetGame}
          disabled={isThinking}
          className={`px-6 py-2 rounded font-medium text-white transition-colors ${themeBtn} ${
            isThinking ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          New Game
        </button>
        {selectedColor !== 'random' && selectedColor !== myColor && gameStatus === 'playing' && (
          <span className="text-xs text-gray-500">
            Next game: you'll play as {colorLabel(selectedColor)}
          </span>
        )}
      </div>
    </div>
  );
};
