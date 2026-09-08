/**
 * Deterministic-per-attempt shuffling.
 *
 * Questions and their answer options are reordered each time a lesson is
 * attempted, so nothing can be memorised by position ("it's always the third
 * one"). The seed changes per attempt but is fixed *within* an attempt, so a
 * re-render does not reshuffle the options out from under a half-made choice.
 */

/** Mulberry32: tiny, fast, good enough for shuffling a handful of items. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fresh copy, Fisher–Yates shuffled with the given seed. */
export function shuffled<T>(items: readonly T[], seed: number): T[] {
  const out = items.slice();
  const next = rng(seed);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * A permutation of [0..n): the order to display option indices in.
 *
 * Returned as an index map rather than shuffled data so the grader still scores
 * against the *original* indices — the display order never touches correctness.
 */
export function permutation(n: number, seed: number): number[] {
  return shuffled(
    Array.from({ length: n }, (_, i) => i),
    seed,
  );
}
