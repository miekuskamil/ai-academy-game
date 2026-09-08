import { describe, expect, it } from 'vitest';
import { CLAIMS, scoreGuesses } from './hallucination';
import { TASKS, scoreSort, type Bin } from './taskSorter';

describe('hallucination spotter', () => {
  it('has a mix of real and made-up claims', () => {
    const real = CLAIMS.filter((c) => c.real).length;
    const fake = CLAIMS.filter((c) => !c.real).length;
    expect(real).toBeGreaterThan(1);
    expect(fake).toBeGreaterThan(1);
  });

  it('scores a perfect run', () => {
    const guesses = Object.fromEntries(CLAIMS.map((c) => [c.id, c.real]));
    const r = scoreGuesses(guesses);
    expect(r.correct).toBe(CLAIMS.length);
    expect(r.done).toBe(true);
  });

  it('marks a wrong guess wrong', () => {
    const first = CLAIMS[0]!;
    const r = scoreGuesses({ [first.id]: !first.real });
    expect(r.correct).toBe(0);
    expect(r.done).toBe(false);
  });

  it('every claim explains itself', () => {
    for (const c of CLAIMS) expect(c.why.length).toBeGreaterThan(15);
  });
});

describe('task sorter', () => {
  it('covers all three bins', () => {
    const bins = new Set(TASKS.map((t) => t.best));
    expect(bins.has('ask-ai')).toBe(true);
    expect(bins.has('myself')).toBe(true);
    expect(bins.has('check')).toBe(true);
  });

  it('scores a perfect sort', () => {
    const placements = Object.fromEntries(TASKS.map((t) => [t.id, t.best])) as Record<string, Bin>;
    const r = scoreSort(placements);
    expect(r.correct).toBe(TASKS.length);
    expect(r.done).toBe(true);
  });

  it('counts only correct bins', () => {
    const t = TASKS[0]!;
    const wrong: Bin = t.best === 'ask-ai' ? 'myself' : 'ask-ai';
    expect(scoreSort({ [t.id]: wrong }).correct).toBe(0);
  });
});
