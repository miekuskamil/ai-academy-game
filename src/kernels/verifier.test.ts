import { describe, expect, it } from 'vitest';
import { ANSWERS, scoreCare, type Care } from './verifier';

describe('verifier', () => {
  it('covers all three care levels', () => {
    const cares = new Set(ANSWERS.map((a) => a.care));
    expect(cares.has('trust')).toBe(true);
    expect(cares.has('check')).toBe(true);
    expect(cares.has('grown-up')).toBe(true);
  });
  it('scores a perfect run', () => {
    const guesses = Object.fromEntries(ANSWERS.map((a) => [a.id, a.care])) as Record<string, Care>;
    const r = scoreCare(guesses);
    expect(r.correct).toBe(ANSWERS.length);
    expect(r.done).toBe(true);
  });
  it('does not credit a wrong care level', () => {
    const a = ANSWERS[0]!;
    const wrong: Care = a.care === 'trust' ? 'check' : 'trust';
    expect(scoreCare({ [a.id]: wrong }).correct).toBe(0);
  });
  it('every answer explains itself', () => {
    for (const a of ANSWERS) expect(a.why.length).toBeGreaterThan(20);
  });
});
