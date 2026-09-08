/**
 * k-nearest neighbours, by hand.
 *
 * The first thing a learner trains. It is chosen over anything cleverer because
 * the whole algorithm fits in one sentence a ten-year-old can say back — "look
 * at the closest examples you have already seen, and go with whatever most of
 * them were" — and because it fails in a way she can *see*: leave a gap near
 * the boundary and the guesses go wrong exactly there.
 *
 * No React, no DOM, no randomness at call time. Everything here is a pure
 * function so it can be tested directly and, later, moved into a worker.
 */

export type Label = 0 | 1;

export interface LabelledPoint {
  /** 0..1 */
  x: number;
  /** 0..1 */
  y: number;
  label: Label;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * The pattern the learner is trying to discover, which she is never shown.
 *
 * A wavy diagonal rather than a straight line: a straight split can be captured
 * with two dots and teaches nothing, whereas a curve rewards putting examples
 * where the two colours actually meet.
 */
export function trueLabel(p: Point): Label {
  const boundary = 0.5 + 0.26 * Math.sin(p.y * Math.PI * 2.2);
  return p.x > boundary ? 1 : 0;
}

/** How close a point sits to the hidden boundary. Smaller is harder. */
export function boundaryDistance(p: Point): number {
  return Math.abs(p.x - (0.5 + 0.26 * Math.sin(p.y * Math.PI * 2.2)));
}

function distanceSquared(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/**
 * Classify one point.
 *
 * Returns null with no training data at all — a model that has seen nothing
 * should say so rather than guess, which is the honest behaviour and also the
 * one that sets up "I don't know" later in the course.
 */
export function classify(training: LabelledPoint[], query: Point, k = 3): Label | null {
  if (training.length === 0) return null;

  const ranked = training
    .map((point) => ({ point, d: distanceSquared(point, query) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, Math.min(k, training.length));

  let ones = 0;
  for (const { point } of ranked) if (point.label === 1) ones += 1;
  const zeros = ranked.length - ones;

  // A tie is broken by the single nearest neighbour, so the result is always
  // deterministic — she must be able to retry and get the same answer.
  if (ones === zeros) return ranked[0]!.point.label;
  return ones > zeros ? 1 : 0;
}

export interface TestOutcome {
  point: Point;
  expected: Label;
  guess: Label | null;
  correct: boolean;
}

export function evaluate(training: LabelledPoint[], tests: Point[], k = 3): TestOutcome[] {
  return tests.map((point) => {
    const expected = trueLabel(point);
    const guess = classify(training, point, k);
    return { point, expected, guess, correct: guess === expected };
  });
}

export function accuracy(outcomes: TestOutcome[]): number {
  if (outcomes.length === 0) return 0;
  return outcomes.filter((o) => o.correct).length / outcomes.length;
}

/**
 * A fixed test set, seeded so every learner faces the same ten dots and can
 * compare one attempt with the next.
 *
 * Deliberately weighted towards the boundary: a test set of easy corner points
 * would score well on a lazy model and teach the wrong lesson.
 */
export function testPoints(): Point[] {
  const seeded = mulberry32(20260806);
  const points: Point[] = [];
  let guard = 0;

  while (points.length < 10 && guard < 2000) {
    guard += 1;
    const p = { x: seeded(), y: seeded() };
    const near = boundaryDistance(p) < 0.18;
    // Weighted towards the awkward middle: a test set of easy corner dots would
    // reward a lazy model and teach exactly the wrong lesson.
    if (near || points.filter((q) => boundaryDistance(q) >= 0.18).length < 4) {
      points.push(p);
    }
  }
  return points;
}

/** Small deterministic PRNG. Keeps the test set identical across devices. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
