import { GameResult } from '@prisma/client';

export class RatingService {
  calculateNewRatings(
    whiteRating: number,
    blackRating: number,
    result: GameResult,
    kFactor = 32,
  ): { whiteNewRating: number; blackNewRating: number } {
    const expectedWhite = 1 / (1 + Math.pow(10, (blackRating - whiteRating) / 400));
    const expectedBlack = 1 - expectedWhite;

    let actualWhite = 0.5;
    let actualBlack = 0.5;
    if (result === 'WHITE_WINS') {
      actualWhite = 1;
      actualBlack = 0;
    } else if (result === 'BLACK_WINS') {
      actualWhite = 0;
      actualBlack = 1;
    }

    return {
      whiteNewRating: Math.round(whiteRating + kFactor * (actualWhite - expectedWhite)),
      blackNewRating: Math.round(blackRating + kFactor * (actualBlack - expectedBlack)),
    };
  }

  getKFactor(rating: number, gamesPlayed: number): number {
    if (gamesPlayed < 30) return 40;
    if (rating < 2100) return 20;
    return 10;
  }
}
