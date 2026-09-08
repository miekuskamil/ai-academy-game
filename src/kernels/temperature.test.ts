import { describe, expect, it } from 'vitest';
import { answerAt, varietyAt, bandFor, TEMP_DEMO } from './temperature';

describe('temperature dial', () => {
  it('returns the safe answer at the very low end', () => {
    // With temp 0, no roll can fall below it, so always the safe answer.
    for (const roll of [0.01, 0.3, 0.6, 0.99]) {
      expect(answerAt(0, roll)).toBe(TEMP_DEMO.safe);
    }
  });

  it('produces more variety high than low', () => {
    expect(varietyAt(0.9)).toBeGreaterThan(varietyAt(0.05));
  });

  it('bands the dial into steady, balanced, wild', () => {
    expect(bandFor(0.1)).toBe('steady');
    expect(bandFor(0.5)).toBe('balanced');
    expect(bandFor(0.9)).toBe('wild');
  });

  it('clamps out-of-range temperatures', () => {
    expect(answerAt(-1, 0.99)).toBe(TEMP_DEMO.safe);
    expect(typeof answerAt(2, 0.1)).toBe('string');
  });
});
