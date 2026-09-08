import { describe, expect, it } from 'vitest';
import { LevelPolicy } from './LevelPolicy';
import { testCurriculum } from '../../test/factory';
import type { LessonRecord } from '../progress/state';

function record(id: string, best: number): LessonRecord {
  return {
    lessonId: id,
    best,
    attempts: 1,
    bestUnaided: true,
    completedAt: best >= 0.6 ? '2026-01-01T00:00:00.000Z' : null,
    lastSeenAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('LevelPolicy', () => {
  const policy = new LevelPolicy(testCurriculum());

  it('starts every learner at level 1 with no progress', () => {
    const state = policy.evaluate({});
    expect(state.level).toBe(1);
    expect(state.points).toBe(0);
    expect(state.fraction).toBe(0);
  });

  it('weights deeper lessons more heavily than shallow ones', () => {
    expect(policy.points({ a: record('a', 1) })).toBe(1);
    expect(policy.points({ c: record('c', 1) })).toBe(3);
  });

  it('ignores lessons that were attempted but not cleared', () => {
    expect(policy.points({ a: record('a', 0.59) })).toBe(0);
    expect(policy.points({ a: record('a', 0.6) })).toBe(1);
  });

  it('raises the level as thresholds are crossed', () => {
    // thresholds [0, 2, 5, 9]
    expect(policy.fromPoints(0).level).toBe(1);
    expect(policy.fromPoints(1).level).toBe(1);
    expect(policy.fromPoints(2).level).toBe(2);
    expect(policy.fromPoints(5).level).toBe(3);
    expect(policy.fromPoints(9).level).toBe(4);
  });

  it('reports fractional progress through the current level', () => {
    const state = policy.fromPoints(3); // between 2 and 5
    expect(state.level).toBe(2);
    expect(state.floor).toBe(2);
    expect(state.next).toBe(5);
    expect(state.fraction).toBeCloseTo(1 / 3, 5);
  });

  it('caps cleanly at the top threshold', () => {
    const state = policy.fromPoints(999);
    expect(state.level).toBe(4);
    expect(state.next).toBeNull();
    expect(state.fraction).toBe(1);
  });

  it('is a pure function of records, so it cannot desynchronise', () => {
    const records = { a: record('a', 1), b: record('b', 1) };
    expect(policy.evaluate(records)).toEqual(policy.evaluate(records));
  });

  it('maps levels onto narrative chapters', () => {
    expect(policy.chapterFor(1)).toBe(1);
    expect(policy.chapterFor(3)).toBe(2);
    expect(policy.chapterFor(6)).toBe(3);
    expect(policy.chapterFor(9)).toBe(4);
    expect(policy.chapterFor(12)).toBe(5);
  });
});
