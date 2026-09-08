import { describe, expect, it } from 'vitest';
import { UnlockPolicy } from './UnlockPolicy';
import { testCurriculum } from '../../test/factory';
import type { LessonRecord } from '../progress/state';

function record(id: string, best: number, unaided = true): LessonRecord {
  return {
    lessonId: id,
    best,
    attempts: 1,
    bestUnaided: unaided,
    completedAt: null,
    lastSeenAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('UnlockPolicy', () => {
  const policy = new UnlockPolicy(testCurriculum());

  it('opens only the entry lesson for a fresh learner', () => {
    const status = policy.evaluate({}, 'explorer');
    expect(status.a).toBe('open');
    expect(status.b).toBe('locked');
    expect(status.c).toBe('locked');
  });

  it('opens the next lesson once a prerequisite is cleared', () => {
    const status = policy.evaluate({ a: record('a', 0.7) }, 'explorer');
    expect(status.a).toBe('completed');
    expect(status.b).toBe('open');
  });

  it('does not unlock what follows until the completion bar is met', () => {
    const status = policy.evaluate({ a: record('a', 0.59) }, 'explorer');
    // Still open: an unfinished lesson stays available to retry, never locks.
    expect(status.a).toBe('open');
    expect(status.b).toBe('locked');
  });

  it('marks mastery only for a high score achieved without hints', () => {
    expect(policy.evaluate({ a: record('a', 0.95, true) }, 'explorer').a).toBe('mastered');
    expect(policy.evaluate({ a: record('a', 0.95, false) }, 'explorer').a).toBe('completed');
  });

  it('keeps mastery off the critical path — completion is what unlocks', () => {
    const status = policy.evaluate({ a: record('a', 0.6, false) }, 'explorer');
    expect(status.a).toBe('completed');
    expect(status.b).toBe('open');
  });

  it('filters the map by track without letting track block prerequisites', () => {
    const explorer = policy.evaluate({ a: record('a', 1), b: record('b', 1) }, 'explorer');
    expect(explorer.d).toBeUndefined();
    const builder = policy.evaluate({ a: record('a', 1), b: record('b', 1) }, 'builder');
    expect(builder.d).toBe('open');
  });

  it('reports which lessons became reachable', () => {
    const before = policy.evaluate({}, 'explorer');
    const after = policy.evaluate({ a: record('a', 1) }, 'explorer');
    expect(UnlockPolicy.newlyUnlocked(before, after)).toEqual(['b']);
  });
});
