import assert from 'node:assert/strict';
import test from 'node:test';
import { findConflicts } from './board.js';
import { solve } from './solver.js';

function cellsFromRows(rows: string[]): number[] {
  const cells: number[] = [];
  for (const row of rows) {
    for (const ch of row) {
      cells.push(ch === '.' ? 0 : ch.charCodeAt(0) - 48);
    }
  }
  return cells;
}

// The example puzzle from Wikipedia's Sudoku article, widely cited as
// having exactly one solution.
const UNIQUE_PUZZLE_ROWS = [
  '53..7....',
  '6..195...',
  '.98....6.',
  '8...6...3',
  '4..8.3..1',
  '7...2...6',
  '.6....28.',
  '...419..5',
  '....8..79',
];

// A complete, valid grid built from the standard band/row-shift
// construction (row r, column c holds ((r*3 + floor(r/3) + c) mod 9) + 1).
// Swapping every 1 with every 2 in a valid grid is still a valid grid,
// since relabeling digits can't create a duplicate within any row,
// column, or box. So blanking out every 1 and 2 leaves a puzzle that
// both the original grid and its 1/2-swapped twin satisfy: at least two
// solutions, by construction.
const CANONICAL_SOLUTION_ROWS = [
  '123456789',
  '456789123',
  '789123456',
  '234567891',
  '567891234',
  '891234567',
  '345678912',
  '678912345',
  '912345678',
];
const MULTI_SOLUTION_PUZZLE_ROWS = CANONICAL_SOLUTION_ROWS.map((row) => row.replace(/[12]/g, '.'));

test('solve finds exactly one solution for a known unique puzzle', () => {
  const cells = cellsFromRows(UNIQUE_PUZZLE_ROWS);
  const solutions = solve(cells, 2);
  assert.equal(solutions.length, 1);

  const solution = solutions[0];
  assert.deepEqual(findConflicts(solution), []);
  assert.ok(solution.every((v) => v >= 1 && v <= 9));
  for (let i = 0; i < 81; i++) {
    if (cells[i] !== 0) assert.equal(solution[i], cells[i]);
  }
});

test('solve finds multiple solutions when givens under-determine the board', () => {
  const cells = cellsFromRows(MULTI_SOLUTION_PUZZLE_ROWS);
  const solutions = solve(cells, 2);
  assert.equal(solutions.length, 2);

  for (const solution of solutions) {
    assert.deepEqual(findConflicts(solution), []);
    for (let i = 0; i < 81; i++) {
      if (cells[i] !== 0) assert.equal(solution[i], cells[i]);
    }
  }
  assert.notDeepEqual(solutions[0], solutions[1]);
});
