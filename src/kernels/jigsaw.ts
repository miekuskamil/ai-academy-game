/**
 * Jigsaw geometry.
 *
 * Turns a rows×cols grid into interlocking puzzle pieces. Each interior edge gets
 * a tab on one piece and a matching blank on its neighbour, so pieces only fit
 * their true place. Pure maths — no React — so the shapes are testable and the
 * same layout renders identically on the bench and in the board.
 *
 * A piece's SVG path is built in its own local cell box (0..cellW, 0..cellH),
 * with tabs bulging outside that box. The consumer places the piece with a
 * translate to its grid position, so tabs overlap the neighbour cleanly.
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
  // Decide horizontal seams (between col c and c+1) and vertical seams
  // (between row r and r+1). true = the left/top piece bulges a tab rightwards
  // /downwards; the neighbour gets the matching blank.
  const vSeam = (r: number, c: number) => rand(seed + r * 97 + c * 31) > 0.5; // between (r,c) and (r,c+1)
  const hSeam = (r: number, c: number) => rand(seed + 500 + r * 53 + c * 71) > 0.5; // between (r,c) and (r+1,c)

  const plans: PiecePlan[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const left: Edge =
        c === 0 ? 'flat' : vSeam(r, c - 1) ? 'blank' : 'tab';
      const right: Edge =
        c === cols - 1 ? 'flat' : vSeam(r, c) ? 'tab' : 'blank';
      const top: Edge =
        r === 0 ? 'flat' : hSeam(r - 1, c) ? 'blank' : 'tab';
      const bottom: Edge =
        r === rows - 1 ? 'flat' : hSeam(r, c) ? 'tab' : 'blank';
      plans.push({ index: r * cols + c, row: r, col: c, edges: { top, right, bottom, left } });
    }
  }
  return plans;
}

/**
 * Build the SVG path for one piece in a cell of size w×h. Tabs bulge outward by
 * `neck` sized knobs. The path starts at the top-left corner and runs clockwise.
 */
export function piecePath(edges: PieceEdges, w: number, h: number): string {
  const t = Math.min(w, h) * 0.2; // knob size
  const p: string[] = [];
  p.push(`M 0 0`);

  // top: left -> right
  p.push(edgePath(edges.top, w, 0, 0, 'h', t));
  // right: top -> bottom
  p.push(edgePath(edges.right, h, w, 0, 'v', t));
  // bottom: right -> left
  p.push(edgePath(edges.bottom, w, w, h, 'H', t, true));
  // left: bottom -> top
  p.push(edgePath(edges.left, h, 0, h, 'V', t, true));

  p.push('Z');
  return p.join(' ');
}

/**
 * One edge as a path segment. `len` is edge length, `axis` h/v/H/V picks the
 * straight fallback direction, `reverse` runs it backwards (for bottom/left).
 * A tab bulges outward from the piece; a blank bites inward. The direction of
 * "outward" flips per edge, handled by the sign choices below.
 */
function edgePath(
  edge: Edge,
  len: number,
  _sx: number,
  _sy: number,
  axis: 'h' | 'v' | 'H' | 'V',
  t: number,
  reverse = false,
): string {
  const a = len * 0.4; // start of knob
  const b = len * 0.6; // end of knob
  const dir = reverse ? -1 : 1;

  if (edge === 'flat') {
    return straight(axis, len * dir);
  }

  // out = +1 means the knob bulges in the "positive perpendicular" direction.
  // For top edge (h) positive-y is downward = inward, so a tab must go negative.
  const isHorizontal = axis === 'h' || axis === 'H';
  const outward = edge === 'tab' ? -1 : 1; // tab pops out (up/left of positive)
  const knob = t * outward * (isHorizontal ? 1 : 1);

  // Build three straight-ish runs with a bump using cubic curves for a rounded
  // knob. Coordinates are relative (lower-case c / l).
  const seg: string[] = [];
  if (axis === 'h') {
    seg.push(`l ${a * dir} 0`);
    seg.push(`c ${t * dir} ${knob}, ${(b - a + t) * dir} ${knob}, ${(b - a) * dir} 0`);
    seg.push(`l ${(len - b) * dir} 0`);
  } else if (axis === 'H') {
    seg.push(`l ${-a} 0`);
    seg.push(`c ${-t} ${knob}, ${-(b - a + t)} ${knob}, ${-(b - a)} 0`);
    seg.push(`l ${-(len - b)} 0`);
  } else if (axis === 'v') {
    seg.push(`l 0 ${a}`);
    seg.push(`c ${knob} ${t}, ${knob} ${(b - a + t)}, 0 ${(b - a)}`);
    seg.push(`l 0 ${len - b}`);
  } else {
    // V (upward)
    seg.push(`l 0 ${-a}`);
    seg.push(`c ${knob} ${-t}, ${knob} ${-(b - a + t)}, 0 ${-(b - a)}`);
    seg.push(`l 0 ${-(len - b)}`);
  }
  return seg.join(' ');
}

function straight(axis: 'h' | 'v' | 'H' | 'V', len: number): string {
  if (axis === 'h') return `l ${len} 0`;
  if (axis === 'H') return `l ${-Math.abs(len)} 0`;
  if (axis === 'v') return `l 0 ${len}`;
  return `l 0 ${-Math.abs(len)}`;
}

/** A stable but scattered rotation (degrees) for a bench piece, so the picture
 *  is hard to read before placing. Small angles keep it tidy on a phone. */
export function benchAngle(index: number, seed = 3): number {
  const r = rand(seed + index * 17);
  return Math.round((r * 40 - 20) * 10) / 10; // -20°..+20°
}
