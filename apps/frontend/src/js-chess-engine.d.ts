declare module 'js-chess-engine' {
  interface GameConfiguration {
    pieces?: any;
    turn?: 'white' | 'black';
    isFinished?: boolean;
    check?: boolean;
    checkMate?: boolean;
    castling?: any;
    enPassant?: any;
    board?: Record<string, string>; // Add this line
    [key: string]: any; // Allow other properties
  }

  interface Move {
    from: string;
    to: string;
  }

  export class Game {
    constructor(configuration?: GameConfiguration);
    move(from: string, to: string): void;
    moves(square?: string): string[] | { [square: string]: string[] };
    aiMove(level?: number): Move;
    exportJson(): GameConfiguration;
    setPiece(square: string, piece: string): void;
  }
}
