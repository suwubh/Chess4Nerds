import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { evaluate, pickBestMove } from './minimax';

test('starting position is roughly balanced', () => {
  const chess = new Chess();
  assert.equal(evaluate(chess), 0);
});

test('white up a queen evaluates clearly in white favour', () => {
  // black queen missing
  const chess = new Chess('rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  assert.ok(evaluate(chess) > 800);
});

test('AI takes the free queen', () => {
  // white rook on d4, black queen on d5, white to move
  const fen = '4k3/8/8/3q4/3R4/8/8/4K3 w - - 0 1';
  const move = pickBestMove(fen, 3);
  assert.ok(move, 'expected a move');
  assert.equal(move!.from, 'd4');
  assert.equal(move!.to, 'd5');
});

test('AI finds mate in 1', () => {
  // back-rank mate: white rook delivers Ra8#
  const fen = '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1';
  const move = pickBestMove(fen, 3);
  assert.ok(move, 'expected a move');
  const chess = new Chess(fen);
  chess.move(move!.san);
  assert.ok(chess.isCheckmate(), `expected mate, got ${move!.san}`);
});

test('returns null when game already over', () => {
  // black is mated already (fool's mate position after the mating move)
  const chess = new Chess();
  chess.move('f3');
  chess.move('e5');
  chess.move('g4');
  chess.move('Qh4#');
  assert.equal(pickBestMove(chess.fen(), 2), null);
});
