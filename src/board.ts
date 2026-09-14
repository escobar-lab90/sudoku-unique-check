// A board is 81 cells, row-major (index = row * 9 + col), 0 meaning blank.

export type ParseMode = 'strict' | 'lenient';

export class BoardFormatError extends Error {}

// Strict mode: exactly 9 lines, LF-terminated, 9 characters each, only
// digits 1-9 or '.' for blank. This is the format the tool round-trips
// to itself (see formatBoard), so anything produced by this tool parses
// back in strict mode.
function parseStrict(input: string): number[] {
  if (input.includes('\r')) {
    throw new BoardFormatError(
      'strict mode requires LF line endings, no carriage returns (try --lenient)',
    );
  }
  let body = input;
  if (body.endsWith('\n')) {
    body = body.slice(0, -1);
  }
  const lines = body.split('\n');
  if (lines.length !== 9) {
    throw new BoardFormatError(
      `strict mode requires exactly 9 lines, found ${lines.length} (try --lenient)`,
    );
  }

  const cells: number[] = new Array(81).fill(0);
  for (let r = 0; r < 9; r++) {
    const line = lines[r];
    if (line.length !== 9) {
      throw new BoardFormatError(
        `strict mode requires exactly 9 characters per line, line ${r + 1} has ${line.length} (try --lenient)`,
      );
    }
    for (let c = 0; c < 9; c++) {
      const ch = line[c];
      if (ch === '.') {
        continue;
      }
      if (ch >= '1' && ch <= '9') {
        cells[r * 9 + c] = ch.charCodeAt(0) - 48;
        continue;
      }
      throw new BoardFormatError(
        `strict mode only allows digits 1-9 and '.' for blanks, found '${ch}' at line ${r + 1}, column ${c + 1} (try --lenient)`,
      );
    }
  }
  return cells;
}

// Lenient mode: ignore layout entirely. Walk the input character by
// character, collect anything that looks like a given (1-9) or a blank
// marker, and drop everything else (whitespace, commas, pipes, dashes
// used as separators, blank lines). Errors only if the count is wrong.
const LENIENT_BLANK_MARKERS = new Set(['.', '0', '_', 'x', 'X']);

function parseLenient(input: string): number[] {
  const cells: number[] = [];
  for (const ch of input) {
    if (ch >= '1' && ch <= '9') {
      cells.push(ch.charCodeAt(0) - 48);
    } else if (LENIENT_BLANK_MARKERS.has(ch)) {
      cells.push(0);
    }
  }
  if (cells.length !== 81) {
    throw new BoardFormatError(
      `lenient mode found ${cells.length} board characters (digits 1-9 or blank markers), expected 81`,
    );
  }
  return cells;
}

export function parseBoard(input: string, mode: ParseMode): number[] {
  return mode === 'lenient' ? parseLenient(input) : parseStrict(input);
}

export function formatBoard(cells: number[]): string {
  const lines: string[] = [];
  for (let r = 0; r < 9; r++) {
    let line = '';
    for (let c = 0; c < 9; c++) {
      const v = cells[r * 9 + c];
      line += v === 0 ? '.' : String(v);
    }
    lines.push(line);
  }
  return lines.join('\n');
}

function boxOf(r: number, c: number): number {
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}

// Checks the givens against plain sudoku rules (no two equal digits in a
// row, column, or box). This runs regardless of parse mode: leniency is
// about the input format, not about tolerating an already-broken board.
export function findConflicts(cells: number[]): string[] {
  const conflicts: string[] = [];

  for (let r = 0; r < 9; r++) {
    const seenAt = new Map<number, number>();
    for (let c = 0; c < 9; c++) {
      const v = cells[r * 9 + c];
      if (v === 0) continue;
      const prior = seenAt.get(v);
      if (prior !== undefined) {
        conflicts.push(`row ${r + 1} has ${v} twice, at columns ${prior + 1} and ${c + 1}`);
      } else {
        seenAt.set(v, c);
      }
    }
  }

  for (let c = 0; c < 9; c++) {
    const seenAt = new Map<number, number>();
    for (let r = 0; r < 9; r++) {
      const v = cells[r * 9 + c];
      if (v === 0) continue;
      const prior = seenAt.get(v);
      if (prior !== undefined) {
        conflicts.push(`column ${c + 1} has ${v} twice, at rows ${prior + 1} and ${r + 1}`);
      } else {
        seenAt.set(v, r);
      }
    }
  }

  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const seenAt = new Map<number, [number, number]>();
      for (let dr = 0; dr < 3; dr++) {
        for (let dc = 0; dc < 3; dc++) {
          const r = br * 3 + dr;
          const c = bc * 3 + dc;
          const v = cells[r * 9 + c];
          if (v === 0) continue;
          const prior = seenAt.get(v);
          if (prior !== undefined) {
            conflicts.push(
              `box ${boxOf(r, c) + 1} has ${v} twice, at (row ${prior[0] + 1}, col ${prior[1] + 1}) and (row ${r + 1}, col ${c + 1})`,
            );
          } else {
            seenAt.set(v, [r, c]);
          }
        }
      }
    }
  }

  return conflicts;
}
