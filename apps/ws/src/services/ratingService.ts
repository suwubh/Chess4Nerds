import { GameResult } from '@prisma/client';

export class RatingService {
  calculateNewRatings(
    whiteRating: number,
    blackRating: number,
    result: GameResult,
    whiteGamesPlayed = 0,
    blackGamesPlayed = 0,
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

    // Each player's K-factor depends on how settled their rating is.
    const kWhite = this.getKFactor(whiteRating, whiteGamesPlayed);
    const kBlack = this.getKFactor(blackRating, blackGamesPlayed);

    return {
      whiteNewRating: Math.round(whiteRating + kWhite * (actualWhite - expectedWhite)),
      blackNewRating: Math.round(blackRating + kBlack * (actualBlack - expectedBlack)),
    };
  }

  // 40 while a rating is still provisional (< 30 games), 10 for masters
  // (2100+), 32 for everyone else.
  getKFactor(rating: number, gamesPlayed: number): number {
    if (gamesPlayed < 30) return 40;
    if (rating >= 2100) return 10;
    return 32;
  }
}
