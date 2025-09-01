export class RatingService {
    calculateNewRatings(
        whiteRating: number, 
        blackRating: number, 
        result: 'WHITE_WINS' | 'BLACK_WINS' | 'DRAW',
        kFactor: number = 32
    ): { whiteNewRating: number; blackNewRating: number } {
        const expectedWhite = 1 / (1 + Math.pow(10, (blackRating - whiteRating) / 400));
        const expectedBlack = 1 - expectedWhite;
        
        let actualWhite: number, actualBlack: number;
        switch (result) {
            case 'WHITE_WINS': 
                actualWhite = 1; 
                actualBlack = 0; 
                break;
            case 'BLACK_WINS': 
                actualWhite = 0; 
                actualBlack = 1; 
                break;
            case 'DRAW': 
                actualWhite = 0.5; 
                actualBlack = 0.5; 
                break;
        }
        
        const whiteNewRating = Math.round(whiteRating + kFactor * (actualWhite - expectedWhite));
        const blackNewRating = Math.round(blackRating + kFactor * (actualBlack - expectedBlack));
        
        return { whiteNewRating, blackNewRating };
    }
}
