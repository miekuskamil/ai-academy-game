import { describe, expect, it } from 'vitest';
import { planPuzzle, piecePath, benchAngle } from './jigsaw';

describe('jigsaw geometry', () => {
  it('plans one piece per grid cell', () => {
    const plan = planPuzzle(5, 4);
    expect(plan.length).toBe(20);
    expect(plan[0]!.index).toBe(0);
    expect(plan[19]!.row).toBe(4);
  });

  it('makes the outer border flat', () => {
    const plan = planPuzzle(5, 4);
    const topLeft = plan.find((p) => p.row === 0 && p.col === 0)!;
    expect(topLeft.edges.top).toBe('flat');
    expect(topLeft.edges.left).toBe('flat');
    const bottomRight = plan.find((p) => p.row === 4 && p.col === 3)!;
    expect(bottomRight.edges.bottom).toBe('flat');
    expect(bottomRight.edges.right).toBe('flat');
  });

  it('mates neighbours: a tab on one side is a blank on the other', () => {
    const plan = planPuzzle(5, 4);
    const at = (r: number, c: number) => plan.find((p) => p.row === r && p.col === c)!;
    for (let r = 0; r < 5; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        const right = at(r, c).edges.right;
        const leftOfNeighbour = at(r, c + 1).edges.left;
        // one tab, one blank — exactly the pair, never matching
        expect(new Set([right, leftOfNeighbour])).toEqual(new Set(['tab', 'blank']));
      }
    }
  });

  it('produces a closed path string for any piece', () => {
    const plan = planPuzzle(5, 4);
    for (const piece of plan) {
      const d = piecePath(piece.edges, 100, 100);
      expect(d.startsWith('M')).toBe(true);
      expect(d.trimEnd().endsWith('Z')).toBe(true);
    }
  });

  it('scatters bench angles within a tidy range, deterministically', () => {
    expect(benchAngle(3)).toBe(benchAngle(3));
    for (let i = 0; i < 20; i += 1) {
      expect(Math.abs(benchAngle(i))).toBeLessThanOrEqual(20);
    }
  });
});
