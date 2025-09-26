import { RatingService } from '../services/ratingService';

const ratingService = new RatingService();

// Test rating calculation
const { whiteNewRating, blackNewRating } = ratingService.calculateNewRatings(
    1200, // White rating
    1200, // Black rating  
    '1-0' // White wins
);

console.log(`White: 1200 → ${whiteNewRating}`);
console.log(`Black: 1200 → ${blackNewRating}`);
