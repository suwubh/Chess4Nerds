import { useEffect, useMemo, useRef, useState } from 'react';
import { Chess, Square } from 'chess.js';
import { useRecoilState } from 'recoil';

import { ChessBoard, isPromoting } from '@/components/ChessBoard';
import { useSocket } from '@/hooks/useSocket';
import { useThemeContext } from '@/hooks/useThemes';
import { movesAtom } from '@repo/store/src/atoms/chessBoard';

type Color = 'w' | 'b';
type ColorChoice = Color | 'random';
type Difficulty = 'easy' | 'medium' | 'hard';
type Status = 'idle' | 'playing' | 'checkmate' | 'draw';

const INIT_COMPUTER_GAME = 'init_computer_game';
const COMPUTER_GAME_STARTED = 'computer_game_started';
const COMPUTER_MOVE = 'computer_move';
const COMPUTER_GAME_ENDED = 'computer_game_ended';

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const colorLabel = (c: ColorChoice) =>
  c === 'w' ? 'White' : c === 'b' ? 'Black' : 'Random';

export const ComputerGame = () => {
  const socket = useSocket();
  const [chess] = useState(() => new Chess());
  const [board, setBoard] = useState(chess.board());
  const [, setMoves] = useRecoilState(movesAtom);
  const { theme } = useThemeContext();

  const [selectedColor, setSelectedColor] = useState<ColorChoice>('w');
  const [myColor, setMyColor] = useState<Color>('w');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [status, setStatus] = useState<Status>('idle');
  const [thinking, setThinking] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);

  const gameIdRef = useRef<string | null>(null);
  useEffect(() => {
    gameIdRef.current = gameId;
  }, [gameId]);

  const requestNewGame = (colorChoice: ColorChoice, level: Difficulty) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(
      JSON.stringify({
        type: INIT_COMPUTER_GAME,
        payload: { color: colorChoice, difficulty: level },
      }),
    );
  };

  useEffect(() => {
    if (!socket) return;

    const onMessage = (event: MessageEvent) => {
      let msg: { type?: string; payload?: any };
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === COMPUTER_GAME_STARTED) {
        const { gameId: newGameId, playerColor } = msg.payload ?? {};
        chess.reset();
        setBoard(chess.board());
        setMoves([]);
        setGameId(newGameId);
        setMyColor(playerColor === 'b' ? 'b' : 'w');
        setStatus('playing');
        setThinking(playerColor === 'b');
        return;
      }

      if (msg.type === COMPUTER_MOVE) {
        const move = msg.payload?.move;
        if (!move?.from || !move?.to) return;
        try {
          if (isPromoting(chess, move.from as Square, move.to as Square)) {
            chess.move({ from: move.from, to: move.to, promotion: move.promotion ?? 'q' });
          } else {
            chess.move({ from: move.from, to: move.to });
          }
          setBoard(chess.board());
          setMoves((prev) => [...prev, chess.history({ verbose: true }).slice(-1)[0]]);
        } catch (err) {
          console.error('Failed to apply computer move:', err);
        }
        setThinking(false);

        if (chess.isGameOver()) {
          setStatus(chess.isCheckmate() ? 'checkmate' : 'draw');
        }
        return;
      }

      if (msg.type === COMPUTER_GAME_ENDED) {
        setThinking(false);
        const result = msg.payload?.result;
        setStatus(result === 'DRAW' ? 'draw' : 'checkmate');
        return;
      }
    };

    socket.addEventListener('message', onMessage);
    return () => socket.removeEventListener('message', onMessage);
  }, [socket, chess, setMoves]);

  useEffect(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (status !== 'idle') return;
    requestNewGame(selectedColor, difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket?.readyState]);

  const handleNewGame = () => {
    setStatus('idle');
    requestNewGame(selectedColor, difficulty);
  };

  // Proxy the socket so the player's move flips us into "thinking" before the
  // engine's reply lands.
  const wrappedSocket = useMemo(() => {
    if (!socket) return null;
    return new Proxy(socket, {
      get(target, prop) {
        if (prop === 'send') {
          return (data: string) => {
            try {
              const parsed = JSON.parse(data);
              if (parsed?.type === 'move' && gameIdRef.current) {
                setThinking(true);
              }
            } catch {
              /* not JSON */
            }
            target.send(data);
          };
        }
        const value = Reflect.get(target, prop);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  }, [socket]);

  const themeText = theme === 'pink' ? 'text-pink-400' : 'text-[#9A9484]';
  const themeBtn =
    theme === 'pink'
      ? 'bg-pink-300 hover:bg-pink-400'
      : 'bg-[#9A9484] hover:bg-[#8B8570]';

  const ready = !!socket && socket.readyState === WebSocket.OPEN && wrappedSocket;

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
            disabled={thinking}
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
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            disabled={thinking}
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
          {!ready && (
            <p className="text-gray-500 animate-pulse">Connecting to engine...</p>
          )}
          {thinking && ready && (
            <p className="text-blue-500 animate-pulse font-bold">
              Computer is thinking...
            </p>
          )}
          {status === 'checkmate' && (
            <p className="text-red-500 font-bold">Game over - Checkmate</p>
          )}
          {status === 'draw' && (
            <p className="text-yellow-500 font-bold">Game drawn</p>
          )}
          <p className="text-sm text-gray-400">Total moves: {chess.history().length}</p>
        </div>
      </div>

      <div className="relative">
        <ChessBoard
          myColor={myColor}
          gameId={gameId ?? 'computer-pending'}
          started={status === 'playing'}
          chess={chess}
          board={board}
          setBoard={setBoard}
          socket={(wrappedSocket ?? socket) as WebSocket}
        />
        {thinking && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded">
            <div className="bg-white px-4 py-2 rounded shadow-lg">
              <span className="text-black font-medium">Computer thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handleNewGame}
          disabled={thinking || !ready}
          className={`px-6 py-2 rounded font-medium text-white transition-colors ${themeBtn} ${
            thinking || !ready ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          New Game
        </button>
        {selectedColor !== 'random' && selectedColor !== myColor && status === 'playing' && (
          <span className="text-xs text-gray-500">
            Next game: you'll play as {colorLabel(selectedColor)}
          </span>
        )}
      </div>
    </div>
  );
};
