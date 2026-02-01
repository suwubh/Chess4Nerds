import { useState, useEffect } from 'react';
import { Game } from 'js-chess-engine';
import { Chess } from 'chess.js';
import { ChessBoard } from '@/components/ChessBoard';
import { useThemeContext } from '@/hooks/useThemes';
import { useRecoilState } from 'recoil';
import { movesAtom } from '@repo/store/src/atoms/chessBoard';

export const ComputerGame = () => {
  const [chess] = useState(() => new Chess());
  const [board, setBoard] = useState(chess.board());
  const [isThinking, setIsThinking] = useState(false);
  const [difficulty, setDifficulty] = useState(2);
  const [gameStatus, setGameStatus] = useState('playing');
  const [moves, setMoves] = useRecoilState(movesAtom);
  const { theme } = useThemeContext();

  // Dropdown selection (default White)
  const [selectedColor, setSelectedColor] = useState<"w" | "b" | "random">("w");
  // Actual active color in current game
  const [myColor, setMyColor] = useState<"w" | "b">("w");

  // Mock socket
  const mockSocket = {
    send: (data: string) => {
      const parsed = JSON.parse(data);
      if (parsed.type === 'move') {
        setTimeout(() => makeComputerMove(), 500);
      }
    }
  } as WebSocket;

  const makeComputerMove = () => {
    if (isThinking || chess.isGameOver()) return;

    setIsThinking(true);

    setTimeout(() => {
      try {
        const engine = new Game();
        const allMoves = chess.history({ verbose: true });

        // Sync previous moves into engine
        allMoves.forEach((move) => {
          try {
            engine.move(move.from.toUpperCase(), move.to.toUpperCase());
          } catch (e) {
            console.error('Engine sync error:', e);
          }
        });

        const aiMoveResult: any = engine.aiMove(difficulty);

        let aiMove = null;
        if (aiMoveResult && typeof aiMoveResult === "object") {
          const moveKeys = Object.keys(aiMoveResult);
          if (moveKeys.length > 0) {
            const from = moveKeys[0].toLowerCase();
            const to = aiMoveResult[moveKeys[0]].toLowerCase();
            aiMove = { from, to };
          }
        }

        if (!aiMove) return;

        const move = chess.move(aiMove);

        if (move) {
          setBoard(chess.board());
          setMoves(prev => [...prev, move]);

          if (chess.isGameOver()) {
            setGameStatus(chess.isCheckmate() ? 'checkmate' : 'draw');
          }
        }
      } catch (error) {
        console.error('Computer move error:', error);
      } finally {
        setIsThinking(false);
      }
    }, 1000 + difficulty * 300);
  };

  const resetGame = () => {
    chess.reset();
    setBoard(chess.board());
    setMoves([]);
    setGameStatus('playing');
    setIsThinking(false);

    // Decide player color from dropdown
    let newColor: "w" | "b" = "w";
    if (selectedColor === "random") {
      newColor = Math.random() > 0.5 ? "w" : "b";
    } else {
      newColor = selectedColor;
    }
    setMyColor(newColor);

    // If player is black, computer moves first
    if (newColor === "b") {
      setTimeout(() => makeComputerMove(), 500);
    }
  };

  // Helper function to get color display name
  const getColorDisplayName = (color: "w" | "b" | "random") => {
    switch (color) {
      case "w": return "White";
      case "b": return "Black";
      case "random": return "Random";
      default: return "Unknown";
    }
  };

  // Check if selected color differs from current game color
  const colorNeedsUpdate = () => {
    if (selectedColor === "random") return false; // Random can't be compared
    return selectedColor !== myColor;
  };

  // 🔑 Run once on mount to apply initial dropdown choice
  useEffect(() => {
    resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Game Controls */}
      <div className="flex flex-col items-center gap-4 mb-4">
        <h2
          className={`text-2xl font-bold ${
            theme === 'pink' ? 'text-pink-400' : 'text-[#9A9484]'
          }`}
        >
          Play vs Computer
        </h2>
        <p className="text-sm text-gray-500">
          You: {myColor === "w" ? "White" : "Black"} | Computer: {myColor === "w" ? "Black" : "White"}
        </p>

        {/* Color Selector with Enhanced UX */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="font-medium">Play as:</label>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value as "w" | "b" | "random")}
              className="px-3 py-1 rounded border text-black"
              disabled={isThinking} // Only disable when computer is thinking
            >
              <option value="w">White</option>
              <option value="b">Black</option>
              <option value="random">Random</option>
            </select>
          </div>
          
          {/* Visual feedback for pending color changes */}
          {gameStatus === 'playing' && colorNeedsUpdate() && (
            <div className="text-xs text-center">
              <span className="text-orange-500 bg-orange-50 px-2 py-1 rounded">
                ⚠️ Click "New Game" to play as {getColorDisplayName(selectedColor)}
              </span>
            </div>
          )}
          
          {/* Show when selection will be applied */}
          {gameStatus !== 'playing' && (
            <span className="text-xs text-green-600">
              ✓ Next game: Play as {getColorDisplayName(selectedColor)}
            </span>
          )}
        </div>

        {/* Difficulty Selector */}
        <div className="flex items-center gap-2">
          <label className="font-medium">Difficulty:</label>
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(Number(e.target.value))}
            className="px-3 py-1 rounded border text-black"
            disabled={isThinking} // Only disable when computer is thinking
          >
            <option value={0}>Beginner</option>
            <option value={1}>Easy</option>
            <option value={2}>Medium</option>
            <option value={3}>Hard</option>
            <option value={4}>Expert</option>
          </select>
        </div>

        {/* Game Status */}
        <div className="text-center">
          {isThinking && (
            <p className="text-blue-500 animate-pulse font-bold">
              Computer is thinking...
            </p>
          )}
          {gameStatus === 'checkmate' && (
            <p className="text-red-500 font-bold">Game Over - Checkmate!</p>
          )}
          {gameStatus === 'draw' && (
            <p className="text-yellow-500 font-bold">Game Draw!</p>
          )}
          <p className="text-sm text-gray-400">
            Total moves: {chess.history().length}
          </p>
        </div>
      </div>

      {/* Chessboard */}
      <div className="relative">
        <ChessBoard
          myColor={myColor}
          gameId="computer-vs-human"
          started={true}
          chess={chess}
          setBoard={setBoard}
          board={board}
          socket={mockSocket}
        />

        {/* Thinking overlay */}
        {isThinking && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded">
            <div className="bg-white px-4 py-2 rounded shadow-lg">
              <span className="text-black font-medium">
                Computer thinking...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Reset Button with Enhanced Feedback */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={resetGame}
          className={`px-6 py-2 rounded font-medium ${
            theme === 'pink'
              ? 'bg-pink-300 hover:bg-pink-400'
              : 'bg-[#9A9484] hover:bg-[#8B8570]'
          } text-white transition-colors ${isThinking ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isThinking}
        >
          New Game
        </button>
        
        {/* Show what the new game will be */}
        {colorNeedsUpdate() && gameStatus === 'playing' && (
          <span className="text-xs text-gray-500">
            (Next game: You'll play as {getColorDisplayName(selectedColor)})
          </span>
        )}
      </div>
    </div>
  );
};
