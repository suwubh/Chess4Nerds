import { Chess, Color, PieceSymbol, Square } from 'chess.js';
import { MouseEvent, memo, useEffect, useState } from 'react';
import { MOVE } from '../screens/Game';
import LetterNotation from './chess-board/LetterNotation';
import LegalMoveIndicator from './chess-board/LegalMoveIndicator';
import ChessSquare from './chess-board/ChessSquare';
import NumberNotation from './chess-board/NumberNotation';
import { drawArrow } from '../utils/canvas';
import Confetti from 'react-confetti';
import MoveSound from '/move.wav';
import CaptureSound from '/capture.wav';

import { useRecoilState } from 'recoil';
import { useThemeContext } from '@/hooks/useThemes';

import {
  isBoardFlippedAtom,
  movesAtom,
  userSelectedMoveIndexAtom,
} from '@repo/store/src/atoms/chessBoard';

export function isPromoting(chess: Chess, from: Square, to: Square) {
  if (!from) return false;

  const piece = chess.get(from);
  if (piece?.type !== 'p') return false;
  if (piece.color !== chess.turn()) return false;
  if (!['1', '8'].some((it) => to.endsWith(it))) return false;

  return chess
    .moves({ square: from, verbose: true })
    .map((m) => m.to)
    .includes(to);
}

// ----------------------
// Theme-based square color
// ----------------------
function getBoardSquareClass(theme: string, isDark: boolean) {
  if (theme === 'pink') {
    return isDark ? 'bg-boardDarkpink' : 'bg-boardLight';
  }
  return isDark ? 'bg-boardDark' : 'bg-boardLight';
}

// A single cell from chess.js's board(): a piece, or null when the square is empty.
type BoardCell = { square: Square; type: PieceSymbol; color: Color } | null;

// Created once at module scope so a new Audio object isn't allocated every render.
const moveAudio = new Audio(MoveSound);
const captureAudio = new Audio(CaptureSound);

export const ChessBoard = memo(
  ({
    gameId,
    started,
    myColor,
    chess,
    board,
    socket,
    setBoard,
  }: {
    myColor: Color;
    gameId: string;
    started: boolean;
    chess: Chess;
    setBoard: React.Dispatch<
      React.SetStateAction<
        (
          | {
              square: Square;
              type: PieceSymbol;
              color: Color;
            }
          | null
        )[][]
      >
    >;
    board: (
      | {
          square: Square;
          type: PieceSymbol;
          color: Color;
        }
      | null
    )[][];
    socket: WebSocket;
  }) => {
    const { theme } = useThemeContext();

    const [isFlipped, setIsFlipped] = useRecoilState(isBoardFlippedAtom);
    const [userSelectedMoveIndex, setUserSelectedMoveIndex] =
      useRecoilState(userSelectedMoveIndexAtom);
    const [moves, setMoves] = useRecoilState(movesAtom);
    const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
    const [rightClickedSquares, setRightClickedSquares] = useState<string[]>([]);
    const [arrowStart, setArrowStart] = useState<string | null>(null);

    const [from, setFrom] = useState<null | Square>(null);
    const isMyTurn = myColor === chess.turn();
    const [legalMoves, setLegalMoves] = useState<string[]>([]);

    const labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
    const boxSize = 80;
    const [gameOver, setGameOver] = useState(false);

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>, squareRep: string) => {
      e.preventDefault();
      if (e.button === 2) {
        setArrowStart(squareRep);
      }
    };

    useEffect(() => {
      setIsFlipped(myColor === 'b');
    }, [myColor, setIsFlipped]);

    const clearCanvas = () => {
      setRightClickedSquares([]);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const handleRightClick = (squareRep: string) => {
      if (rightClickedSquares.includes(squareRep)) {
        setRightClickedSquares((prev) => prev.filter((sq) => sq !== squareRep));
      } else {
        setRightClickedSquares((prev) => [...prev, squareRep]);
      }
    };

    const handleDrawArrow = (squareRep: string) => {
      if (arrowStart) {
        const stoppedAtSquare = squareRep;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            drawArrow({
              ctx,
              start: arrowStart,
              end: stoppedAtSquare,
              isFlipped,
              squareSize: boxSize,
            });
          }
        }
        setArrowStart(null);
      }
    };

    const handleMouseUp = (e: MouseEvent<HTMLDivElement>, squareRep: string) => {
      e.preventDefault();
      if (!started) {
        return;
      }
      if (e.button === 2) {
        if (arrowStart === squareRep) {
          handleRightClick(squareRep);
        } else {
          handleDrawArrow(squareRep);
        }
      } else {
        clearCanvas();
      }
    };

    useEffect(() => {
      clearCanvas();
      const lMove = moves.at(-1);
      if (lMove) {
        setLastMove({
          from: lMove.from,
          to: lMove.to,
        });
      } else {
        setLastMove(null);
      }
    }, [moves]);

    useEffect(() => {
      if (userSelectedMoveIndex !== null) {
        const move = moves[userSelectedMoveIndex];
        setLastMove({
          from: move.from,
          to: move.to,
        });
        chess.load(move.after);
        setBoard(chess.board());
        return;
      }
    }, [userSelectedMoveIndex]);

    useEffect(() => {
      if (userSelectedMoveIndex !== null) {
        chess.reset();
        moves.forEach((move) => {
          chess.move({ from: move.from, to: move.to });
        });
        setBoard(chess.board());
        setUserSelectedMoveIndex(null);
      } else {
        setBoard(chess.board());
      }
    }, [moves]);

    // Handles a click on a board square: select a piece, switch the selection,
    // deselect it, or attempt a move from the currently-selected square.
    const handleSquareClick = (squareRep: Square, piece: BoardCell) => {
      if (!started) return;

      // If the user was reviewing earlier moves, snap back to the live position.
      if (userSelectedMoveIndex !== null) {
        chess.reset();
        moves.forEach((m) => chess.move({ from: m.from, to: m.to }));
        setBoard(chess.board());
        setUserSelectedMoveIndex(null);
        return;
      }

      if (!isMyTurn) return;

      // Nothing selected yet: select the square only if it holds one of our pieces.
      if (!from) {
        if (piece && piece.color === chess.turn()) {
          setFrom(squareRep);
          setLegalMoves(
            chess.moves({ verbose: true, square: squareRep }).map((m) => m.to),
          );
        }
        return;
      }

      // Clicking the already-selected square clears the selection.
      if (from === squareRep) {
        setFrom(null);
        setLegalMoves([]);
        return;
      }

      // Clicking another of our own pieces switches the selection.
      if (piece && piece.color === chess.turn()) {
        setFrom(squareRep);
        setLegalMoves(
          chess.moves({ verbose: true, square: squareRep }).map((m) => m.to),
        );
        return;
      }

      // Otherwise attempt a move from the selected square to the clicked one.
      try {
        const moveResult = isPromoting(chess, from, squareRep)
          ? chess.move({ from, to: squareRep, promotion: 'q' })
          : chess.move({ from, to: squareRep });

        if (moveResult) {
          moveAudio.play();
          if (moveResult.captured) captureAudio.play();
          setMoves((prev) => [...prev, moveResult]);
          setFrom(null);
          setLegalMoves([]);
          if (moveResult.san.includes('#')) setGameOver(true);
          socket.send(
            JSON.stringify({
              type: MOVE,
              payload: { gameId, move: moveResult },
            }),
          );
        }
      } catch (e) {
        console.log('Invalid move', e);
      }
    };

    return (
      <>
        {gameOver && <Confetti />}
        <div className="flex relative">
          <div className="text-white-200 rounded-md overflow-hidden">
            {(isFlipped ? board.slice().reverse() : board).map((row, i) => {
              i = isFlipped ? i + 1 : 8 - i;
              return (
                <div key={i} className="flex relative">
                  <NumberNotation
                    isMainBoxColor={isFlipped ? i % 2 !== 0 : i % 2 === 0}
                    label={i.toString()}
                  />
                  {(isFlipped ? row.slice().reverse() : row).map((square, j) => {
                    j = isFlipped ? 7 - (j % 8) : j % 8;

                    const isMainBoxColor = (i + j) % 2 !== 0;
                    const squareRepresentation = (String.fromCharCode(97 + j) +
                      '' +
                      i) as Square;
                    const isHighlightedSquare =
                      from === squareRepresentation ||
                      squareRepresentation === lastMove?.from ||
                      squareRepresentation === lastMove?.to;
                    const isRightClickedSquare =
                      rightClickedSquares.includes(squareRepresentation);

                    const piece = square && square.type;
                    const isKingInCheckSquare =
                      piece === 'k' &&
                      square?.color === chess.turn() &&
                      chess.inCheck();

                    return (
                      <div
                        onClick={() => handleSquareClick(squareRepresentation, square)}
                        style={{
                          width: boxSize,
                          height: boxSize,
                        }}
                        key={j}
                        className={`${
                          isRightClickedSquare
                            ? isMainBoxColor
                              ? 'bg-[#CF664E]'
                              : 'bg-[#E87764]'
                            : isKingInCheckSquare
                            ? 'bg-[#FF6347]'
                            : isHighlightedSquare
                            ? isMainBoxColor
                              ? 'bg-[#BBCB45]'
                              : 'bg-[#F4F687]'
                            : getBoardSquareClass(theme, isMainBoxColor)
                        }`}
                        onContextMenu={(e) => {
                          e.preventDefault();
                        }}
                        onMouseDown={(e) => {
                          handleMouseDown(e, squareRepresentation);
                        }}
                        onMouseUp={(e) => {
                          handleMouseUp(e, squareRepresentation);
                        }}
                      >
                        <div className="w-full justify-center flex h-full relative">
                          {square && <ChessSquare square={square} />}
                          {isFlipped
                            ? i === 8 && (
                                <LetterNotation
                                  label={labels[j]}
                                  isMainBoxColor={j % 2 === 0}
                                />
                              )
                            : i === 1 && (
                                <LetterNotation
                                  label={labels[j]}
                                  isMainBoxColor={j % 2 !== 0}
                                />
                              )}
                          {!!from && legalMoves.includes(squareRepresentation) && (
                            <LegalMoveIndicator
                              isMainBoxColor={isMainBoxColor}
                              isPiece={!!square?.type}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <canvas
            ref={(ref) => setCanvas(ref)}
            width={boxSize * 8}
            height={boxSize * 8}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
            }}
            onContextMenu={(e) => e.preventDefault()}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onMouseUp={(e) => e.preventDefault()}
          ></canvas>
        </div>
      </>
    );
  },
);
