# sudoku-unique-check

A puzzle isn't a "real" sudoku unless it has exactly one solution. Puzzles
with zero solutions are just broken, and puzzles with more than one aren't
sudoku at all - they're a different, easier game wearing a sudoku's
clothes. This tool answers that one question and nothing else: given a
board, does it have exactly one solution?

It does not generate puzzles, rate their difficulty, or explain solving
techniques. If you want a yes/no (plus the solution, if there is exactly
one) on a specific board, this is for that.

## Usage

```
sudoku-unique board.txt
cat board.txt | sudoku-unique
sudoku-unique --lenient messy-board.txt
```

Exit codes: `0` unique solution, `1` zero or multiple solutions, `2` bad
input (unparseable, or the givens already conflict with each other).

## Board format

By default the parser is strict: exactly 9 lines, each exactly 9
characters, using digits `1`-`9` for givens and `.` for blanks. Anything
else - a short line, a stray space, CRLF line endings, an extra blank
line at the end - is a parse error, not a best-effort guess.

```
53..7....
6..195...
.98....6.
8...6...3
4..8.3..1
7...2...6
.6....28.
...419..5
....8..79
```

Real boards rarely arrive that clean. `--lenient` drops the layout
requirement entirely: it scans the whole input, keeps every digit `1`-`9`
and every blank marker (`.`, `0`, `_`, `x`, `X`), and ignores everything
else - whitespace, commas, pipes, newlines in the wrong places. It only
complains if it doesn't end up with exactly 81 board characters. So this
parses fine with `--lenient`:

```
5,3,x,x,7,x,x,x,x
6,x,x,1,9,5,x,x,x
x,9,8,x,x,x,x,6,x
8,x,x,x,6,x,x,x,3
4,x,x,8,x,3,x,x,1
7,x,x,x,2,x,x,x,6
x,6,x,x,x,x,2,8,x
x,x,x,4,1,9,x,x,5
x,x,x,x,8,x,x,7,9
```

but the strict parser rejects it (commas aren't `.`, lines aren't 9
characters) and tells you to add `--lenient` rather than silently
guessing what you meant.

Regardless of parse mode, the givens are always checked against plain
sudoku rules - two `5`s in one row is a conflict whether you typed it
strictly or loosely.

## Building

No dependencies to install. Compile with any TypeScript compiler that
targets Node's ES module resolution, for example:

```
npx typescript --outDir dist src/*.ts
```

or point a locally installed `tsc` at the included `tsconfig.json`:

```
tsc
node dist/cli.js board.txt
```

Tests use Node's built-in test runner, no separate test framework:

```
tsc
node --test dist
```

## How it decides uniqueness

`src/solver.ts` is a plain backtracking solver with a most-constrained-cell
heuristic (fewest remaining candidates first) and a solution cap of two:
it stops searching the instant it has found a second solution, since a
second solution is all that's needed to answer "not unique". For puzzles
that do have a unique solution this still has to explore the whole
solution space, same as any sudoku solver.

## License

MIT, see LICENSE.
