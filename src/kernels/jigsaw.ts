/**
 * Jigsaw geometry.
 *
 * Turns a rows×cols grid into interlocking puzzle pieces. Each interior edge gets
 * a tab on one piece and a matching blank on its neighbour, so pieces only fit
 * their true place. Pure maths — no React — so the shapes are testable and the
 * same layout renders identically on the bench and on the board.
 *
 * Paths are absolute, in the piece's own cell box (0..w, 0..h). Tabs bulge
 * outside that box; the consumer places the piece with a translate to its grid
 * position, so a tab covers the neighbour's blank exactly.
 *
 * Why they mesh: every edge uses one bump curve that is symmetric end-to-end,
 * pushed along that edge's true outward normal (tab) or inward (blank). A tab on
 * the right of one piece and the blank on the left of the next therefore trace
 * the very same line, just in opposite directions.
 */

export type Edge = 'flat' | 'tab' | 'blank';

export interface PieceEdges {
  top: Edge;
  right: Edge;
  bottom: Edge;
  left: Edge;
}

export interface PiecePlan {
  index: number;
  row: number;
  col: number;
  edges: PieceEdges;
}

/** Deterministic pseudo-random in [0,1) from an integer seed. */
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Plan every piece for a rows×cols puzzle. Interior edges get tab/blank pairs
 * decided by a seed so neighbours always mate (one tab, one blank); border edges
 * are flat.
 */
export function planPuzzle(rows: number, cols: number, seed = 1): PiecePlan[] {
  // true = the left/top piece of the seam carries the tab.
  const vSeam = (r: number, c: number) => rand(seed + r * 97 + c * 31) > 0.5;
  const hSeam = (r: number, c: number) => rand(seed + 500 + r * 53 + c * 71) > 0.5;

  const plans: PiecePlan[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const left: Edge = c === 0 ? 'flat' : vSeam(r, c - 1) ? 'blank' : 'tab';
      const right: Edge = c === cols - 1 ? 'flat' : vSeam(r, c) ? 'tab' : 'blank';
      const top: Edge = r === 0 ? 'flat' : hSeam(r - 1, c) ? 'blank' : 'tab';
      const bottom: Edge = r === rows - 1 ? 'flat' : hSeam(r, c) ? 'tab' : 'blank';
      plans.push({ index: r * cols + c, row: r, col: c, edges: { top, right, bottom, left } });
    }
  }
  return plans;
}

type Pt = [number, number];

/**
 * The bump, as cubic segments in edge-local units: u runs 0→1 along the edge,
 * v is the bulge as a fraction of edge length. Symmetric under u → 1-u, which is
 * what makes a tab and its blank coincide. Neck pinches in, head rounds out.
 */
const BUMP: [Pt, Pt, Pt][] = [
  [[0.35, 0], [0.42, -0.02], [0.38, 0.08]],
  [[0.33, 0.2], [0.42, 0.25], [0.5, 0.25]],
  [[0.58, 0.25], [0.67, 0.2], [0.62, 0.08]],
  [[0.58, -0.02], [0.65, 0], [1, 0]],
];

/** How far a tab reaches past its cell, as a fraction of the cell edge. */
export const TAB_REACH = 0.25;

const fmt = (n: number) => Math.round(n * 100) / 100;

/** One edge from p0 to p1, bulging along `normal` (outward) for a tab. */
function edgeSegments(p0: Pt, p1: Pt, normal: Pt, kind: Edge): string {
  if (kind === 'flat') return `L ${fmt(p1[0])} ${fmt(p1[1])}`;
  const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  const sign = kind === 'tab' ? 1 : -1;
  const at = ([u, v]: [number, number]): string => {
    const x = p0[0] + (p1[0] - p0[0]) * u + normal[0] * v * len * sign;
    const y = p0[1] + (p1[1] - p0[1]) * u + normal[1] * v * len * sign;
    return `${fmt(x)} ${fmt(y)}`;
  };
  return BUMP.map(([c1, c2, end]) => `C ${at(c1)}, ${at(c2)}, ${at(end)}`).join(' ');
}

/**
 * The SVG path for one piece in a w×h cell, clockwise from the top-left corner.
 */
export function piecePath(edges: PieceEdges, w: number, h: number): string {
  return [
    'M 0 0',
    edgeSegments([0, 0], [w, 0], [0, -1], edges.top),
    edgeSegments([w, 0], [w, h], [1, 0], edges.right),
    edgeSegments([w, h], [0, h], [0, 1], edges.bottom),
    edgeSegments([0, h], [0, 0], [-1, 0], edges.left),
    'Z',
  ].join(' ');
}

/** Every x,y coordinate in a path string, for tests and bounds checks. */
export function pathPoints(d: string): Pt[] {
  const nums = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  const pts: Pt[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i]!, nums[i + 1]!]);
  return pts;
}

/** A stable but scattered rotation (degrees) for a bench piece, so the picture
 *  is hard to read before placing. */
export function benchAngle(index: number, seed = 3): number {
  const r = rand(seed + index * 17);
  return Math.round((r * 50 - 25) * 10) / 10; // -25°..+25°
}
