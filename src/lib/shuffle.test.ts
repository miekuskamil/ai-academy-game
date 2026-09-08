import { describe, expect, it } from 'vitest';
import { shuffled, permutation } from './shuffle';

describe('shuffled', () => {
  it('keeps every element, losing none and inventing none', () => {
    const input = ['a', 'b', 'c', 'd', 'e'];
    expect([...shuffled(input, 42)].sort()).toEqual([...input].sort());
  });

  it('is deterministic for a given seed, so a re-render is stable', () => {
    expect(shuffled([1, 2, 3, 4, 5], 7)).toEqual(shuffled([1, 2, 3, 4, 5], 7));
  });

  it('gives different orders for different seeds', () => {
    const a = shuffled([1, 2, 3, 4, 5, 6], 1);
    const b = shuffled([1, 2, 3, 4, 5, 6], 2);
    expect(a).not.toEqual(b);
  });

  it('does not mutate the input', () => {
    const input = [1, 2, 3];
    shuffled(input, 99);
    expect(input).toEqual([1, 2, 3]);
  });
});

describe('permutation', () => {
  it('is a genuine permutation of 0..n', () => {
    const p = permutation(5, 123);
    expect([...p].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
  });

  it('lets the grader keep scoring against original indices', () => {
    // Display order changes, but the map points back to the real positions.
    const p = permutation(4, 55);
    const original = ['correct', 'wrong', 'wrong', 'wrong'];
    const shownAs = p.map((i) => original[i]);
    // Wherever "correct" now appears, its original index is still 0.
    const shownPosition = shownAs.indexOf('correct');
    expect(p[shownPosition]).toBe(0);
  });
});
