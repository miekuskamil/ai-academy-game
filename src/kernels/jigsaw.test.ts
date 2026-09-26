import { describe, expect, it } from 'vitest';
import { planPuzzle, piecePath, pathPoints, benchAngle, TAB_REACH } from './jigsaw';

const CELL = 100;
const at = (plan: ReturnType<typeof planPuzzle>, r: number, c: number) =>
  plan.find((p) => p.row === r && p.col === c)!;

/** Points of a piece's path, translated to its place on the board. */
function boardPoints(p: ReturnType<typeof planPuzzle>[number]) {
  return pathPoints(piecePath(p.edges, CELL, CELL)).map(
    ([x, y]) => [x + p.col * CELL, y + p.row * CELL] as [number, number],
  );
}

describe('jigsaw geometry', () => {
  const plan = planPuzzle(5, 4, 7);

  it('plans one piece per grid cell', () => {
    expect(plan.length).toBe(20);
    expect(plan[19]!.row).toBe(4);
  });

  it('keeps the outer border flat', () => {
    expect(at(plan, 0, 0).edges.top).toBe('flat');
    expect(at(plan, 0, 0).edges.left).toBe('flat');
    expect(at(plan, 4, 3).edges.bottom).toBe('flat');
    expect(at(plan, 4, 3).edges.right).toBe('flat');
  });

  it('pairs every interior seam as one tab and one blank', () => {
    for (let r = 0; r < 5; r += 1)
      for (let c = 0; c < 3; c += 1)
        expect(new Set([at(plan, r, c).edges.right, at(plan, r, c + 1).edges.left])).toEqual(
          new Set(['tab', 'blank']),
        );
    for (let r = 0; r < 4; r += 1)
      for (let c = 0; c < 4; c += 1)
        expect(new Set([at(plan, r, c).edges.bottom, at(plan, r + 1, c).edges.top])).toEqual(
          new Set(['tab', 'blank']),
        );
  });

  it('bulges a tab outward on every side, and bites a blank inward', () => {
    for (const p of plan) {
      const pts = pathPoints(piecePath(p.edges, CELL, CELL));
      const xs = pts.map((q) => q[0]);
      const ys = pts.map((q) => q[1]);
      const reach = CELL * TAB_REACH * 0.9;
      if (p.edges.right === 'tab') expect(Math.max(...xs)).toBeGreaterThan(CELL + reach);
      if (p.edges.left === 'tab') expect(Math.min(...xs)).toBeLessThan(-reach);
      if (p.edges.bottom === 'tab') expect(Math.max(...ys)).toBeGreaterThan(CELL + reach);
      if (p.edges.top === 'tab') expect(Math.min(...ys)).toBeLessThan(-reach);
      // Nothing pokes out past a flat or blank side (3% slack: the neck pinch
      // places one bezier handle just outside the edge; the curve itself does not).
      if (p.edges.right !== 'tab') expect(Math.max(...xs)).toBeLessThanOrEqual(CELL + 3);
      if (p.edges.left !== 'tab') expect(Math.min(...xs)).toBeGreaterThanOrEqual(-3);
      if (p.edges.bottom !== 'tab') expect(Math.max(...ys)).toBeLessThanOrEqual(CELL + 3);
      if (p.edges.top !== 'tab') expect(Math.min(...ys)).toBeGreaterThanOrEqual(-3);
    }
  });

  it('makes neighbours trace the same seam, so there are no gaps', () => {
    // The tab curve of one piece and the blank curve of its neighbour must share
    // their bump points exactly (only the travel direction differs).
    const a = at(plan, 1, 1);
    const b = at(plan, 1, 2);
    const seamX = 2 * CELL;
    const near = (pts: [number, number][]) =>
      pts
        .filter(([x, y]) => Math.abs(x - seamX) < CELL * 0.3 && y > CELL && y < 2 * CELL)
        .map(([x, y]) => `${Math.round(x)},${Math.round(y)}`)
        .sort();
    expect(near(boardPoints(a))).toEqual(near(boardPoints(b)));
  });

  it('returns a closed path', () => {
    for (const p of plan) {
      const d = piecePath(p.edges, CELL, CELL);
      expect(d.startsWith('M')).toBe(true);
      expect(d.endsWith('Z')).toBe(true);
    }
  });

  it('scatters bench angles within a tidy range, deterministically', () => {
    expect(benchAngle(3)).toBe(benchAngle(3));
    for (let i = 0; i < 20; i += 1) expect(Math.abs(benchAngle(i))).toBeLessThanOrEqual(25);
  });
});
