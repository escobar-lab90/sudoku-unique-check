#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { BoardFormatError, findConflicts, formatBoard, parseBoard } from './board.js';
import { solve } from './solver.js';

function printUsage(): void {
  console.log(`sudoku-unique - does this sudoku puzzle have exactly one solution?

Usage:
  sudoku-unique [--lenient] <file>
  cat board.txt | sudoku-unique [--lenient]

Options:
  --lenient   accept loosely formatted input (see README) instead of the
              strict 9-lines-of-9-characters grid
  -h, --help  show this message

Exit codes:
  0  the puzzle has exactly one solution
  1  the puzzle has zero solutions, or more than one
  2  the input could not be parsed, or the givens conflict with each other`);
}

function main(argv: string[]): number {
  let lenient = false;
  let filePath: string | undefined;

  for (const arg of argv) {
    if (arg === '--lenient') {
      lenient = true;
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      return 0;
    } else if (arg.startsWith('-')) {
      console.error(`unknown flag: ${arg}`);
      return 2;
    } else if (filePath === undefined) {
      filePath = arg;
    } else {
      console.error('too many arguments, expected a single board file');
      return 2;
    }
  }

  let input: string;
  try {
    input = readFileSync(filePath ?? 0, 'utf8');
  } catch (err) {
    console.error(`could not read input: ${(err as Error).message}`);
    return 2;
  }

  let cells: number[];
  try {
    cells = parseBoard(input, lenient ? 'lenient' : 'strict');
  } catch (err) {
    if (err instanceof BoardFormatError) {
      console.error(err.message);
      return 2;
    }
    throw err;
  }

  const conflicts = findConflicts(cells);
  if (conflicts.length > 0) {
    console.error('board has conflicting givens:');
    for (const conflict of conflicts) {
      console.error(`  ${conflict}`);
    }
    return 2;
  }

  const solutions = solve(cells, 2);
  if (solutions.length === 0) {
    console.log('no solution');
    return 1;
  }
  if (solutions.length > 1) {
    console.log('not unique: at least two solutions exist');
    return 1;
  }

  console.log('unique solution:');
  console.log(formatBoard(solutions[0]));
  return 0;
}

process.exitCode = main(process.argv.slice(2));
