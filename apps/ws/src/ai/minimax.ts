import { Chess, Move, PieceSymbol } from 'chess.js';

type Color = 'w' | 'b';

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Standard piece-square tables (chessprogramming.org). Written from White's
// POV; for Black we flip the rank when indexing.
const PAWN_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0,
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0,
];

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20,
];

const KING_TABLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20,
];

const TABLES: Record<PieceSymbol, number[]> = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
  b: BISHOP_TABLE,
  r: ROOK_TABLE,
  q: QUEEN_TABLE,
  k: KING_TABLE,
};

function psqValue(piece: PieceSymbol, color: Color, rank: number, file: number): number {
  const r = color === 'w' ? rank : 7 - rank;
  return TABLES[piece][r * 8 + file];
}

export function evaluate(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -100000 : 100000;
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition()) {
    return 0;
  }

  let score = 0;
  const board = chess.board();
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (!piece) continue;
      const material = PIECE_VALUES[piece.type];
      const positional = psqValue(piece.type, piece.color as Color, rank, file);
      score += piece.color === 'w' ? material + positional : -(material + positional);
    }
  }
  return score;
}

// MVV-LVA move ordering: most-valuable-victim minus least-valuable-attacker.
function orderMoves(chess: Chess): Move[] {
  const moves = chess.moves({ verbose: true });
  return moves.sort((a, b) => moveScore(b) - moveScore(a));
}

function moveScore(move: Move): number {
  let score = 0;
  if (move.captured) {
    score += 10 * PIECE_VALUES[move.captured] - PIECE_VALUES[move.piece];
  } else {
    score -= 1000;
  }
  if (move.promotion) {
    score += PIECE_VALUES[move.promotion];
  }
  return score;
}

interface SearchResult {
  score: number;
  move?: Move;
}

export function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): SearchResult {
  if (depth === 0 || chess.isGameOver()) {
    return { score: evaluate(chess) };
  }

  const moves = orderMoves(chess);
  if (moves.length === 0) {
    return { score: evaluate(chess) };
  }

  let bestMove: Move | undefined = moves[0];

  if (maximizing) {
    let value = -Infinity;
    for (const move of moves) {
      chess.move(move.san);
      const { score } = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      if (score > value) {
        value = score;
        bestMove = move;
      }
      if (value > alpha) alpha = value;
      if (value >= beta) break;
    }
    return { score: value, move: bestMove };
  }

  let value = Infinity;
  for (const move of moves) {
    chess.move(move.san);
    const { score } = minimax(chess, depth - 1, alpha, beta, true);
    chess.undo();
    if (score < value) {
      value = score;
      bestMove = move;
    }
    if (value < beta) beta = value;
    if (value <= alpha) break;
  }
  return { score: value, move: bestMove };
}

export type Difficulty = 'easy' | 'medium' | 'hard';

const DEPTH_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 2,
  medium: 3,
  hard: 4,
};

export function pickBestMove(fen: string, depth: number): Move | null {
  const chess = new Chess(fen);
  if (chess.isGameOver()) return null;
  const result = minimax(chess, depth, -Infinity, Infinity, chess.turn() === 'w');
  return result.move ?? null;
}

// Async variant used by live AI games. It runs the same alpha-beta search but
// yields to the event loop between root moves, so a deep search never blocks
// other games' WebSocket messages for longer than a single subtree.
export async function pickAIMove(
  fen: string,
  difficulty: Difficulty = 'medium',
): Promise<Move | null> {
  const chess = new Chess(fen);
  if (chess.isGameOver()) return null;

  const depth = DEPTH_BY_DIFFICULTY[difficulty];
  const maximizing = chess.turn() === 'w';
  const moves = orderMoves(chess);
  if (moves.length === 0) return null;

  let bestMove: Move = moves[0];
  let bestScore = maximizing ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  for (const move of moves) {
    chess.move(move.san);
    const { score } = minimax(chess, depth - 1, alpha, beta, !maximizing);
    chess.undo();

    if (maximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, bestScore);
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
      beta = Math.min(beta, bestScore);
    }

    // Hand control back to the event loop before searching the next subtree.
    await new Promise<void>((resolve) => setImmediate(resolve));
  }

  return bestMove;
}
