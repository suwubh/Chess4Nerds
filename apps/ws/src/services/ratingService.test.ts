import test from 'node:test';
import assert from 'node:assert/strict';
import { RatingService } from './ratingService';

const service = new RatingService();

test('equal ratings drawing leaves both ratings unchanged', () => {
  const { whiteNewRating, blackNewRating } = service.calculateNewRatings(
    1200, 1200, 'DRAW', 50, 50,
  );
  assert.equal(whiteNewRating, 1200);
  assert.equal(blackNewRating, 1200);
});

test('between equal players the winner gains what the loser drops', () => {
  const { whiteNewRating, blackNewRating } = service.calculateNewRatings(
    1200, 1200, 'WHITE_WINS', 50, 50,
  );
  // K = 32 for settled players, expected score 0.5, so +/- 16.
  assert.equal(whiteNewRating, 1216);
  assert.equal(blackNewRating, 1184);
});

test('beating a much stronger player gains more than beating an equal', () => {
  const upset = service.calculateNewRatings(1200, 1800, 'WHITE_WINS', 50, 50);
  const even = service.calculateNewRatings(1200, 1200, 'WHITE_WINS', 50, 50);
  assert.ok(upset.whiteNewRating - 1200 > even.whiteNewRating - 1200);
});

test('provisional players (< 30 games) use the larger K-factor', () => {
  assert.equal(service.getKFactor(1200, 0), 40);
  assert.equal(service.getKFactor(1200, 29), 40);
});

test('settled and master-level players use smaller K-factors', () => {
  assert.equal(service.getKFactor(1200, 100), 32);
  assert.equal(service.getKFactor(2200, 100), 10);
});
