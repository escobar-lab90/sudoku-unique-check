import assert from 'node:assert/strict';
import test from 'node:test';
import { BoardFormatError, findConflicts, formatBoard, parseBoard } from './board.js';

const VALID_STRICT = [
  '53..7....',
  '6..195...',
  '.98....6.',
  '8...6...3',
  '4..8.3..1',
  '7...2...6',
  '.6....28.',
  '...419..5',
  '....8..79',
].join('\n');

test('parseBoard (strict) reads givens in row-major order', () => {
  const cells = parseBoard(VALID_STRICT, 'strict');
  assert.equal(cells.length, 81);
  assert.equal(cells[0], 5);
  assert.equal(cells[1], 3);
  assert.equal(cells[2], 0);
  assert.equal(cells[80], 9);
});

test('parseBoard (strict) accepts an optional trailing newline', () => {
  const withTrailingNewline = VALID_STRICT + '\n';
  assert.deepEqual(parseBoard(withTrailingNewline, 'strict'), parseBoard(VALID_STRICT, 'strict'));
});

test('formatBoard output round-trips through parseBoard (strict)', () => {
  const cells = parseBoard(VALID_STRICT, 'strict');
  assert.deepEqual(parseBoard(formatBoard(cells), 'strict'), cells);
});

test('parseBoard (strict) rejects the wrong number of lines', () => {
  const tooFewLines = VALID_STRICT.split('\n').slice(0, 8).join('\n');
  assert.throws(() => parseBoard(tooFewLines, 'strict'), BoardFormatError);
});

test('parseBoard (strict) rejects a line of the wrong length', () => {
  const lines = VALID_STRICT.split('\n');
  lines[3] = lines[3].slice(0, 8);
  assert.throws(() => parseBoard(lines.join('\n'), 'strict'), BoardFormatError);
});

test('parseBoard (strict) rejects characters other than 1-9 and .', () => {
  const lines = VALID_STRICT.split('\n');
  lines[0] = 'x' + lines[0].slice(1);
  assert.throws(() => parseBoard(lines.join('\n'), 'strict'), BoardFormatError);
});

test('parseBoard (strict) rejects CRLF line endings', () => {
  const withCr = VALID_STRICT.split('\n').join('\r\n');
  assert.throws(() => parseBoard(withCr, 'strict'), BoardFormatError);
});

test('parseBoard (lenient) ignores separators and layout', () => {
  const messy = [
    '5,3,x,x,7,x,x,x,x',
    '6,x,x,1,9,5,x,x,x',
    'x,9,8,x,x,x,x,6,x',
    '8,x,x,x,6,x,x,x,3',
    '4,x,x,8,x,3,x,x,1',
    '7,x,x,x,2,x,x,x,6',
    'x,6,x,x,x,x,2,8,x',
    'x,x,x,4,1,9,x,x,5',
    'x,x,x,x,8,x,x,7,9',
  ].join('\n');
  assert.deepEqual(parseBoard(messy, 'lenient'), parseBoard(VALID_STRICT, 'strict'));
});

test('parseBoard (lenient) recognizes every blank marker', () => {
  const blanks = '.0_xX'.repeat(1) + '1'.repeat(76);
  assert.equal(parseBoard(blanks, 'lenient').filter((v) => v === 0).length, 5);
});

test('parseBoard (lenient) rejects the wrong character count', () => {
  const tooShort = '1'.repeat(80);
  assert.throws(() => parseBoard(tooShort, 'lenient'), BoardFormatError);
});

test('findConflicts reports nothing for an empty board', () => {
  assert.deepEqual(findConflicts(new Array(81).fill(0)), []);
});

test('findConflicts reports nothing for a valid partial board', () => {
  assert.deepEqual(findConflicts(parseBoard(VALID_STRICT, 'strict')), []);
});

test('findConflicts catches a repeated digit in a row', () => {
  const cells = new Array(81).fill(0);
  cells[0] = 5; // row 1, col 1
  cells[3] = 5; // row 1, col 4
  const conflicts = findConflicts(cells);
  assert.equal(conflicts.length, 1);
  assert.match(conflicts[0], /^row 1 has 5 twice/);
});

test('findConflicts catches a repeated digit in a column', () => {
  const cells = new Array(81).fill(0);
  cells[0] = 7; // row 1, col 1
  cells[9 * 4] = 7; // row 5, col 1
  const conflicts = findConflicts(cells);
  assert.equal(conflicts.length, 1);
  assert.match(conflicts[0], /^column 1 has 7 twice/);
});

test('findConflicts catches a repeated digit in a 3x3 box', () => {
  const cells = new Array(81).fill(0);
  cells[0] = 9; // row 1, col 1, box 1
  cells[9 + 1] = 9; // row 2, col 2, box 1
  const conflicts = findConflicts(cells);
  assert.equal(conflicts.length, 1);
  assert.match(conflicts[0], /^box 1 has 9 twice/);
});

test('findConflicts reports every conflict, not just the first', () => {
  const cells = new Array(81).fill(0);
  cells[0] = 1;
  cells[1] = 1; // row conflict
  cells[9 * 4 + 5] = 8;
  cells[9 * 5 + 5] = 8; // column conflict, unrelated to the row conflict above
  const conflicts = findConflicts(cells);
  assert.equal(conflicts.length, 2);
});
