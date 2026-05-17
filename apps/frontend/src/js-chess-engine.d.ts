declare module 'js-chess-engine' {
  interface GameConfiguration {
    pieces?: any;
    turn?: 'white' | 'black';
    isFinished?: boolean;
    check?: boolean;
    checkMate?: boolean;
    castling?: any;
    enPassant?: any;
    board?: Record<string, string>;
    [key: string]: any;
  }

  export class Game {
    constructor(configuration?: GameConfiguration);
    move(from: string, to: string): void;
    moves(square?: string): string[] | Record<string, string[]>;
    aiMove(level?: number): Record<string, string>;
    exportJson(): GameConfiguration;
    setPiece(square: string, piece: string): void;
  }
}
