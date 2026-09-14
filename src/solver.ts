// Backtracking solver with a solution cap. We only ever need to know
// "zero", "exactly one", or "more than one" solutions exist, so the
// caller passes cap = 2 and search stops as soon as that's answered.

const FULL_MASK = 0b1111111110; // bits 1..9 set, bit 0 unused

function popcount(mask: number): number {
  let n = mask;
  let count = 0;
  while (n !== 0) {
    n &= n - 1;
    count++;
  }
  return count;
}

function boxOf(r: number, c: number): number {
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}

export function solve(initialCells: number[], cap: number): number[][] {
  const cells = initialCells.slice();
  const rowMask = new Array<number>(9).fill(0);
  const colMask = new Array<number>(9).fill(0);
  const boxMask = new Array<number>(9).fill(0);

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = cells[r * 9 + c];
      if (v === 0) continue;
      const bit = 1 << v;
      const b = boxOf(r, c);
      rowMask[r] |= bit;
      colMask[c] |= bit;
      boxMask[b] |= bit;
    }
  }

  const solutions: number[][] = [];

  function backtrack(): void {
    if (solutions.length >= cap) return;

    // Pick the empty cell with the fewest legal candidates (MRV). This
    // keeps branching low and lets us bail out of dead ends immediately
    // when a cell has zero candidates.
    let bestIdx = -1;
    let bestMask = 0;
    let bestCount = 10;
    for (let i = 0; i < 81; i++) {
      if (cells[i] !== 0) continue;
      const r = (i / 9) | 0;
      const c = i % 9;
      const b = boxOf(r, c);
      const avail = FULL_MASK & ~(rowMask[r] | colMask[c] | boxMask[b]);
      const count = popcount(avail);
      if (count === 0) return; // dead end: no digit fits here
      if (count < bestCount) {
        bestCount = count;
        bestIdx = i;
        bestMask = avail;
        if (count === 1) break;
      }
    }

    if (bestIdx === -1) {
      // No empty cells left: the board is fully and validly filled.
      solutions.push(cells.slice());
      return;
    }

    const r = (bestIdx / 9) | 0;
    const c = bestIdx % 9;
    const b = boxOf(r, c);

    for (let d = 1; d <= 9; d++) {
      const bit = 1 << d;
      if ((bestMask & bit) === 0) continue;

      cells[bestIdx] = d;
      rowMask[r] |= bit;
      colMask[c] |= bit;
      boxMask[b] |= bit;

      backtrack();

      cells[bestIdx] = 0;
      rowMask[r] &= ~bit;
      colMask[c] &= ~bit;
      boxMask[b] &= ~bit;

      if (solutions.length >= cap) return;
    }
  }

  backtrack();
  return solutions;
}
